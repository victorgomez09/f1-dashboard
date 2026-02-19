import asyncio
import base64
import json
import zlib
import urllib.parse
import requests
import traceback
from websockets.client import connect
from utils.sse_manager import manager

class F1SignalRBridge:
    def __init__(self, main_loop):
        self.main_loop = main_loop
        self.base_url = "https://livetiming.formula1.com/signalr"
        self.hub_data = json.dumps([{"name": "Streaming"}])
        self.is_running = False
        self.state_cache = {}
        self.initialized_topics = set()
        self.all_topics = [
            "Heartbeat", "CarData.z", "Position.z", "ExtrapolatedClock",
            "TimingStats", "TimingAppData", "WeatherData", "TrackStatus",
            "SessionStatus", "DriverList", "RaceControlMessages", "SessionInfo",
            "SessionData", "LapCount", "TimingData", "TeamRadio"
        ]
        self.segments_map = [8, 8, 8]

    def _clean_value(self, value):
        if value in [None, "NaN", "nan", "null", "N/A"]: return ""
        return value

    def _recursive_clean(self, data):
        if isinstance(data, dict):
            return {k: self._recursive_clean(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [self._recursive_clean(i) for i in data]
        else: return self._clean_value(data)

    def _ensure_list(self, data, default_size=0):
        if isinstance(data, list): return data
        if not isinstance(data, dict): return []
        try:
            keys = [int(k) for k in data.keys() if k.isdigit()]
            if not keys: return []
            max_idx = max(keys)
            new_list = [None] * (max(max_idx + 1, default_size))
            for k, v in data.items(): new_list[int(k)] = v
            return new_list
        except: return []

    def _update_cache(self, topic, content):
        if content is None: return
        content = self._recursive_clean(content)
        
        if topic not in self.state_cache: self.state_cache[topic] = {}

        # Si es un snapshot inicial de TimingData, nos aseguramos de que tenga estructura
        if topic == "TimingData" and "Lines" in content:
            for d_id, line in content["Lines"].items():
                if "Sectors" in line:
                    # Convertimos a lista para que el orden sea correcto
                    line["Sectors"] = self._ensure_list(line["Sectors"])
                    for sector in line["Sectors"]:
                        if isinstance(sector, dict) and "Segments" not in sector:
                            # Si no hay segmentos, inicializamos como array vacío 
                            # para que no sea 'None' y rompa el front
                            sector["Segments"] = []

        self._deep_merge(self.state_cache[topic], content)

    def _merge_segments_only(self, target_driver, app_sectors):
        """Inyecta micro-sectores de AppData en TimingData sin pisotear tiempos."""
        if "Sectors" not in target_driver: return
        target_sectors = target_driver["Sectors"]
        app_sectors = self._ensure_list(app_sectors)
        
        for i, app_s in enumerate(app_sectors):
            if i < len(target_sectors) and isinstance(app_s, dict) and "Segments" in app_s:
                if isinstance(target_sectors[i], dict):
                    # Solo actualizamos los segmentos, preservamos el resto (Value, etc)
                    target_sectors[i]["Segments"] = app_s["Segments"]

    def _deep_merge(self, target, source):
        for k, v in source.items():
            # Caso especial: Sectores y sus tiempos/micro-sectores
            if k == "Sectors" and isinstance(v, list) and k in target:
                for i in range(len(v)):
                    if i < len(target[k]) and isinstance(v[i], dict) and isinstance(target[k][i], dict):
                        
                        # PROTECCIÓN DE SEGMENTOS (Ya la teníamos)
                        if "Segments" not in v[i] and "Segments" in target[k][i]:
                            v[i]["Segments"] = target[k][i]["Segments"]
                        
                        # --- NUEVA PROTECCIÓN DE TIEMPOS ---
                        # Si el nuevo valor 'Value' es nulo o vacío, pero en la caché ya hay un tiempo,
                        # NO permitimos que se borre. Mantenemos el de la caché.
                        new_val = v[i].get("Value")
                        old_val = target[k][i].get("Value")
                        
                        if (not new_val or new_val in ["", "-- ---", None]) and old_val:
                            v[i]["Value"] = old_val

                        target[k][i].update(v[i])
                    elif i >= len(target[k]):
                        target[k].append(v[i])
            
            elif k in target and isinstance(target[k], dict) and isinstance(v, dict):
                self._deep_merge(target[k], v)
            else:
                target[k] = v

    def negotiate(self):
        try:
            neg_url = f"{self.base_url}/negotiate?clientProtocol=1.5&connectionData={urllib.parse.quote(self.hub_data)}"
            r = requests.get(neg_url, headers={"User-Agent": "Mozilla/5.0"}, timeout=5)
            data = r.json()
            return data['ConnectionToken'], "; ".join([f"{k}={v}" for k, v in r.cookies.get_dict().items()])
        except: return None, None

    def decode(self, payload):
        if not payload: 
            return None
        
        # 1. Intentar como JSON puro (algunas respuestas R vienen así)
        if isinstance(payload, dict):
            return payload
        
        try:
            # 2. Intentar descompresión zlib (Formato estándar .z)
            decoded = zlib.decompress(base64.b64decode(payload), -15).decode('utf-8')
            return json.loads(decoded)
        except Exception:
            try:
                # 3. Intentar cargar como string JSON directo si no es base64
                return json.loads(payload)
            except Exception:
                # print(f"❌ Error decodificando: {payload[:50]}...")
                return None

    async def start_async(self):
        self.is_running = True
        while self.is_running:
            try:
                token, cookie = self.negotiate()
                if not token: await asyncio.sleep(5); continue
                
                ws_url = f"wss://livetiming.formula1.com/signalr/connect?clientProtocol=1.5&transport=webSockets&connectionData={urllib.parse.quote(self.hub_data)}&connectionToken={urllib.parse.quote(token)}"
                
                async with connect(ws_url, extra_headers={"Cookie": cookie, "User-Agent": "Mozilla/5.0"}) as ws:
                    print("🏁 Bridge F1: Conectado")
                    
                    # 1. Suscribirse
                    await ws.send(json.dumps({"H": "Streaming", "M": "Subscribe", "A": [self.all_topics], "I": 1}))
                    
                    # 2. SNAPSHOTS (Cambiado a 'ProcessHubMessage')
                    for i, t in enumerate(["SessionInfo", "DriverList", "TimingData", "TimingAppData"]):
                        # El protocolo actual de la F1 espera esto:
                        await ws.send(json.dumps({
                            "H": "Streaming", 
                            "M": "ProcessHubMessage", 
                            "A": ["RequestSnapshot", t], 
                            "I": i + 10
                        }))

                    async for raw in ws:
                        packet = json.loads(raw)
                        if not packet: continue

                        # CASO R: Ahora sí debería llegar la respuesta del snapshot
                        if "R" in packet and packet["R"]:
                            res = self.decode(packet["R"])
                            if isinstance(res, dict):
                                for t, c in res.items():
                                    self._update_cache(t, c)
                                    self.initialized_topics.add(t)
                                    print(f"✅ Snapshot OK: {t}")
                                    await manager.broadcast("initial", t, self.state_cache[t])

                        # CASO M: Feed normal
                        if "M" in packet and isinstance(packet["M"], list):
                            for msg in packet["M"]:
                                if isinstance(msg, dict) and msg.get("M") == "feed":
                                    t, c = msg["A"][0], self.decode(msg["A"][1])
                                    if not c: continue
                                    
                                    self._update_cache(t, c)
                                    if t not in self.initialized_topics:
                                        self.initialized_topics.add(t)
                                        await manager.broadcast("initial", t, self.state_cache[t])
                                    else:
                                        await manager.broadcast("update", t, c)
                                        
            except Exception:
                print(f"⚠️ Error: {traceback.format_exc()}")
                await asyncio.sleep(5)

    def start(self):
        asyncio.run_coroutine_threadsafe(self.start_async(), self.main_loop)