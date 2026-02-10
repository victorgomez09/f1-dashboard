import asyncio
import os
from typing import List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.concurrency import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware

from mocks.timming import simulate_f1_data
from utils.signalr import F1SignalRBridge
from routes import drivers, teams, schedule, timming

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

manager = ConnectionManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    loop = asyncio.get_running_loop()
    mode = os.getenv("F1_MODE", "prod")
    bridge = F1SignalRBridge(main_loop=loop, manager=manager)
    
    # 1. Cargar datos base
    year, loc, stype = 2025, 'Monaco', 'R'
    bridge.load_session_drivers(year, loc, stype)
    
    if mode == "dev":
        # 2. Para el simulador, necesitamos los puntos del mapa
        # Llamamos a la misma lógica que usa tu endpoint de track
        from routes.timming import get_track_layout 
        track_data = get_track_layout(year, loc, stype)
        
        asyncio.create_task(simulate_f1_data(
            manager, 
            bridge.driver_data, 
            track_data['points']
        ))
    else:
        bridge_task = asyncio.to_thread(bridge.start)
        asyncio.create_task(bridge_task)
    
    yield
    bridge.stop()

app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En producción pon la URL de tu Next.js
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text() 
    except WebSocketDisconnect:
        manager.disconnect(websocket)

app.include_router(drivers.router)
app.include_router(teams.router)
app.include_router(schedule.router)
app.include_router(timming.router)