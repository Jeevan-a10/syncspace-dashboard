import { io } from 'socket.io-client';

let socketInstance = null;

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001';

/**
 * Initializes and returns the shared Socket.io client instance
 */
export function getSocket() {
  if (typeof window === 'undefined') {
    return null; // Return null on server-side rendering
  }

  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling'],
      timeout: 10000,
    });
  }

  return socketInstance;
}

/**
 * Disconnects and resets the socket instance
 */
export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}

/**
 * Standard Palette Colors for Peer Cursors & Avatars
 */
export const USER_PALETTES = [
  { name: 'Violet', bg: '#6366f1', text: '#ffffff', light: '#e0e7ff', border: '#818cf8' },
  { name: 'Emerald', bg: '#10b981', text: '#ffffff', light: '#d1fae5', border: '#34d399' },
  { name: 'Amber', bg: '#f59e0b', text: '#ffffff', light: '#fef3c7', border: '#fbbf24' },
  { name: 'Rose', bg: '#f43f5e', text: '#ffffff', light: '#ffe4e6', border: '#fb7185' },
  { name: 'Cyan', bg: '#06b6d4', text: '#ffffff', light: '#cffafe', border: '#22d3ee' },
  { name: 'Indigo', bg: '#4f46e5', text: '#ffffff', light: '#e0e7ff', border: '#6366f1' },
];

/**
 * Assigns a deterministic or randomized palette color
 */
export function getPaletteColor(identifier = '') {
  if (!identifier) return USER_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % USER_PALETTES.length;
  return USER_PALETTES[index];
}
