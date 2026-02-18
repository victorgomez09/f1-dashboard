import asyncio
import json

class SSEManager:
    def __init__(self):
        self.queues: set[asyncio.Queue] = set()

    async def subscribe(self, bridge):
        queue = asyncio.Queue()
        if bridge and bridge.state_cache:
            for topic, content in bridge.state_cache.items():
                await queue.put({"event": "update", "data": json.dumps({topic: content})})
                await asyncio.sleep(0.01)
        self.queues.add(queue)
        try:
            while True: yield await queue.get()
        finally: self.queues.discard(queue)

    async def broadcast(self, event_type: str, category: str, data: dict):
        sse_dict = {"event": event_type, "data": json.dumps({category: data})}
        for queue in list(self.queues):
            try: queue.put_nowait(sse_dict)
            except: continue

manager = SSEManager()