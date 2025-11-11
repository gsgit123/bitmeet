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

dotenv.config();

const app = express();

const PORT = process.env.PORT;

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

connectDB();


app.use('/api/auth',authRoutes);
app.use('/api/message',messageRoutes);
app.use('/api/meet',meetRoutes);
app.use('/api/stream',streamRoutes);

app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);       

});


