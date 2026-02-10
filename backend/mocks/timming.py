import asyncio
import random
from datetime import datetime

from utils.signalr import process_f1_stream

async def simulate_f1_data(manager, driver_map, track_points):
    """
    Simulador Profesional F1 2026
    Genera un flujo constante de datos enriquecidos para probar el Dashboard completo.
    """
    print("🏎️  Simulador Pro 2026: Iniciando ráfaga de datos...")
    mock_drivers = {
        "14": {"FirstName": "Fernando", "LastName": "Alonso", "Abbreviation": "ALO", "TeamName": "Aston Martin", "TeamColor": "006f62"},
        "44": {"FirstName": "Lewis", "LastName": "Hamilton", "Abbreviation": "HAM", "TeamName": "Mercedes", "TeamColor": "00d2be"}
    }
    await process_f1_stream("DriverList", mock_drivers, driver_map, manager)

    # Configuración inicial de los pilotos
    compounds = ["SOFT", "MEDIUM", "HARD", "INTERMEDIATE", "WET"]
    # Cada piloto empieza en un punto aleatorio del circuito
    driver_progress = {num: random.randint(0, len(track_points)-1) for num in driver_map.keys()}
    # Velocidades base (puntos por iteración) para simular diferencias de ritmo
    driver_speeds = {num: random.randint(2, 5) for num in driver_map.keys()}
    
    # Estrategias iniciales
    driver_stints = {
        num: [
            {"Compound": random.choice(compounds[:3]), "TyreAge": random.randint(1, 10), "New": "true"}
        ] for num in driver_map.keys()
    }

    iteration = 0

    while True:
        try:
            iteration += 1
            
            # --- A. SIMULAR CLIMA (Cada 10 segundos) ---
            if iteration % 20 == 0:
                await manager.broadcast({
                    "type": "WEATHER",
                    "content": {
                        "AirTemp": "26.4",
                        "TrackTemp": "42.8",
                        "Humidity": "38.5",
                        "Pressure": "1012.4",
                        "Rainfall": "0",
                        "WindSpeed": f"{random.uniform(1.0, 5.0):.1f}",
                        "WindDirection": "210"
                    }
                })

            # --- B. SIMULAR POSICIONES (5Hz para suavidad en el mapa) ---
            refined_positions = []
            for car_num, current_idx in driver_progress.items():
                # Avanzar piloto
                new_idx = (current_idx + driver_speeds[car_num]) % len(track_points)
                driver_progress[car_num] = new_idx
                
                pos = track_points[new_idx]
                static_info = driver_map.get(car_num)
                
                refined_positions.append({
                    "id": car_num,
                    "x": pos['x'],
                    "y": pos['y'],
                    "z": 0,
                    "status": "AllOnTrack",
                    "driver": static_info
                })
            
            await manager.broadcast({"type": "MAP", "content": refined_positions})

            # --- C. SIMULAR TIMING Y ESTRATEGIA (1Hz) ---
            if iteration % 5 == 0:
                # Ordenar por progreso para calcular posiciones reales
                sorted_drivers = sorted(driver_progress.items(), key=lambda x: x[1], reverse=True)
                
                timing_payload = {}
                for rank, (car_num, _) in enumerate(sorted_drivers):
                    static_info = driver_map.get(car_num)
                    
                    # Actualizar edad del neumático cada x tiempo
                    if iteration % 100 == 0:
                        driver_stints[car_num][-1]["TyreAge"] += 1

                    timing_payload[car_num] = {
                        "Position": str(rank + 1),
                        "GapToLeader": f"+{rank * 1.450:.3f}" if rank > 0 else "INTERVAL",
                        "Interval": "+1.450" if rank > 0 else "",
                        "LastLapTime": {"Value": "1:14.210"},
                        "BestLapTime": {"Value": "1:13.800"},
                        "Sectors": [
                            {"Value": "28.2", "PersonalBest": random.random() > 0.8},
                            {"Value": "32.1", "OverallFastest": random.random() > 0.95},
                            {"Value": "21.9"}
                        ],
                        "Stints": driver_stints[car_num],
                        "NumberOfLaps": "15",
                        "InPit": False,
                        "_driver": static_info
                    }
                
                await manager.broadcast({"type": "TIMING", "content": timing_payload})

            # --- D. MENSAJES DE RACE CONTROL (Aleatorios) ---
            if random.random() > 0.98:
                msgs = [
                    "YELLOW FLAG SECTOR 2",
                    "DRS ENABLED",
                    "DEBRIS ON TRACK TURN 10",
                    "TRACK LIMITS WARNING CAR 16",
                    "INVESTIGATION CAR 1 DROP 2 POSITIONS"
                ]
                await manager.broadcast({
                    "type": "MESSAGES",
                    "content": [{
                        "Utc": datetime.now().isoformat(),
                        "Message": random.choice(msgs)
                    }]
                })

            # --- E. STATUS DE PISTA (Fijo Verde para pruebas) ---
            if iteration == 1:
                await manager.broadcast({
                    "type": "TRACK_STATUS",
                    "content": {"Status": "1", "Message": "AllClear"}
                })

            # Frecuencia de 5Hz (0.2s) para que el mapa se vea fluido
            await asyncio.sleep(0.2)
            
        except Exception as e:
            print(f"❌ Error en Simulador: {e}")
            break