
from fastapi import APIRouter


router = APIRouter(prefix="/timming", tags=["timming"])

@router.get("/track/{year}/{location}/{session_type}")
def get_track_layout(year: int, location: str, session_type: str):
    import fastf1
    import numpy as np

    session = fastf1.get_session(year, location, session_type)
    session.load(laps=True, telemetry=True, weather=False)
    
    # Obtenemos la vuelta más rápida como referencia para el dibujo del circuito
    fastest_lap = session.laps.pick_fastest()
    telemetry = fastest_lap.get_telemetry()

    # Reducimos la cantidad de puntos para que el SVG no pese demasiado
    # Tomamos 1 de cada 5 puntos
    reduced_telemetry = telemetry.iloc[::5]

    coords = []
    for _, row in reduced_telemetry.iterrows():
        coords.append({"x": int(row['X']), "y": int(row['Y'])})

    return {
        "location": location,
        "points": coords
    }