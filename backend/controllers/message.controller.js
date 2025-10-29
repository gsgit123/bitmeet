import Message from '../models/message.model.js';

export const getMessages=async(req,res)=>{
    try{
        const messages=await Message.find({roomId:req.params.roomId}).populate('sender','username')
        .sort({createdAt:1});
        res.status(200).json(messages);
    }catch(err){
        res.status(500).json({error:err.message});
    }
}

export const postMessage=async(req,res)=>{
    try{
        const {roomId,senderId,content}=req.body;
        if(!roomId || !senderId || !content){
            return  res.status(400).json({error:'All fields are required'});
        }
        const newMes=new Message({
            roomId,
            sender:senderId,
            content
        });

        await newMes.save();

        const populatedMes=await newMes.populate('sender','username');

        res.status(201).json(populatedMes);
    }catch(err){
        res.status(500).json({error:err.message});
        console.log("error saving messages",err);
    }
}
