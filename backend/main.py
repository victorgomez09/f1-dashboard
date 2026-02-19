import asyncio
from typing import Optional
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sse_starlette import EventSourceResponse
from utils.signalr import F1SignalRBridge
from utils.sse_manager import manager

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

f1_bridge: Optional[F1SignalRBridge] = None

@app.on_event("startup")
async def startup_event():
    global f1_bridge
    loop = asyncio.get_event_loop()
    f1_bridge = F1SignalRBridge(loop)
    f1_bridge.start()

@app.get("/api/realtime")
async def sse_endpoint():
    return StreamingResponse(
        manager.subscribe(f1_bridge),
        media_type="text/event-stream",
        headers={
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform", # Evita proxies
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no", # 🚩 ESTO DESACTIVA EL BUFFER DE NGINX/PROXIES
        }
    )
