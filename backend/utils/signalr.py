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
        self.ws = None
        self.is_running = False
        self.is_synced = False
        self.state_cache = {}
        self.msg_id_counter = 1000

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
            "ChampionshipPrediction",
        ]

        self.required_topics = set(self.all_topics)

    # ---------------- SIGNALR ----------------

    def negotiate(self):
        try:
            neg_url = f"{self.base_url}/negotiate?clientProtocol=1.5&connectionData={urllib.parse.quote(self.hub_data)}"
            r = requests.get(neg_url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
            data = r.json()
            token = urllib.parse.quote(data["ConnectionToken"])
            cookie = "; ".join([f"{k}={v}" for k, v in r.cookies.get_dict().items()])
            return token, cookie
        except Exception as e:
            print(f"❌ Error negociación: {e}")
            return None, None

    async def start_async(self):
        self.is_running = True
        while self.is_running:
            try:
                token, cookie = self.negotiate()
                if not token:
                    await asyncio.sleep(5)
                    continue

                ws_url = f"wss://livetiming.formula1.com/signalr/connect?clientProtocol=1.5&transport=webSockets&connectionData={urllib.parse.quote(self.hub_data)}&connectionToken={token}"

                async with connect(ws_url, extra_headers={"Cookie": cookie, "User-Agent": "Mozilla/5.0"}) as ws:
                    self.ws = ws
                    self.is_synced = False
                    print("🏁 Bridge Conectado a F1")

                    await ws.send(json.dumps({
                        "H": "Streaming",
                        "M": "Subscribe",
                        "A": [self.all_topics],
                        "I": 1
                    }))

                    await self.force_resync_bridge()

                    async for raw in ws:
                        packet = json.loads(raw)
                        await self.process_packet(packet)

            except Exception as e:
                print(f"⚠️ Conexión perdida: {e}. Reintentando...")
                self.ws = None
                self.is_synced = False
                await asyncio.sleep(5)

    async def force_resync_bridge(self):
        if self.is_synced:
            return

        print("🔄 Sincronizando Bridge con F1...")
        for topic in self.all_topics:
            if self.ws and self.ws.open:
                self.msg_id_counter += 1
                await self.ws.send(json.dumps({
                    "H": "Streaming",
                    "M": "RequestSnapshot",
                    "A": [topic],
                    "I": self.msg_id_counter
                }))
                await asyncio.sleep(0.5)

        self.is_synced = True
        print("✅ Bridge Sincronizado.")

    # ---------------- CACHE READY ----------------

    def is_cache_ready(self):
        return self.required_topics.issubset(self.state_cache.keys())

    # ---------------- PROCESAMIENTO ----------------

    async def process_packet(self, packet):
        if "R" in packet and packet["R"]:
            data = self.decode(packet["R"])
            if isinstance(data, dict):
                for topic, content in data.items():
                    self._update_cache(topic, content)
                    await manager.broadcast("initial", topic, content)

        elif "M" in packet and isinstance(packet["M"], list):
            for msg in packet["M"]:
                if msg.get("M") == "feed":
                    topic, content = msg["A"][0], self.decode(msg["A"][1])
                    if content:
                        self._update_cache(topic, content)
                        await manager.broadcast("update", topic, content)

    def _update_cache(self, topic, content):
        if topic not in self.state_cache or not isinstance(content, dict):
            self.state_cache[topic] = content
        else:
            def merge(target, source):
                for k, v in source.items():
                    if isinstance(v, dict) and k in target and isinstance(target[k], dict):
                        merge(target[k], v)
                    else:
                        target[k] = v
            merge(self.state_cache[topic], content)

    # ---------------- HANDSHAKE CLIENTE ----------------

    async def sync_client(self, queue):
        timeout = 5
        start = asyncio.get_event_loop().time()

        while not self.is_cache_ready():
            if asyncio.get_event_loop().time() - start > timeout:
                print("⚠️ Cache incompleto, enviando snapshot parcial")
                break
            await asyncio.sleep(0.1)

        print("📦 Snapshot enviado con topics:", list(self.state_cache.keys()))

        await manager.send_to_queue(queue, "reset", "all", {})

        for topic, content in self.state_cache.items():
            await manager.send_to_queue(queue, "update", topic, content)

    # ---------------- UTIL ----------------

    def decode(self, payload):
        if not payload:
            return None
        try:
            if isinstance(payload, str):
                decoded = base64.b64decode(payload)
                return json.loads(zlib.decompress(decoded, -15).decode("utf-8"))
            return payload
        except Exception:
            return None

    def start(self):
        self.main_loop.create_task(self.start_async())
