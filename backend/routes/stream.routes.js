import express from 'express';
import {v4 as uuidv4} from 'uuid';
import dotenv from 'dotenv';


import { protectRoute } from '../middleware/auth.middleware.js';
import { StreamChat } from 'stream-chat';

const router=express.Router();
dotenv.config();

const serverClient=StreamChat.getInstance(
    process.env.STREAM_API_KEY,
    process.env.STREAM_API_SECRET
)


router.get("/token",protectRoute,async(req,res)=>{
    try{
        const userId=req.user._id.toString();
        const token=serverClient.createToken(userId);
        res.json({
            token,
            apiKey:process.env.STREAM_API_KEY,
            user:{
                id:userId,
                name:req.user.username,
                role:req.user.role,
            },
        });
    }catch(error){
        console.log("Error generating token:",error);
        res.status(500).json({message:"token generation error"});

    }
})

export default router;