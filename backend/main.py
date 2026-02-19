import asyncio
import json
import httpx
import logging
import urllib.parse
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import Any, Dict, List
from websockets.client import connect

# --- Configuración ---
SIGNALR_URL = "livetiming.formula1.com/signalr"
SIGNALR_HUB = "Streaming"
RETRY_FREQ = 10     # Segundos para reintento
SOCKET_FREQ = 1.0   # Segundos entre broadcasts al frontend

app = FastAPI()
logging.basicConfig(level=logging.INFO)

class F1LiveTracker:
    def __init__(self):
        self.state: Dict[str, Any] = {}
        self.message_count = 0
        self.connected_clients: List[WebSocket] = []
        self.is_dev = True

    def deep_object_merge(self, original: dict, modifier: dict) -> dict:
        """Merge profundo para mantener el estado global actualizado."""
        for key, value in modifier.items():
            if (key in original and isinstance(original[key], dict) 
                and isinstance(value, dict)):
                self.deep_object_merge(original[key], value)
            else:
                original[key] = value
        return original

    def update_state(self, raw_data: str):
        try:
            parsed = json.loads(raw_data)
            
            # 1. Procesar mensajes de tipo Feed ('M')
            if "M" in parsed and isinstance(parsed["M"], list):
                for message in parsed["M"]:
                    if message.get("M") == "feed":
                        self.message_count += 1
                        args = message.get("A", [])
                        if len(args) < 2: continue
                        
                        field, value = args[0], args[1]

                        # Mapeo para el frontend: convertimos 'Field.z' en 'FieldZ'
                        if isinstance(field, str) and field.endswith(".z"):
                            field = field.replace(".", "").replace("z", "Z")
                        
                        self.state = self.deep_object_merge(self.state, {field: value})

            # 2. Procesar respuesta inicial de suscripción ('R')
            elif "R" in parsed and isinstance(parsed.get("R"), dict) and parsed.get("I") == "1":
                self.message_count += 1
                r_data = parsed["R"]
                formatted_r = {}
                
                for k, v in r_data.items():
                    new_key = k.replace(".", "").replace("z", "Z") if k.endswith(".z") else k
                    formatted_r[new_key] = v
                
                self.state = self.deep_object_merge(self.state, formatted_r)

        except Exception as e:
            logging.error(f"Error actualizando estado: {e}")

    async def connect_to_f1(self):
        """Maneja la conexión SignalR con F1 Live Timing."""
        hub_data = '[{"name":"Streaming"}]'
        
        # Paso 1: Negociación HTTP
        neg_url = f"https://{SIGNALR_URL}/negotiate?connectionData={urllib.parse.quote(hub_data)}&clientProtocol=1.5"
        
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(neg_url)
                if resp.status_code != 200: raise Exception("Negotiation Failed")
                
                neg_json = resp.json()
                token = neg_json["ConnectionToken"]
                cookie_str = "; ".join([f"{k}={v}" for k, v in resp.cookies.items()])
            except Exception as e:
                logging.error(f"Falla en negociación: {e}. Reintentando...")
                await asyncio.sleep(RETRY_FREQ)
                asyncio.create_task(self.connect_to_f1())
                return

        # Paso 2: Conexión WebSocket
        ws_url = (
            f"wss://{SIGNALR_URL}/connect?clientProtocol=1.5&transport=webSockets"
            f"&connectionToken={urllib.parse.quote(token)}&connectionData={urllib.parse.quote(hub_data)}"
        )
        
        headers = {"User-Agent": "BestHTTP", "Cookie": cookie_str}

        try:
            async with connect(ws_url, extra_headers=headers) as ws:
                logging.info("¡Conectado a F1 SignalR!")
                
                # Suscripción a los tópicos requeridos
                sub_msg = {
                    "H": SIGNALR_HUB, "M": "Subscribe", "I": 1,
                    "A": [["Heartbeat", "CarData.z", "Position.z", "ExtrapolatedClock", 
                           "TimingStats", "TimingAppData", "WeatherData", "TrackStatus", 
                           "DriverList", "RaceControlMessages", "SessionInfo", "SessionData", 
                           "LapCount", "TimingData", "TeamRadio"]]
                }
                await ws.send(json.dumps(sub_msg))

                async for msg in ws:
                    self.update_state(msg)
        except Exception as e:
            logging.error(f"Error en WebSocket F1: {e}. Reconectando...")
            self.state = {}
            await asyncio.sleep(RETRY_FREQ)
            asyncio.create_task(self.connect_to_f1())

    async def broadcast_loop(self):
        """Envía el estado acumulado a todos los clientes Next.js."""
        while True:
            if self.connected_clients:
                # El frontend espera el estado actual o un objeto vacío
                active = self.message_count > 5 or self.is_dev
                payload = json.dumps(self.state if active else {})
                
                for client in self.connected_clients[:]:
                    try:
                        await client.send_text(payload)
                    except WebSocketDisconnect:
                        self.connected_clients.remove(client)
                    except Exception:
                        self.connected_clients.remove(client)
            await asyncio.sleep(SOCKET_FREQ)

tracker = F1LiveTracker()

@app.on_event("startup")
async def startup():
    asyncio.create_task(tracker.connect_to_f1())
    asyncio.create_task(tracker.broadcast_loop())

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    tracker.connected_clients.append(websocket)
    try:
        while True:
            await websocket.receive_text() # Keep-alive
    except WebSocketDisconnect:
        tracker.connected_clients.remove(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)