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
        self.session_active = True
        self.all_topics = [
            "Heartbeat", "CarData.z", "Position.z", "ExtrapolatedClock",
            "TimingStats", "TimingAppData", "WeatherData", "TrackStatus",
            "SessionStatus", "DriverList", "RaceControlMessages", "SessionInfo",
            "SessionData", "LapCount", "TimingData", "TeamRadio", "ChampionshipPrediction"
        ]
        
        # 🚩 CACHE DE ESTADO: Mantiene la "foto" actual para nuevos clientes (F5)
        self.state_cache = {}

    def negotiate(self):
        try:
            negotiate_url = f"{self.base_url}/negotiate?clientProtocol=1.5&connectionData={urllib.parse.quote(self.hub_data)}"
            r = requests.get(negotiate_url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
            data = r.json()
            token = urllib.parse.quote(data['ConnectionToken'])
            cookie = "; ".join([f"{k}={v}" for k, v in r.cookies.get_dict().items()])
            return token, cookie
        except Exception as e:
            print(f"❌ Error en negociación: {e}")
            return None, None

    async def start_async(self):
        self.is_running = True
        print("🚀 Iniciando Bridge de F1 SignalR...")
        
        try:
            token, cookie = self.negotiate()
            if not token: raise Exception("No se pudo obtener el token de conexión")

            ws_url = f"wss://livetiming.formula1.com/signalr/connect?clientProtocol=1.5&transport=webSockets&connectionData={urllib.parse.quote(self.hub_data)}&connectionToken={token}"
            
            async with connect(ws_url, extra_headers={"Cookie": cookie, "User-Agent": "Mozilla/5.0"}) as ws:
                # 1. Suscripción inicial
                await ws.send(json.dumps({"H": "Streaming", "M": "Subscribe", "A": [self.all_topics], "I": 1}))
                await asyncio.sleep(2) 

                # 2. Solicitar Snapshots (Solo al arrancar el backend)
                initial_topics = ["SessionInfo", "DriverList", "TimingData", "TimingAppData", "SessionData"]
                for i, topic in enumerate(initial_topics):
                    await ws.send(json.dumps({
                        "H": "Streaming", 
                        "M": "RequestSnapshot", 
                        "A": [topic], 
                        "I": i + 10
                    }))
                    await asyncio.sleep(0.3)

                async for raw in ws:
                    packet = json.loads(raw)
                    
                    if "R" in packet and packet["R"]:
                        res = self.decode(packet["R"]) if isinstance(packet["R"], str) else packet["R"]
                        
                        if isinstance(res, dict):
                            for topic, content in res.items():
                                # Enviamos cada tópico del snapshot individualmente
                                await manager.broadcast("initial", topic, content)

                    # Si es feed en vivo (M)
                    if "M" in packet and isinstance(packet["M"], list):
                        for msg in packet["M"]:
                            if msg.get("M") == "feed":
                                topic = msg["A"][0]
                                content = self.decode(msg["A"][1])
                                await manager.broadcast("update", topic, content)
                                
        except Exception as e:
            print(f"⚠️ Error en el bucle del Bridge: {e}")
            self.is_running = False
            await asyncio.sleep(5)
            await self.start_async()

    def decode(self, payload):
        if not payload: return None
        try:
            # SignalR usa raw DEFLATE sin cabeceras
            decoded = base64.b64decode(payload)
            return json.loads(zlib.decompress(decoded, -15).decode('utf-8'))
        except Exception:
            try:
                return json.loads(payload) if isinstance(payload, str) else payload
            except:
                return None

    def start(self):
        asyncio.run_coroutine_threadsafe(self.start_async(), self.main_loop)