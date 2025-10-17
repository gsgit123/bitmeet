import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './lib/db.js';

dotenv.config();

const app = express();

const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());

connectDB();


app.get("/",(req,res)=>{
    res.send("BitMeet Backend is running");
})

app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);       

});


