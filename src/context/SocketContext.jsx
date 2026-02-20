import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';
import { notification } from 'antd';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (isAuthenticated && user) {
            // Determine backend URL
            const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5003';

            const newSocket = io(backendUrl, {
                withCredentials: true,
                transports: ['websocket', 'polling']
            });

            newSocket.on('connect', () => {
                console.log('Connected to WebSocket server', newSocket.id);
                const userId = user._id || user.id;
                if (userId) {
                    console.log('Joining room for userId:', userId);
                    newSocket.emit('join', userId);
                } else {
                    console.error('UserId not found for socket join', user);
                }
            });

            newSocket.on('task_created', (task) => {
                notification.info({
                    message: 'New Task Assigned',
                    description: `A new task "${task.task}" has been assigned to you.`,
                    placement: 'bottomRight',
                });
            });

            newSocket.on('task_forwarded', (task) => {
                notification.info({
                    message: 'Task Forwarded',
                    description: `Task "${task.task}" has been forwarded to you by ${task.forwardedByName}.`,
                    placement: 'bottomRight',
                });
            });

            newSocket.on('task_approved', (task) => {
                notification.success({
                    message: 'Task Approved',
                    description: `Your task "${task.task}" has been approved.`,
                    placement: 'bottomRight',
                });
            });

            newSocket.on('task_rejected', (task) => {
                notification.error({
                    message: 'Task Rejected',
                    description: `Your task "${task.task}" has been rejected.`,
                    placement: 'bottomRight',
                });
            });

            newSocket.on('task_waiting_approval', (task) => {
                notification.info({
                    message: 'Task Waiting Approval',
                    description: `Task "${task.task}" is now waiting for intermediate approval.`,
                    placement: 'bottomRight',
                });
            });

            newSocket.on('task_status_changed', (task) => {
                const currentUserId = user._id || user.id;
                const isAssignee = String(task.assignedTo?._id || task.assignedTo) === String(currentUserId);
                const isCreator = String(task.createdBy?._id || task.createdBy) === String(currentUserId);

                if (isAssignee || isCreator) {
                    notification.info({
                        message: 'Task Status Updated',
                        description: `Status of task "${task.task}" changed to: ${task.status}`,
                        placement: 'bottomRight',
                    });
                }
            });


            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            };
        } else {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
        }
    }, [isAuthenticated, user]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
