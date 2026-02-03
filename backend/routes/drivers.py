import json
import os
from fastapi import APIRouter, HTTPException
import fastf1
import pandas as pd


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CACHE_DIR = os.path.join(BASE_DIR, 'f1_cache')
RESULTS_DIR = os.path.join(CACHE_DIR, 'results')

os.makedirs(RESULTS_DIR, exist_ok=True)

fastf1.Cache.enable_cache(CACHE_DIR)
router = APIRouter(prefix="/drivers", tags=["drivers"])

@router.get("/standings-evolution/{year}")
async def get_standings_evolution(year: int):
    try:
        # 1. Caché (Opcional: borrar el archivo .json para testear este cambio)
        file_path = os.path.join(RESULTS_DIR, f"standing_{year}.json")
        
        schedule = fastf1.get_event_schedule(year)
        now = pd.Timestamp.now(tz='UTC')
        schedule['Session5DateUtc'] = pd.to_datetime(schedule['Session5DateUtc'], utc=True)
        
        past_events = schedule[
            (schedule['EventFormat'] != 'testing') & 
            (schedule['Session5DateUtc'] < now)
        ]

        drivers_data = {}
        constructors_data = {}
        acc_points_drivers = {}
        acc_points_constructors = {}

        for _, event in past_events.iterrows():
            round_num = int(event['RoundNumber'])
            gp_name = event['EventName']
            
            try:
                session = fastf1.get_session(year, gp_name, 'R')
                # CARGA COMPLETA: Sin esto, session.results puede venir incompleto
                session.load(laps=False, telemetry=False, weather=False)
                
                # IMPORTANTE: Usamos session.results directamente
                results = session.results 

                for _, row in results.iterrows():
                    # Usamos Abbreviation como llave única
                    d_code = str(row['Abbreviation'])
                    if not d_code or d_code == 'nan': continue
                    
                    team_name = str(row['TeamName'])
                    points = float(row['Points'])
                    
                    # Acumular
                    acc_points_drivers[d_code] = acc_points_drivers.get(d_code, 0) + points
                    acc_points_constructors[team_name] = acc_points_constructors.get(team_name, 0) + points
                    
                    # Estructura DriverEvo
                    if d_code not in drivers_data:
                        drivers_data[d_code] = {
                            "code": d_code,
                            "driverId": str(row['FullName']).lower().replace(" ", "-"),
                            "constructorId": team_name,
                            "name": str(row['FullName']),
                            "nationality": "", 
                            "rounds": []
                        }
                    
                    drivers_data[d_code]["rounds"].append({
                        "round": round_num,
                        "position": int(row['Position']),
                        "points": acc_points_drivers[d_code],
                        "locality": event['Location']
                    })

                # Procesar Constructores tras cada carrera
                for t_name, t_points in acc_points_constructors.items():
                    if t_name not in constructors_data:
                        constructors_data[t_name] = {
                            "constructorId": t_name,
                            "name": t_name,
                            "nationality": "",
                            "rounds": []
                        }
                    
                    constructors_data[t_name]["rounds"].append({
                        "round": round_num,
                        "position": 0, # Se puede calcular ordenando acc_points_constructors
                        "points": t_points,
                        "locality": event['Location']
                    })

            except Exception as e:
                print(f"Error en {gp_name}: {e}")
                continue

        response = {
            "season": str(year),
            "totalRounds": int(schedule['RoundNumber'].max()),
            "driversEvolution": list(drivers_data.values()),
            "constructorsEvolution": list(constructors_data.values())
        }

        with open(file_path, 'w') as f:
            json.dump(response, f)
            
        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/ranking-evolution/{year}")
