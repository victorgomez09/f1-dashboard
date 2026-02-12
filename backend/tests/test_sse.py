import asyncio
import httpx

async def test_f1_stream():
    url = "http://localhost:8000/api/realtime"
    print(f"📡 Conectando al stream en {url}...")
    
    try:
        async with httpx.AsyncClient(timeout=None) as client:
            async with client.stream("GET", url) as response:
                print("✅ Conexión establecida. Esperando eventos...\n")
                
                event_type = None
                async for line in response.aiter_lines():
                    if line.startswith("event:"):
                        event_type = line.replace("event:", "").strip()
                    elif line.startswith("data:"):
                        # Si recibes un INITIAL, imprímelo completo una vez para ver qué trae
                        if event_type == "initial":
                            print(f"🌟 ¡SNAPSHOT RECIBIDO!: {line[:200]}...")
                        else:
                            print(f"🔔 {event_type.upper()}: {line[:60]}...")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_f1_stream())