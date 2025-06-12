import { useEffect, useState } from "react";
import { io } from "socket.io-client";


const backend_url = 'http://localhost:4243';

export const useSocket = () => {
    const[socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const newSocket = io(backend_url, {
            transports: ['websocket'],
            timeout: 20000,
        });
    
    newSocket.on('connect', () => {
        console.log('Backend connected Successfully');
        setConnected(true);
        newSocket.emit('join-leaderboard');
    });

    newSocket.on('disconnect', () => {
        console.log('Backend disconnected');
        setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        setConnected(false);
    });

    setSocket(newSocket);

    return () => {
        newSocket.close();
    };
}, []);

    return { socket, connected };

};