async def get_ranking_evolution(year: int):
    try:
        file_path = os.path.join(RESULTS_DIR, f"ranking_{year}.json")
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                return json.load(f)

        schedule = fastf1.get_event_schedule(year)
        now = pd.Timestamp.now(tz='UTC')
        schedule['Session5DateUtc'] = pd.to_datetime(schedule['Session5DateUtc'], utc=True)
        
        past_events = schedule[
            (schedule['EventFormat'] != 'testing') & 
            (schedule['Session5DateUtc'] < now)
        ]

        drivers_map = {}
        constructors_map = {}
        acc_pts_drivers = {}
        acc_pts_constructors = {}

        # Ronda 0: Todos empiezan igual (opcional, pero ayuda al Bump)
        initial_round = 0

        for _, event in past_events.iterrows():
            rnd = int(event['RoundNumber'])
            try:
                session = fastf1.get_session(year, event['EventName'], 'R')
                session.load(laps=False, telemetry=False, weather=False)
                res = session.results

                # 1. Sumar puntos de la carrera actual al acumulado
                for _, row in res.iterrows():
                    d_code = str(row['Abbreviation'])
                    team = str(row['TeamName'])
                    pts = float(row['Points'])
                    if not d_code or d_code == 'nan': continue

                    acc_pts_drivers[d_code] = acc_pts_drivers.get(d_code, 0) + pts
                    acc_pts_constructors[team] = acc_pts_constructors.get(team, 0) + pts

                    if d_code not in drivers_map:
                        drivers_map[d_code] = {
                            "code": d_code, "driverId": str(row['FullName']).lower().replace(" ", "-"),
                            "constructorId": team, "name": str(row['FullName']),
                            "nationality": "", "rounds": []
                        }

                # 2. CALCULAR RANKING DE PILOTOS EN ESTA RONDA
                # Ordenamos a todos los pilotos vistos hasta ahora por sus puntos acumulados
                sorted_drivers = sorted(acc_pts_drivers.items(), key=lambda x: x[1], reverse=True)
                rank_drivers = {code: i + 1 for i, (code, pts) in enumerate(sorted_drivers)}

                for d_code, evo in drivers_map.items():
                    evo["rounds"].append({
                        "round": rnd,
                        "position": rank_drivers.get(d_code, len(rank_drivers)), # Su posición en el mundial
                        "points": acc_pts_drivers.get(d_code, 0),
                        "locality": event['Location']
                    })

                # 3. CALCULAR RANKING DE CONSTRUCTORES
                sorted_teams = sorted(acc_pts_constructors.items(), key=lambda x: x[1], reverse=True)
                rank_teams = {name: i + 1 for i, (name, pts) in enumerate(sorted_teams)}

                for t_name in acc_pts_constructors.keys():
                    if t_name not in constructors_map:
                        constructors_map[t_name] = {
                            "constructorId": t_name, "name": t_name, "nationality": "", "rounds": []
                        }
                    constructors_map[t_name]["rounds"].append({
                        "round": rnd,
                        "position": rank_teams.get(t_name, len(rank_teams)),
                        "points": acc_pts_constructors[t_name],
                        "locality": event['Location']
                    })

            except Exception: continue

        response = {
            "season": str(year),
            "totalRounds": int(schedule['RoundNumber'].max()),
            "driversEvolution": list(drivers_map.values()),
            "constructorsEvolution": list(constructors_map.values())
        }

        with open(file_path, 'w') as f:
            json.dump(response, f)
        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/races-ranking-evolution/{year}")
