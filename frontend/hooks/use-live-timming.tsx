import { useState, useEffect } from 'react';

export const useLiveTiming = () => {
  const [timing, setTiming] = useState<any>(null);
  const [mapData, setMapData] = useState<any>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [radios, setRadios] = useState<any[]>([]);
  const [weather, setWeather] = useState<any>(null);
  const [trackStatus, setTrackStatus] = useState<any>(null);
  const [sessionInfo, setSessionInfo] = useState<any>(null);

  useEffect(() => {
    // URL de tu Codespace o Localhost
    const socket = new WebSocket('wss://studious-dollop-vg7x6gjv9rpfwpjq-8000.app.github.dev/ws/live');

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        switch (msg.type) {
          case 'SESSION_INFO':
            setSessionInfo(msg.content);
            break;
          case 'TIMING':
            console.log("timing", msg.content)
            // En el simulador/procesador pro, msg.content ya trae las líneas mapeadas por ID
            setTiming((prev: any) => ({
              ...prev,
              ...msg.content
            }));
            break;

          case 'MAP':
            // El mapa se reemplaza entero en cada frame (5Hz) para evitar ghosting
            setMapData(msg.content);
            break;

          case 'WEATHER':
            setWeather(msg.content);
            break;

          case 'TRACK_STATUS':
            setTrackStatus(msg.content);
            break;

          case 'MESSAGES':
            // Manejamos si llega un array de mensajes o uno solo
            const newMsgs = Array.isArray(msg.content) ? msg.content : [msg.content];
            setMessages((prev) => [...newMsgs, ...prev].slice(0, 50));
            break;

          case 'RADIOS':
            setRadios((prev) => [msg.content, ...prev].slice(0, 10));
            break;

          default:
            console.log('Unhandled msg type:', msg.type);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    socket.onopen = () => console.log("🏎️ Connected to F1 Live Stream");
    socket.onclose = () => console.log("❌ Disconnected from F1 Live Stream");

    return () => socket.close();
  }, []);

  return { timing, mapData, messages, radios, weather, trackStatus };
};