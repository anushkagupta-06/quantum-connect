import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import http from 'http';
import { Server } from 'socket.io';

import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';

import connectDB from './config/db.js';
import { setupChatSocket } from './sockets/chatSocket.js';

import userRoutes from './routes/userRoutes.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5050;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(bodyParser.json());

// connecting to database
connectDB();

app.use('/api', authRoutes);       
app.use('/api/chat', chatRoutes);  

// Socket.io
setupChatSocket(io);

app.use("/api/user", userRoutes);

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});