async def get_races_ranking_evolution(year: int):
    try:
        # Gestión de caché (recomiendo borrar el anterior para aplicar cambios)
        file_path = os.path.join(RESULTS_DIR, f"races_ranking_{year}.json")
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                return json.load(f)

        schedule = fastf1.get_event_schedule(year)
        now = pd.Timestamp.now(tz='UTC')
        schedule['Session5DateUtc'] = pd.to_datetime(schedule['Session5DateUtc'], utc=True)
        
        # Filtramos eventos que ya han sucedido
        past_events = schedule[
            (schedule['EventFormat'] != 'testing') & 
            (pd.to_datetime(schedule['Session5DateUtc'], utc=True) < now)
        ]

        drivers_map = {}      # Guardará DriverEvo
        constructors_map = {} # Guardará ConstructorEvo
        
        # Diccionarios para puntos acumulados (necesario para la evolución)
        pts_acc_drivers = {}
        pts_acc_constructors = {}

        for _, event in past_events.iterrows():
            rnd = int(event['RoundNumber'])
            loc = event['Location']
            
            try:
                session = fastf1.get_session(year, event['EventName'], 'R')
                session.load(laps=False, telemetry=False, weather=False)
                res = session.results

                if res.empty: continue

                # Iteramos sobre TODOS los pilotos registrados en la sesión
                for _, row in res.iterrows():
                    d_code = str(row['Abbreviation'])
                    if not d_code or d_code == 'None': continue
                    
                    c_id = str(row['TeamName'])
                    pts_race = float(row['Points'])
                    
                    # 1. Lógica de Puntos Acumulados
                    pts_acc_drivers[d_code] = pts_acc_drivers.get(d_code, 0) + pts_race
                    pts_acc_constructors[c_id] = pts_acc_constructors.get(c_id, 0) + pts_race
                    
                    # 2. Estructura DriverEvo
                    if d_code not in drivers_map:
                        drivers_map[d_code] = {
                            "code": d_code,
                            "driverId": str(row['FullName']).lower().replace(" ", "-"),
                            "constructorId": c_id,
                            "name": str(row['FullName']),
                            "nationality": "", # FastF1 requiere lookup extra para esto
                            "rounds": []
                        }
                    
                    drivers_map[d_code]["rounds"].append({
                        "round": rnd,
                        "position": int(row['Position']), # Posición en esta carrera
                        "points": pts_acc_drivers[d_code], # Puntos totales hasta ahora
                        "locality": loc
                    })

                # 3. Estructura ConstructorEvo
                # Procesamos todos los constructores que han participado hasta ahora
                for team_name in pts_acc_constructors.keys():
                    if team_name not in constructors_map:
                        constructors_map[team_name] = {
                            "constructorId": team_name,
                            "name": team_name,
                            "nationality": "",
                            "rounds": []
                        }
                    
                    # Buscamos si el equipo sumó en esta ronda (para la posición)
                    # Si no sumó, mantiene los puntos anteriores
                    constructors_map[team_name]["rounds"].append({
                        "round": rnd,
                        "position": 0, # Calculable opcionalmente comparando con otros equipos
                        "points": pts_acc_constructors[team_name],
                        "locality": loc
                    })

            except Exception as e:
                print(f"Error procesando ronda {rnd}: {e}")
                continue

        # 4. Construcción del objeto final según tu interface
        response = {
            "season": str(year),
            "totalRounds": int(schedule['RoundNumber'].max()),
            "driversEvolution": list(drivers_map.values()),
            "constructorsEvolution": list(constructors_map.values())
        }

        # Guardar caché
        os.makedirs(RESULTS_DIR, exist_ok=True)
        with open(file_path, 'w') as f:
            json.dump(response, f)
            
        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/driver-stats/{year}")
