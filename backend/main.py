import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
from utils.signalr import F1SignalRBridge
from utils.sse_manager import manager

app = FastAPI()

# CORS habilitado para que Next.js (f1-dash) pueda conectar
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

f1_bridge = None

@app.on_event("startup")
async def startup_event():
    global f1_bridge
    loop = asyncio.get_event_loop()
    f1_bridge = F1SignalRBridge(loop)
    # Esperamos 2 segundos antes de arrancar el bridge para que el 
    # primer cliente que conecte reciba los 'initial' del manager primero.
    await asyncio.sleep(2) 
    f1_bridge.start()

@app.get("/api/realtime")
async def sse_endpoint():
    """
    Este endpoint es el que busca el frontend en:
    new EventSource(`${env.NEXT_PUBLIC_LIVE_URL}/api/realtime`)
    """
    global f1_bridge
    # 🚩 AQUÍ: Pasamos la instancia global del bridge al manager
    return EventSourceResponse(manager.subscribe(f1_bridge))