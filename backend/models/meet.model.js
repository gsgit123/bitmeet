import mongoose from 'mongoose';

const meetSchema = new mongoose.Schema({
    meetId:{
        type: String,
        required: true,
        unique: true
    },
    interviewerId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    candidateId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        default:null
    },
    createdAt:{
        type:Date,
        default:Date.now
    }
});

const Meet = mongoose.model('Meet', meetSchema);

export default Meet;