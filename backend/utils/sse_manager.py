import asyncio
import json

class SSEManager:
    def __init__(self):
        self.queues: set[asyncio.Queue] = set()

    async def subscribe(self, bridge):
        queue = asyncio.Queue()

        if bridge and hasattr(bridge, 'state_cache'):
            # 1. DEFINIMOS EL ORDEN DE PRIORIDAD
            # Primero lo estructural para que los componentes no den error de 'undefined'
            priority_order = ["SessionInfo", "DriverList", "SessionData", "TimingData"]
            
            # Enviamos primero lo prioritario
            for category in priority_order:
                if category in bridge.state_cache:
                    content = bridge.state_cache[category]
                    payload = {category: content}
                    await queue.put({
                        "event": "initial",
                        "data": json.dumps(payload)
                    })

            # 2. Enviamos el resto de categorías que estén en caché
            for category, content in bridge.state_cache.items():
                if category not in priority_order:
                    payload = {category: content}
                    await queue.put({
                        "event": "update",
                        "data": json.dumps(payload)
                    })

        self.queues.add(queue)
        try:
            while True:
                yield await queue.get()
        finally:
            self.queues.remove(queue)

    async def broadcast(self, event_type: str, category: str, data: dict):
        payload = {category: data}
        
        sse_dict = {
            "event": event_type,
            "data": json.dumps(payload)
        }
        for queue in self.queues:
            await queue.put(sse_dict)

manager = SSEManager()