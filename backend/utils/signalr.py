import asyncio
import base64
import json
import zlib
import urllib.parse
import requests
from websockets.client import connect
from utils.sse_manager import manager

class F1SignalRBridge:
    def __init__(self, main_loop):
        self.main_loop = main_loop
        self.base_url = "https://livetiming.formula1.com/signalr"
        self.hub_data = json.dumps([{"name": "Streaming"}])
        self.is_running = False
        self.state_cache = {}
        self.all_topics = [
            "Heartbeat", "CarData.z", "Position.z", "ExtrapolatedClock",
            "TimingStats", "TimingAppData", "WeatherData", "TrackStatus",
            "SessionStatus", "DriverList", "RaceControlMessages", "SessionInfo",
            "SessionData", "LapCount", "TimingData", "TeamRadio"
        ]

    def _clean_value(self, value):
        """Evita que los 'NaN' o vacíos rompan el frontend"""
        if value in [None, "NaN", "nan", "null"]: return ""
        return value

    def _ensure_list(self, data, default_size=0):
        if isinstance(data, list): return data
        if not isinstance(data, dict): return []
        try:
            keys = [int(k) for k in data.keys() if k.isdigit()]
            if not keys: return []
            max_idx = max(keys)
            new_list = [None] * (max(max_idx + 1, default_size))
            for k, v in data.items():
                new_list[int(k)] = v
            return new_list
        except: return []

    def _normalize_timing_app_data(self, content):
        if "Lines" not in content: return content
        for driver_id in content["Lines"]:
            driver_data = content["Lines"][driver_id]
            if "Sectors" in driver_data:
                raw_sectors = self._ensure_list(driver_data["Sectors"], 3)
                normalized_sectors = []
                for s_data in raw_sectors:
                    if s_data is None:
                        normalized_sectors.append({"Segments": [], "Value": ""})
                    else:
                        if "Segments" in s_data:
                            s_data["Segments"] = self._ensure_list(s_data["Segments"])
                        if "Value" in s_data:
                            s_data["Value"] = self._clean_value(s_data["Value"])
                        normalized_sectors.append(s_data)
                driver_data["Sectors"] = normalized_sectors
        return content

    def _update_cache(self, topic, content):
        if content is None: return
        
        # Normalización agresiva
        if topic == "TimingAppData":
            content = self._normalize_timing_app_data(content)
        elif topic == "TimingData":
            if "Lines" in content:
                for d_id in content["Lines"]:
                    line = content["Lines"][d_id]
                    if "Sectors" in line:
                        line["Sectors"] = self._ensure_list(line["Sectors"], 3)
                    # Limpiar tiempos de vuelta NaN
                    for key in ["LastLapTime", "BestLapTime"]:
                        if key in line and isinstance(line[key], dict):
                            line[key]["Value"] = self._clean_value(line[key].get("Value"))

        if topic not in self.state_cache or not isinstance(content, dict):
            self.state_cache[topic] = content
        else:
            self._deep_merge(self.state_cache[topic], content)

    def _deep_merge(self, target, source):
        for k, v in source.items():
            # Si el valor de la fuente es "" o None, y ya teníamos algo, 
            # decidimos si sobreescribir para evitar el 'NaN'
            if v == "" or v is None:
                target[k] = "" # Forzamos vacío en lugar de mantener basura
                continue

            if k in target and isinstance(target[k], list) and isinstance(v, list):
                for i in range(len(v)):
                    if i < len(target[k]):
                        if v[i] is not None:
                            if isinstance(v[i], dict) and isinstance(target[k][i], dict):
                                self._deep_merge(target[k][i], v[i])
                            else: target[k][i] = v[i]
                    else: target[k].append(v[i])
            elif isinstance(v, dict) and k in target and isinstance(target[k], dict):
                self._deep_merge(target[k], v)
            else:
                target[k] = v

    def negotiate(self):
        try:
            neg_url = f"{self.base_url}/negotiate?clientProtocol=1.5&connectionData={urllib.parse.quote(self.hub_data)}"
            r = requests.get(neg_url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
            data = r.json()
            return urllib.parse.quote(data['ConnectionToken']), "; ".join([f"{k}={v}" for k, v in r.cookies.get_dict().items()])
        except Exception as e:
            print(f"❌ Negociación: {e}"); return None, None

    async def start_async(self):
        self.is_running = True
        while self.is_running:
            try:
                token, cookie = self.negotiate()
                if not token: await asyncio.sleep(5); continue
                ws_url = f"wss://livetiming.formula1.com/signalr/connect?clientProtocol=1.5&transport=webSockets&connectionData={urllib.parse.quote(self.hub_data)}&connectionToken={token}"
                
                async with connect(ws_url, extra_headers={"Cookie": cookie, "User-Agent": "Mozilla/5.0"}) as ws:
                    print("🏁 Bridge F1 Corregido y Limpiando NaN")
                    await ws.send(json.dumps({"H": "Streaming", "M": "Subscribe", "A": [self.all_topics], "I": 1}))
                    
                    for i, topic in enumerate(["SessionInfo", "DriverList", "TimingData", "TimingAppData"]):
                        await ws.send(json.dumps({"H": "Streaming", "M": "RequestSnapshot", "A": [topic], "I": i + 10}))
                        await asyncio.sleep(0.3)

                    async for raw in ws:
                        packet = json.loads(raw)
                        if "R" in packet and packet["R"]:
                            res = self.decode(packet["R"])
                            if isinstance(res, dict):
                                for t, c in res.items():
                                    self._update_cache(t, c)
                                    await manager.broadcast("initial", t, self.state_cache[t])
                        if "M" in packet and isinstance(packet["M"], list):
                            for msg in packet["M"]:
                                if msg.get("M") == "feed":
                                    t, c = msg["A"][0], self.decode(msg["A"][1])
                                    if c:
                                        self._update_cache(t, c)
                                        await manager.broadcast("update", t, c)
            except Exception as e:
                print(f"⚠️ Error: {e}"); await asyncio.sleep(5)

    def decode(self, payload):
        if not payload: return None
        try: return json.loads(zlib.decompress(base64.b64decode(payload), -15).decode('utf-8'))
        except: return payload if not isinstance(payload, str) else None

    def start(self):
        asyncio.run_coroutine_threadsafe(self.start_async(), self.main_loop)