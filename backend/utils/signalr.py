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
        
        # Estas variables se definen pero se resetearán en cada reconexión
        self.state_cache = {}
        self.all_topics = [
            "Heartbeat", "CarData.z", "Position.z", "ExtrapolatedClock",
            "TimingStats", "TimingAppData", "WeatherData", "TrackStatus",
            "SessionStatus", "DriverList", "RaceControlMessages", "SessionInfo",
            "SessionData", "LapCount", "TimingData", "TeamRadio"
        ]

    def _recursive_clean(self, data):
        if isinstance(data, dict):
            return {k: self._recursive_clean(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [self._recursive_clean(i) for i in data]
        else:
            if data in [None, "NaN", "nan", "null"]: return ""
            return data

    async def start_async(self):
        self.is_running = True
        
        while self.is_running:
            try:
                # --- RESET TOTAL: Tratamos cada conexión como la primera vez ---
                self.state_cache = {} 
                print("🆕 F5 Detectado / Nueva Conexión: Reseteando todo el estado...")

                token, cookie = self.negotiate()
                if not token:
                    await asyncio.sleep(5)
                    continue

                ws_url = f"wss://livetiming.formula1.com/signalr/connect?clientProtocol=1.5&transport=webSockets&connectionData={urllib.parse.quote(self.hub_data)}&connectionToken={urllib.parse.quote(token)}"

                async with connect(ws_url, extra_headers={"Cookie": cookie, "User-Agent": "Mozilla/5.0"}) as ws:
                    # 1. Suscripción limpia
                    await ws.send(json.dumps({"H": "Streaming", "M": "Subscribe", "A": [self.all_topics], "I": 1}))

                    # 2. Petición de Snapshots (como si fuera el primer arranque de la app)
                    # El orden es vital: DriverList primero para tener los nombres, luego telemetría
                    critical_snapshots = ["DriverList", "SessionInfo", "TimingData", "TimingAppData", "Position.z"]
                    
                    for i, topic in enumerate(critical_snapshots):
                        await ws.send(json.dumps({
                            "H": "Streaming",
                            "M": "ProcessHubMessage",
                            "A": ["RequestSnapshot", topic],
                            "I": i + 10
                        }))

                    async for raw in ws:
                        packet = json.loads(raw)
                        
                        # Manejo de las respuestas a los Snapshots (R)
                        if "R" in packet and packet["R"]:
                            data = self.decode(packet["R"])
                            if isinstance(data, dict):
                                for topic, content in data.items():
                                    clean_content = self._recursive_clean(content)
                                    self.state_cache[topic] = clean_content
                                    # Enviamos el snapshot íntegro al frontend
                                    await manager.broadcast("initial", topic, clean_content)

                        # Manejo del flujo en tiempo real (M)
                        if "M" in packet and isinstance(packet["M"], list):
                            for msg in packet["M"]:
                                if msg.get("M") == "feed":
                                    topic = msg["A"][0]
                                    content = self.decode(msg["A"][1])
                                    if content:
                                        clean_content = self._recursive_clean(content)
                                        # No guardamos caché compleja, solo notificamos el update
                                        await manager.broadcast("update", topic, clean_content)

            except Exception as e:
                print(f"⚠️ Error de conexión: {e}. Reiniciando flujo...")
                await asyncio.sleep(2)

    def decode(self, payload):
        if not payload: return None
        try:
            # Intentar descompresión (F1 usa zlib para .z topics)
            decoded = zlib.decompress(base64.b64decode(payload), -15).decode('utf-8')
            return json.loads(decoded)
        except:
            try: return json.loads(payload)
            except: return payload

    def negotiate(self):
        try:
            neg_url = f"{self.base_url}/negotiate?clientProtocol=1.5&connectionData={urllib.parse.quote(self.hub_data)}"
            r = requests.get(neg_url, headers={"User-Agent": "Mozilla/5.0"}, timeout=5)
            return r.json()['ConnectionToken'], "; ".join([f"{k}={v}" for k, v in r.cookies.get_dict().items()])
        except: return None, None

    def start(self):
        asyncio.run_coroutine_threadsafe(self.start_async(), self.main_loop)