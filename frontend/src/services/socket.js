import { io } from 'socket.io-client';

let socket = null;

export const initiateSocketConnection = (userId) => {
  if (socket) return socket;

  socket = io('http://localhost:5000');
  console.log('Connecting socket...');

  if (userId) {
    socket.emit('joinUser', userId);
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    console.log('Disconnecting socket...');
    socket.disconnect();
    socket = null;
  }
};

export const joinProjectRoom = (projectId) => {
  if (socket) {
    socket.emit('joinProject', projectId);
  }
};

export const leaveProjectRoom = (projectId) => {
  if (socket) {
    socket.emit('leaveProject', projectId);
  }
};

export const getSocket = () => socket;
