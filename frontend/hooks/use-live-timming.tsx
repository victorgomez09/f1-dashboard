import { useState, useEffect } from 'react';

export const useLiveTiming = () => {
  const [timing, setTiming] = useState<any>(null);
  const [mapData, setMapData] = useState<any>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [radios, setRadios] = useState<any[]>([]);

  useEffect(() => {
    // const socket = new WebSocket('ws://localhost:8000/ws/live');
    const socket = new WebSocket('wss://studious-dollop-vg7x6gjv9rpfwpjq-8000.app.github.dev/ws/live');

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      console.log('msg', msg)
      switch (msg.type) {
        case 'TIMING':
          // Fusionamos los datos para no perder los pilotos que no vienen en este paquete
          setTiming((prev: any) => ({ ...prev, ...msg.content.Lines }));
          break;
        case 'MAP':
          setMapData(msg.content);
          break;
        case 'MESSAGES':
          setMessages((prev) => [msg.content, ...prev].slice(0, 50));
          break;
        case 'RADIOS':
          setRadios((prev) => [msg.content, ...prev].slice(0, 10));
          break;
      }
    };

    return () => socket.close();
  }, []);

  return { timing, mapData, messages, radios };
};