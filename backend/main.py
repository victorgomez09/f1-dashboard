from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import drivers, teams, schedule


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En producción pon la URL de tu Next.js
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(drivers.router)
app.include_router(teams.router)
app.include_router(schedule.router)