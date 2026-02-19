import asyncio
import json

class SSEManager:
    def __init__(self):
        self.queues: set[asyncio.Queue] = set()

    async def subscribe(self, bridge):
        queue = asyncio.Queue(maxsize=100)
        
        # 1. Hidratación inmediata: si hay caché, lo metemos en la cola ya formateado
        if bridge and hasattr(bridge, 'state_cache'):
            for topic, content in bridge.state_cache.items():
                # Formato manual estricto para SSE
                msg = f"event: initial\ndata: {json.dumps({topic: content})}\n\n"
                queue.put_nowait(msg)

        self.queues.add(queue)
        try:
            while True:
                # 2. Esperar mensaje
                msg = await queue.get()
                
                # Si es un diccionario (viene de broadcast), formatear. Si es string, enviar.
                if isinstance(msg, dict):
                    yield f"event: {msg['event']}\ndata: {msg['data']}\n\n"
                else:
                    yield msg
        except asyncio.CancelledError:
            pass
        finally:
            self.queues.discard(queue)

    async def broadcast(self, event_type: str, category: str, data: dict):
        if not self.queues:
            return
            
        # Pre-formateamos el JSON una vez para todas las colas
        payload = {
            "event": event_type, 
            "data": json.dumps({category: data})
        }
        
        for queue in list(self.queues):
            try:
                queue.put_nowait(payload)
            except asyncio.QueueFull:
                continue

manager = SSEManager()