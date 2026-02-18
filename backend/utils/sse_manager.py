import asyncio
import json

class SSEManager:
    def __init__(self):
        self.connections = set()

    async def subscribe(self):
        queue = asyncio.Queue(maxsize=1000)
        self.connections.add(queue)
        return queue

    def unsubscribe(self, queue):
        self.connections.discard(queue)

    async def broadcast(self, event_type, topic, data):
        if not self.connections:
            return

        payload = json.dumps({topic: data})
        msg = f"event: {event_type}\ndata: {payload}\n\n"

        tasks = [self._safe_put(q, msg) for q in list(self.connections)]
        await asyncio.gather(*tasks)

    async def send_to_queue(self, queue, event_type, topic, data):
        payload = json.dumps({topic: data})
        msg = f"event: {event_type}\ndata: {payload}\n\n"
        await self._safe_put(queue, msg)

    async def _safe_put(self, queue, message):
        try:
            await queue.put(message)
        except Exception:
            self.unsubscribe(queue)

manager = SSEManager()
