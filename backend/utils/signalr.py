# utils/signalr.py
import asyncio
import base64
import json
import time
import zlib
import fastf1
from signalrcore.hub_connection_builder import HubConnectionBuilder

# --- LÓGICA DE SIGNALR ---
class F1SignalRBridge:
    def __init__(self, main_loop, manager=None):
        self.connection = None
        self.url = "https://livetiming.formula1.com/signalr"
        self.main_loop = main_loop
        self.driver_data = {}
        self.manager = manager
        # Estos son los métodos específicos del Hub de F1
        self.topics = ["TimingData", "TimingStats", "TrackStatus", "Position.z", "RaceControlMessages", "AudioStreams"]

    def start(self):
        self.connection = HubConnectionBuilder() \
            .with_url(self.url, options={"verify_ssl": False}) \
            .build()

        # La F1 emite todo a través del evento "feed"
        self.connection.on("feed", self._on_message)
        
        self.connection.on_open(lambda: print("✅ Conectado a SignalR de F1"))
        self.connection.on_close(lambda: print("❌ Conexión SignalR cerrada"))
        
        self.connection.start()

    def stop(self):
        if self.connection:
            self.connection.stop()

    def _on_message(self, msg):
        if len(msg) >= 2:
            topic, data = msg[0], msg[1]
            asyncio.run_coroutine_threadsafe(
                process_f1_stream(topic, data, self.driver_data, self.manager), # Pasamos el mapa y el manager
                self.main_loop
            )
    
    def load_session_drivers(self, year, location, session_type='R'):
        """Precarga la información de los pilotos para enriquecer los sockets"""
        try:
            session = fastf1.get_session(year, location, session_type)
            session.load(laps=False, telemetry=False, weather=False)
            list_drivers = session.drivers
            
            for drv in list_drivers:
                info = session.get_driver(drv)
                self.driver_data[info['Number']] = {
                    "name": f"{info['FirstName']} {info['LastName']}",
                    "abbr": info['Abbreviation'],
                    "team": info['TeamName'],
                    "color": f"#{info['TeamColor']}",
                    "id": info['Number']
                }
            print(f"🏎️  Datos de {len(self.driver_data)} pilotos cargados para enriquecer el Live Timing")
        except Exception as e:
            print(f"⚠️ Error cargando pilotos: {e}")

# --- PROCESAMIENTO Y DECODIFICACIÓN ---
def decode_f1_message(payload: str):
    try:
        decoded = base64.b64decode(payload)
        return json.loads(zlib.decompress(decoded, -15).decode('utf-8'))
    except:
        return None

last_map_update = 0
MAP_UPDATE_INTERVAL = 0.2

async def process_f1_stream(topic: str, data: any, driver_map: dict, manager: any):
    global last_map_update
    
    parsed_data = decode_f1_message(data) if isinstance(data, str) else data
    if not parsed_data: return

    # --- OPTIMIZACIÓN DEL MAPA (Position.z) ---
    if topic == "Position.z":
        current_time = time.time()
        # Si no ha pasado el intervalo, ignoramos este paquete para no saturar
        if current_time - last_map_update < MAP_UPDATE_INTERVAL:
            return
        
        last_map_update = current_time
        
        # Estructura para el frontend simplificada
        refined_map_data = []
        
        # 'Position.z' contiene una lista de entradas por coche
        for entry in parsed_data.get("Entries", []):
            car_number = entry.get("Cars", {}).keys() # Depende de la versión del Hub
            # Nota: El formato exacto de Position.z varía, 
            # solemos iterar sobre los números de coche presentes:
            for car_num, pos_data in entry.get("Cars", {}).items():
                static_info = driver_map.get(car_num)
                if static_info:
                    refined_map_data.append({
                        "id": car_num,
                        "x": pos_data.get("X"),
                        "y": pos_data.get("Y"),
                        "z": pos_data.get("Z"),
                        "color": static_info["color"],
                        "abbr": static_info["abbr"]
                    })
        
        if refined_map_data:
            await manager.broadcast({
                "type": "MAP",
                "content": refined_map_data
            })
            return # Terminamos aquí para el mapa

    # --- ENRIQUECIMIENTO DE TIEMPOS (TimingData) ---
    elif topic == "TimingData":
        if "Lines" in parsed_data:
            for car_number, timing_info in parsed_data["Lines"].items():
                static_info = driver_map.get(car_number)
                if static_info:
                    timing_info["_driver"] = static_info
        
        await manager.broadcast({"type": "TIMING", "content": parsed_data})

    # --- OTROS MENSAJES (Sin throttling necesario) ---
    elif topic in ["RaceControlMessages", "AudioStreams"]:
        topic_map = {"RaceControlMessages": "MESSAGES", "AudioStreams": "RADIOS"}
        await manager.broadcast({
            "type": topic_map.get(topic, topic),
            "content": parsed_data
        })