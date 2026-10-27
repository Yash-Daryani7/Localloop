import { io } from 'socket.io-client'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8084'

const socket = io(API_URL, {
  autoConnect: false,
  withCredentials: true
})

export default socket
