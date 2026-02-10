# utils/signalr.py
import asyncio
import base64
import json
import time
import zlib
from signalrcore.hub_connection_builder import HubConnectionBuilder

class F1SignalRBridge:
    def __init__(self, main_loop, manager=None):
        self.connection = None
        self.url = "https://livetiming.formula1.com/signalr"
        self.main_loop = main_loop
        self.manager = manager
        # Diccionario dinámico: se llena con el tópico 'DriverList'
        self.driver_data = {} 
        # Añadimos DriverList a los tópicos
        self.topics = [
            "TimingData", "TimingStats", "TrackStatus", "Position.z", 
            "RaceControlMessages", "AudioStreams", "DriverList", "WeatherData", "SessionInfo"
        ]

    def start(self):
        # Configuración de la conexión para SignalR de F1 (Hub7)
        self.connection = HubConnectionBuilder() \
            .with_url(self.url, options={"verify_ssl": False}) \
            .build()

        self.connection.on("feed", self._on_message)
        
        # Al conectar, nos suscribimos a los tópicos para recibir datos
        def on_open():
            print("✅ Conectado a SignalR de F1")
            for topic in self.topics:
                self.connection.send("Subscribe", [topic])

        self.connection.on_open(on_open)
        self.connection.on_close(lambda: print("❌ Conexión SignalR cerrada"))
        self.connection.start()

    def _on_message(self, msg):
        if len(msg) >= 2:
            topic, data = msg[0], msg[1]
            # Si el dato está comprimido (es un string), lo decodificamos
            if isinstance(data, str):
                data = decode_f1_message(data)
            
            asyncio.run_coroutine_threadsafe(
                process_f1_stream(topic, data, self.driver_data, self.manager),
                self.main_loop
            )

    def stop(self):
        if self.connection:
            self.connection.stop()

def decode_f1_message(payload: str):
    try:
        decoded = base64.b64decode(payload)
        # La F1 usa compresión zlib sin cabeceras (-15)
        return json.loads(zlib.decompress(decoded, -15).decode('utf-8'))
    except Exception as e:
        print(f"Error decodificando: {e}")
        return None

async def process_f1_stream(topic: str, data: any, driver_map: dict, manager: any):
    if not data:
        return

    # --- NUEVO: Captura de pilotos desde SignalR ---
    if topic == "DriverList":
        # DriverList es un diccionario donde la llave es el número del coche
        for car_num, info in data.items():
            driver_map[car_num] = {
                "name": f"{info.get('FirstName', '')} {info.get('LastName', '')}".strip(),
                "abbr": info.get("Abbreviation"),
                "team": info.get("TeamName"),
                "color": f"#{info.get('TeamColor', 'FFFFFF')}",
                "id": car_num
            }
        print(f"🏎️  DriverList actualizado: {len(driver_map)} pilotos en memoria.")
        return # No necesitamos enviar esto al front directamente si no queremos

    # --- CLIMA ---
    if topic == "WeatherData":
        await manager.broadcast({"type": "WEATHER", "content": data})

    # --- ESTADO DE PISTA ---
    elif topic == "TrackStatus":
        await manager.broadcast({"type": "TRACK_STATUS", "content": data})

    # --- TIEMPOS (TIMING) ---
    elif topic == "TimingData":
        lines = data.get("Lines", {})
        enriched_timing = {}
        for car_num, info in lines.items():
            driver_info = driver_map.get(car_num)
            if driver_info:
                enriched_timing[car_num] = {**info, "_driver": driver_info}

        await manager.broadcast({
            "type": "TIMING",
            "content": enriched_timing
        })

    # --- ESTRATEGIA / NEUMÁTICOS (TIMING STATS) ---
    elif topic == "TimingStats":
        lines = data.get("Lines", {})
        enriched_stats = {}
        for car_num, stats in lines.items():
            if car_num in driver_map:
                stints = stats.get("Stints", [])
                enriched_stats[car_num] = {
                    "stints": stints,
                    "compound": stints[-1].get("Compound") if stints else "UNKNOWN",
                    "_driver": driver_map[car_num]
                }
        
        await manager.broadcast({
            "type": "TYRE_STRATEGY",
            "content": enriched_stats
        })

    # --- MAPA (POSICIÓN) ---
    elif topic == "Position.z":
        entries = data.get("Entries", [])
        if not entries: return
        
        last_frame = entries[-1]
        refined_positions = []
        for car_num, pos in last_frame.get("Cars", {}).items():
            driver = driver_map.get(car_num)
            if driver:
                refined_positions.append({
                    "id": car_num,
                    "x": pos.get("X"),
                    "y": pos.get("Y"),
                    "driver": driver
                })
        
        await manager.broadcast({"type": "MAP", "content": refined_positions})

    # --- MENSAJES Y OTROS ---
    elif topic in ["RaceControlMessages", "AudioStreams"]:
        type_map = {"RaceControlMessages": "MESSAGES", "AudioStreams": "RADIOS"}
        await manager.broadcast({
            "type": type_map[topic],
            "content": data.get("Messages", data)
        })
    
    elif topic == "SessionInfo":
        # SignalR envía aquí: {"Name": "Monaco", "Type": "Race", "Status": "Started", ...}
        await manager.broadcast({
            "type": "SESSION_INFO",
            "content": {
                "meetingName": data.get("Meeting", {}).get("Name"),
                "sessionName": data.get("Name"),
                "type": data.get("Type"),
                "startDate": data.get("StartDate"),
                "endDate": data.get("EndDate"),
                "gmtOffset": data.get("GmtOffset")
            }
        })