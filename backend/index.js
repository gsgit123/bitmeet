import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './lib/db.js';
import authRoutes from './routes/auth.route.js';
import cookieParser from 'cookie-parser';
import messageRoutes from './routes/message.route.js';
import meetRoutes from './routes/meet.route.js';
import streamRoutes from './routes/stream.routes.js';
import pistonRoutes from './routes/piston.route.js';
import { Server } from 'socket.io';
import http from 'http';
dotenv.config();

const app = express();

const PORT = process.env.PORT;

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
    }
});



app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

connectDB();


app.use('/api/auth', authRoutes);
app.use('/api/message', messageRoutes);
app.use('/api/meet', meetRoutes);
app.use('/api/stream', streamRoutes);
app.use('/api/piston', pistonRoutes);


io.on("connection", (socket) => {
  console.log("New client connected", socket.id);

  // ── Room management ──────────────────────────────────────────────────────
  socket.on("join-room", ({ meetId, userId }) => {
    socket.join(meetId);
    socket.data.meetId = meetId;
    socket.data.userId = userId;

    // Tell every OTHER person in the room that someone just joined
    socket.to(meetId).emit("user-joined", { userId, socketId: socket.id });
    console.log(`${userId} joined room ${meetId}`);
  });

  socket.on("leave-room", ({ meetId, userId }) => {
    socket.leave(meetId);
    socket.to(meetId).emit("user-left", { userId, socketId: socket.id });
    console.log(`${userId} left room ${meetId}`);
  });

  // ── WebRTC signalling ─────────────────────────────────────────────────────
  socket.on("webrtc-offer", ({ meetId, offer }) => {
    socket.to(meetId).emit("webrtc-offer", offer);
  });

  socket.on("webrtc-answer", ({ meetId, answer }) => {
    socket.to(meetId).emit("webrtc-answer", answer);
  });

  socket.on("webrtc-ice-candidate", ({ meetId, candidate }) => {
    socket.to(meetId).emit("webrtc-ice-candidate", candidate);
  });

  // ── Code editor ───────────────────────────────────────────────────────────
  socket.on("code-change",  ({ meetId, code })   => socket.to(meetId).emit("code-update", code));
  socket.on("input-change", ({ meetId, input })  => socket.to(meetId).emit("input-update", input));
  socket.on("output-change",({ meetId, output }) => socket.to(meetId).emit("output-update", output));

  // ── Whiteboard ────────────────────────────────────────────────────────────
  socket.on("join-board", (meetId) => socket.join(meetId));
  socket.on("stroke", ({ meetId, stroke }) => socket.to(meetId).emit("stroke", stroke));

  // ── Disconnect cleanup ────────────────────────────────────────────────────
  socket.on("disconnect", () => {
    const { meetId, userId } = socket.data;
    if (meetId) {
      socket.to(meetId).emit("user-left", { userId, socketId: socket.id });
    }
    console.log("Client disconnected", socket.id);
  });
});


server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);

});


