import { F1State } from '@/types/state';
import { useState, useEffect, useRef } from 'react';

export const useF1Live = (url: string = "ws://localhost:8000/ws") => {
  const [data, setData] = useState<F1State>({});
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const connect = () => {
      const socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onopen = () => setIsConnected(true);
      socket.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        if (Object.keys(payload).length > 0) {
          setData(payload);
        }
      };
      socket.onclose = () => {
        setIsConnected(false);
        setTimeout(connect, 3000);
      };
    };

    connect();
    return () => socketRef.current?.close();
  }, [url]);

  return { data, isConnected };
};