
import os
from fastapi import APIRouter
import fastf1
import pandas as pd
from requests_cache import datetime, timezone


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CACHE_DIR = os.path.join(BASE_DIR, "f1_cache")
fastf1.Cache.enable_cache(CACHE_DIR)

router = APIRouter(prefix="/schedule", tags=["schedule"])

@router.get("/{year}")
def get_f1_calendar(year: int):
    now = datetime.now(timezone.utc)
    schedule = fastf1.get_event_schedule(year)
    
    calendar = []
    
    iso_mapping = {
        "Australia": "au", "Bahrain": "bh", "Saudi Arabia": "sa", "Japan": "jp",
        "China": "cn", "USA": "us", "United States": "us", "Monaco": "mc",
        "Spain": "es", "Canada": "ca", "Austria": "at", "United Kingdom": "gb",
        "Great Britain": "gb", "Hungary": "hu", "Belgium": "be", "Netherlands": "nl",
        "Italy": "it", "Azerbaijan": "az", "Singapore": "sg", "Mexico": "mx",
        "Brazil": "br", "Qatar": "qa", "Abu Dhabi": "ae", "Argentina": "ar"
    }

    next_event_found = False
    for _, event in schedule.iterrows():
        # 1. Tipo de evento
        event_format = event['EventFormat']
        if event_format == 'testing':
            event_type = "Pre-Season Test"
        elif event_format == 'sprint':
            event_type = "Sprint Weekend"
        else:
            event_type = "Grand Prix"

        # 2. Rango de fechas dinámico (ISO para que el Front lo formatee)
        # Obtenemos todas las fechas de sesión válidas
        session_dates = [
            event['Session1Date'], event['Session2Date'], 
            event['Session3Date'], event['Session4Date'], event['Session5Date']
        ]
        valid_dates = [d for d in session_dates if pd.notna(d)]
        
        start_date = min(valid_dates).isoformat() if valid_dates else None
        end_date = max(valid_dates).isoformat() if valid_dates else None

        # 3. Mapeo de bandera
        country = event['Country']
        flag_code = iso_mapping.get(country, "un")

        is_next = False
        target_session_date = None
        
        if not next_event_found:
            # 1. Extraemos todas las fechas de sesiones de este evento (Tests, Libres, etc.)
            # valid_dates ya lo tienes definido arriba como las fechas no nulas
            sessions_utc = [d.to_pydatetime().replace(tzinfo=timezone.utc) for d in valid_dates]
            
            # 2. Filtramos las que aún no han ocurrido
            future_sessions = [d for d in sessions_utc if d > now]
            
            # 3. Si hay sesiones futuras, este ES el próximo evento (o el actual)
            if future_sessions:
                is_next = True
                next_event_found = True
                # La sesión más cercana es el mínimo de las futuras
                target_session_date = min(future_sessions).isoformat()

        item = {
            "is_next": is_next,
            "next_session": target_session_date,
            "round": int(event['RoundNumber']),
            "type": event_type,
            "name": event['EventName'],
            "location": event['Location'],
            "country": country,
            "flag_url": f"https://flagcdn.com/h40/{flag_code}.png",
            "is_test": event_format == 'testing',
            "start_date": start_date,
            "end_date": end_date,
            "sessions": {
                "fp1": event['Session1Date'].isoformat() if pd.notna(event['Session1Date']) else None,
                "fp2": event['Session2Date'].isoformat() if pd.notna(event['Session2Date']) else None,
                "fp3": event['Session3Date'].isoformat() if pd.notna(event['Session3Date']) and event_format != 'sprint' else None,
                "sprint_qualifying": event['Session2Date'].isoformat() if event_format == 'sprint' else None,
                "sprint": event['Session3Date'].isoformat() if event_format == 'sprint' else None,
                "qualifying": event['Session4Date'].isoformat() if pd.notna(event['Session4Date']) else None,
                "race": event['Session5Date'].isoformat() if pd.notna(event['Session5Date']) else None,
            }
        }
        calendar.append(item)
        
    return calendar