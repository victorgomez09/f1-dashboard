from utils.sse_manager import manager

has_sent_initial = {}

async def process_f1_stream(topic, data, client_id=None):
    if data is None: return

    # f1-dash estructura: { category: topic, data: data }
    payload = {
        "category": topic,
        "data": data
    }

    # Determinamos si es un dato inicial o una actualización
    # Tópicos que suelen ser 'initial': DriverList, SessionInfo al conectar
    # Pero para simplificar y ser compatible con f1-dash:
    event = "update"
    
    # Si quieres que DriverList y SessionInfo lleguen por el canal "initial":
    if topic in ["DriverList", "SessionInfo"]:
        event = "initial"

    await manager.broadcast(event, payload)