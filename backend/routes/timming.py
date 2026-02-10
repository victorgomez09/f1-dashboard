
from fastapi import APIRouter
import httpx


router = APIRouter(prefix="/timming", tags=["timming"])

@router.get("/track/{year}/{location}")
async def get_track_layout(year: int, location: str):
    url = f"https://api.multiviewer.app/api/v1/circuits/{location}/{year}"
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        if response.status_code != 200:
            return None
        
        data = response.json()
        # MultiViewer devuelve 'x' e 'y' en un formato que el SVG entiende bien
        return {
            "points": data.get("x", []), # Algunos endpoints usan 'x' e 'y' como arrays separados
            "y_points": data.get("y", []),
            "marshal_sectors": data.get("marshalSectors", []),
            "discrepancy": data.get("discrepancy", 0) # Útil para corregir desfases
        }