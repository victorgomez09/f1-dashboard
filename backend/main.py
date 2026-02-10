import asyncio
import os
from typing import List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.concurrency import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware

# Importamos el simulador y el bridge
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
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                # Si una conexión falla, la ignoramos o gestionamos aquí
                pass

manager = ConnectionManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    loop = asyncio.get_running_loop()
    mode = os.getenv("F1_MODE", "prod")
    
    # El bridge ahora es autónomo y llenará driver_data vía SignalR (tópico DriverList)
    bridge = F1SignalRBridge(main_loop=loop, manager=manager)
    
    # Parámetros para el layout del circuito (esto sigue siendo necesario para el mapa)
    year, loc, stype = 2025, 'Monaco', 'R'
    
    if mode == "dev":
        print("🧪 MODO DESARROLLO: Iniciando simulador autónomo...")
        from routes.timming import get_track_layout 
        track_data = await get_track_layout(year, loc)
        
        # Lanzamos el simulador pasándole el diccionario de pilotos vacío 
        # El simulador se encargará de inyectar el 'DriverList' inicial
        asyncio.create_task(simulate_f1_data(
            manager, 
            bridge.driver_data, 
            track_data
        ))
    else:
        print("🏎️ MODO PRODUCCIÓN: Conectando a SignalR Hub...")
        # En prod, bridge.start() manejará la suscripción a DriverList, TimingData, etc.
        bridge_task = asyncio.to_thread(bridge.start)
        asyncio.create_task(bridge_task)
    
    yield
    # Limpieza al cerrar la app
    bridge.stop()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Mantenemos la conexión viva
            await websocket.receive_text() 
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Registro de routers
app.include_router(drivers.router)
app.include_router(teams.router)
app.include_router(schedule.router)
app.include_router(timming.router)