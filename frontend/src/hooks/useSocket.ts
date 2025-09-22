import { useEffect, useState } from 'react';
import { Socket, io } from 'socket.io-client';

export function useSocket(replId?: string) {
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        if (!replId) return;
        
        const newSocket = io(`ws://${replId}.davish.tech`, {
            transports: ['websocket', 'polling'],
            timeout: 20000,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5,
            forceNew: true
        });

        newSocket.on('connect', () => {
            console.log('Socket connected:', newSocket.id);
        });

        newSocket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
        });

        newSocket.on('reconnect', (attemptNumber) => {
            console.log('Socket reconnected after', attemptNumber, 'attempts');
        });

        newSocket.on('reconnect_error', (error) => {
            console.error('Socket reconnection error:', error);
        });

        newSocket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [replId]);

    return { socket };
}