async def get_driver_stats(year: int):
    try:
        file_path = os.path.join(RESULTS_DIR, f"stats_{year}.json")
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                return json.load(f)
        
        # Eliminamos el archivo previo para asegurar que el debug sea real y no cacheado
        if os.path.exists(file_path):
            os.remove(file_path)

        schedule = fastf1.get_event_schedule(year)
        # Filtramos solo carreras de domingo con ronda válida
        past_events = schedule[(schedule['EventFormat'] != 'testing') & (schedule['RoundNumber'] > 0)]
        
        stats_map = {}
        # Para debug interno
        dnf_log = {}

        for _, event in past_events.iterrows():
            r_num = event['RoundNumber']
            e_name = event['EventName']
            
            try:
                # 'R' asegura que es el Gran Premio, no la Sprint
                session = fastf1.get_session(year, r_num, 'R')
                session.load(laps=False, telemetry=False, weather=False)
                
                if session.results is None or session.results.empty:
                    continue

                # Eliminamos duplicados técnicos de la API para no contar 2 veces la misma carrera
                results = session.results.drop_duplicates(subset=['Abbreviation'], keep='first')

                for _, row in results.iterrows():
                    abbr = row['Abbreviation']
                    if not abbr or pd.isna(abbr): continue
                    
                    status = str(row['Status']).strip()
                    pos = int(row['Position'])
                    
                    if abbr not in stats_map:
                        stats_map[abbr] = {
                            "driver": abbr, 
                            "name": str(row['FullName']), 
                            "Wins": 0, "Podiums": 0, "PointsFinish": 0, "DNF": 0, "DSQ": 0
                        }
                        dnf_log[abbr] = []

                    # --- LÓGICA DE CLASIFICACIÓN (STATUS) ---
                    
                    # 1. ¿El piloto cruzó la meta?
                    # 'Finished': En la misma vuelta
                    # '+': Con vueltas perdidas (ej. +1 Lap)
                    # 'Lapped': Terminado como doblado (Común en FastF1)
                    is_success = (status == 'Finished' or status.startswith('+') or status == 'Lapped')

                    # 2. ¿Es un error de salida o no participación?
                    is_dns = any(msg in status for msg in ["Did not start", "DNS", "Withdrawn", "107%"])

                    # 3. ¿Es Descalificado?
                    is_dsq = "Disqualified" in status or "DSQ" in status

                    if is_dns:
                        continue
                    
                    if is_dsq:
                        stats_map[abbr]["DSQ"] += 1
                        continue

                    if not is_success:
                        # Si no cruzó la meta y no es DNS/DSQ -> Es DNF (Crash, Mechanical, etc.)
                        stats_map[abbr]["DNF"] += 1
                        dnf_log[abbr].append(f"R{r_num}-{e_name} ({status})")
                    else:
                        # Contabilizar resultados positivos solo si cruzó la meta
                        if pos == 1:
                            stats_map[abbr]["Wins"] += 1
                        elif 2 <= pos <= 3:
                            stats_map[abbr]["Podiums"] += 1
                        elif 4 <= pos <= 10:
                            stats_map[abbr]["PointsFinish"] += 1
                
            except Exception as e:
                print(f"Error procesando Ronda {r_num}: {e}")
                continue

        # Formatear para Nivo Bar Chart
        final_data = []
        for abbr, data in stats_map.items():
            final_data.append({
                "driver": data["driver"],
                "name": data["name"],
                "Wins": data["Wins"],
                "Podiums": data["Podiums"],
                "PointsFinish": data["PointsFinish"],
                "DNF": -abs(data["DNF"]), 
                "DSQ": -abs(data["DSQ"])
            })

        # Ordenar por el sistema de puntos de F1
        final_data.sort(key=lambda x: (x['Wins'], x['Podiums'], x['PointsFinish']), reverse=True)

        # Guardar en JSON
        os.makedirs(RESULTS_DIR, exist_ok=True)
        with open(file_path, 'w') as f:
            json.dump(final_data, f)
            
        return final_data

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/points-distribution/{year}")
def get_points_distribution(year: int):
    try:
        # Definir ruta de caché
        file_path = os.path.join(RESULTS_DIR, f"points_dist_{year}.json")
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                return json.load(f)

        schedule = fastf1.get_event_schedule(year)
        past_events = schedule[(schedule['EventFormat'] != 'testing') & (schedule['RoundNumber'] > 0)]
        
        distribution_data = []

        for _, event in past_events.iterrows():
            r_num = event['RoundNumber']
            # Limpiamos el nombre para que el eje Y no sea eterno
            r_name = event['EventName'].replace('Grand Prix', '').strip()
            r_locality = event['Location']

            try:
                session = fastf1.get_session(year, r_num, 'R')
                session.load(laps=False, telemetry=False, weather=False)
                
                if session.results is None or session.results.empty:
                    continue

                round_entry = {
                    "name": r_name,
                    "locality": r_locality
                }

                # Es vital que cada piloto sea un objeto con la propiedad "points"
                # para que tu frontend lo detecte en el flatMap
                for _, row in session.results.iterrows():
                    abbr = row['Abbreviation']
                    if not abbr or pd.isna(abbr): continue
                    
                    round_entry[abbr] = {
                        "name": row['FullName'],
                        "points": float(row['Points']),
                        "constructor": row['TeamName']
                    }
                
                distribution_data.append(round_entry)

            except Exception as e:
                print(f"Error en ronda {r_num}: {e}")
                continue

        # Invertimos para que la carrera más reciente aparezca arriba (opcional)
        distribution_data.reverse()

        if distribution_data:
            os.makedirs(RESULTS_DIR, exist_ok=True)
            with open(file_path, 'w') as f:
                json.dump(distribution_data, f)
            
        return distribution_data

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))