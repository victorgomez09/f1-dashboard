import json
import os
from fastapi import APIRouter, HTTPException
import fastf1


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CACHE_DIR = os.path.join(BASE_DIR, 'f1_cache')
RESULTS_DIR = os.path.join(CACHE_DIR, 'teams')

os.makedirs(RESULTS_DIR, exist_ok=True)

fastf1.Cache.enable_cache(CACHE_DIR)
router = APIRouter(prefix="/teams", tags=["teams"])

@router.get("/mapping/{year}")
def get_team_mapping(year: int):
    try:
        file_path = os.path.join(RESULTS_DIR, f"team_mappings_{year}.json")
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                return json.load(f)
        
        schedule = fastf1.get_event_schedule(year)
        first_gp = schedule.iloc[0]['EventName']
        
        session = fastf1.get_session(year, first_gp, 'R')
        session.load(laps=False, telemetry=False, weather=False)
        
        results = session.results[['Abbreviation', 'TeamName', 'TeamColor']]
        
        mapping = {}
        for _, row in results.iterrows():
            color = f"#{row['TeamColor']}" if row['TeamColor'] else "#888888"
            mapping[row['Abbreviation']] = {
                "team": row['TeamName'],
                "color": color
            }

        with open(file_path, 'w') as f:
            json.dump(mapping, f)
            
        return mapping
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))