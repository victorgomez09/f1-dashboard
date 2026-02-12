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
        self.initialized_categories = set()
        self.is_running = False
        self.all_topics = [
            "Heartbeat",
            "CarData.z",
            "Position.z",
            "ExtrapolatedClock",
            "TimingStats",
            "TimingAppData",
            "WeatherData",
            "TrackStatus",
            "SessionStatus",
            "DriverList",
            "RaceControlMessages",
            "SessionInfo",
            "SessionData",
            "LapCount",
            "TimingData",
            "TeamRadio",
            "ChampionshipPrediction"
        ]
        self.state_cache = {}

    def negotiate(self):
        negotiate_url = f"{self.base_url}/negotiate?clientProtocol=1.5&connectionData={urllib.parse.quote(self.hub_data)}"
        r = requests.get(negotiate_url, headers={"User-Agent": "Mozilla/5.0"})
        data = r.json()
        token = urllib.parse.quote(data['ConnectionToken'])
        cookie = "; ".join([f"{k}={v}" for k, v in r.cookies.get_dict().items()])
        return token, cookie

    async def start_async(self):
        self.is_running = True
        try:
            token, cookie = self.negotiate()
            ws_url = f"wss://livetiming.formula1.com/signalr/connect?clientProtocol=1.5&transport=webSockets&connectionData={urllib.parse.quote(self.hub_data)}&connectionToken={token}"
            
            async with connect(ws_url, extra_headers={"Cookie": cookie, "User-Agent": "Mozilla/5.0"}) as ws:
                # 1. Suscripción
                await ws.send(json.dumps({"H": "Streaming", "M": "Subscribe", "A": [self.all_topics], "I": 1}))
                await asyncio.sleep(1)

                # 2. Snapshots iniciales
                for topic in ["SessionInfo", "DriverList", "TimingData", "WeatherData", "SessionData"]:
                    await ws.send(json.dumps({"H": "Streaming", "M": "RequestSnapshot", "A": [topic], "I": 2}))
                    await asyncio.sleep(0.5)

                async for raw in ws:
                    packet = json.loads(raw)
                    
                    # PROCESAR SNAPSHOTS (R) - Datos iniciales
                    if "R" in packet and packet["R"]:
                        res = self.decode(packet["R"]) if isinstance(packet["R"], str) else packet["R"]
                        if isinstance(res, dict):
                            for category, content in res.items():
                                self.state_cache[category] = content
                                await manager.broadcast("initial", category, content)

                    # PROCESAR FEED EN VIVO (M) - Actualizaciones
                    # Primero verificamos que 'M' exista para evitar el Error Bridge: 'M'
                    if "M" in packet and isinstance(packet["M"], list):
                        updates_to_send = {}
                        
                        for msg in packet["M"]:
                            if msg.get("M") == "feed":
                                topic = msg["A"][0]
                                content = msg["A"][1]
                                if isinstance(content, str): content = self.decode(content)

                                if topic in ["Position.z", "CarData.z"]:
                                    await manager.broadcast("update", topic, content)

                                if topic == "Heartbeat":
                                    # El Heartbeat es el metrónomo. Enviarlo al instante es clave.
                                    await manager.broadcast("update", topic, content)
                                    continue # Saltamos al siguiente mensaje para que no entre en el bulk
                                else:
                                    # El resto de datos (tiempos, clima) sí pueden esperar al bulk
                                    updates_to_send[topic] = content

                                if topic == "SessionStatus":
                                    status = content.get("Status")
                                    if status in ["Stopped", "Aborted"]:
                                        print(f"🏁 Sesión finalizada: {status}")
                                        self.session_active = False
                                        
                                if topic == "TrackStatus":
                                    track_status = content.get("Status")
                                    if track_status == "7": # Fin de sesión
                                        print("🏁 Bandera a cuadros detectada.")
                        
                        # Enviamos el paquete de updates agrupado una sola vez al final del ciclo
                        if updates_to_send:
                            await manager.broadcast_bulk("update", updates_to_send)

        except Exception as e:
            print(f"⚠️ Error Bridge: {e}")
            await asyncio.sleep(5)
            if self.is_running:
                await self.start_async()

    def decode(self, payload):
        try:
            return json.loads(zlib.decompress(base64.b64decode(payload), -15).decode('utf-8'))
        except: return None

    def start(self):
        asyncio.run_coroutine_threadsafe(self.start_async(), self.main_loop)