import mongoose from 'mongoose';

const messageSchema=new mongoose.Schema({
    roomId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:'Room'
    },
    sender:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:'User'
    },
    content:{
        type:String,
        required:true
    }

},{
    timestamps:true
});

const Message=mongoose.model('Message',messageSchema);

export default Message;