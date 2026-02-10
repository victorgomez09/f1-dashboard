import asyncio
import random
import time
from datetime import datetime

async def simulate_f1_data(manager, driver_map, track_points):
    """
    Simulador Pro: Mueve a los pilotos por el trazado real y genera
    tiempos coherentes con la posición en pista.
    """
    print("🧪 Simulador 2026 activado: Generando telemetría sobre trazado...")
    
    # Inicializamos el progreso de cada piloto en el circuito (index del array track_points)
    driver_progress = {num: random.randint(0, len(track_points)-1) for num in driver_map.keys()}
    
    # Velocidades aleatorias para que se adelanten entre ellos
    driver_speeds = {num: random.randint(1, 3) for num in driver_map.keys()}

    while True:
        try:
            # --- 1. SIMULAR POSICIONES (MAP) ---
            refined_map_data = []
            for car_num, current_idx in driver_progress.items():
                # Avanzar piloto en el array de puntos
                new_idx = (current_idx + driver_speeds[car_num]) % len(track_points)
                driver_progress[car_num] = new_idx
                
                pos = track_points[new_idx]
                static_info = driver_map.get(car_num)
                
                refined_map_data.append({
                    "id": car_num,
                    "x": pos['x'],
                    "y": pos['y'],
                    "z": 0,
                    "color": static_info["color"],
                    "abbr": static_info["abbr"]
                })
            
            await manager.broadcast({"type": "MAP", "content": refined_map_data})

            # --- 2. SIMULAR TIEMPOS (TIMING) ---
            # Solo enviamos actualizaciones de tiempos cada 1 segundo (menos frecuente que el mapa)
            if random.random() > 0.5:
                timing_content = {"Lines": {}}
                # Ordenamos por progreso en pista para la posición
                sorted_by_pos = sorted(driver_progress.items(), key=lambda x: x[1], reverse=True)
                
                for rank, (car_num, _) in enumerate(sorted_by_pos):
                    static_info = driver_map.get(car_num)
                    timing_content["Lines"][car_num] = {
                        "Position": str(rank + 1),
                        "GapToLeader": f"+{rank * 1.2:.3f}" if rank > 0 else "INTERVAL",
                        "Interval": "+1.200" if rank > 0 else "",
                        "Sectors": [
                            {"Value": "28.4", "PersonalBest": random.random() > 0.9},
                            {"Value": "31.2", "OverallFastest": random.random() > 0.95},
                            {"Value": "22.1"}
                        ],
                        "Speeds": {"ST": str(random.randint(290, 330))},
                        "NumberOfLaps": "12",
                        "InPit": random.random() > 0.95,
                        "_driver": static_info
                    }
                await manager.broadcast({"type": "TIMING", "content": timing_content})

            # --- 3. MENSAJES DE CARRERA ---
            if random.random() > 0.95:
                msgs = [
                    "DRS ENABLED", 
                    "YELLOW FLAG SECTOR 1", 
                    "TRACK SURFACE SLIPPERY TURN 4",
                    "INVESTIGATION: CAR 44 CAUSING A COLLISION"
                ]
                await manager.broadcast({
                    "type": "MESSAGES",
                    "content": {
                        "Utc": datetime.utcnow().isoformat() + "Z",
                        "Message": random.choice(msgs)
                    }
                })

            await asyncio.sleep(0.2) # 5Hz: Frecuencia estándar de telemetría F1
            
        except Exception as e:
            print(f"Error en simulador: {e}")
            break