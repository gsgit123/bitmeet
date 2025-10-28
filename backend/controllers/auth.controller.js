import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateToken } from "../lib/utils.js";
export const signup = async(req, res) => {
     const { username, email, password,role } = req.body;
     try {
        if(password.length < 6){
            return res.status(400).json({message:"Password must be at least 6 characters long"});
        }

        const user=await User.findOne({email});
        if(user){
            return res.status(400).json({message:"User with this email already exists"});
        }
        const salt=await bcrypt.genSalt(10);
        const hashedPassword=await bcrypt.hash(password,salt);
        const newUser=new User({
            username,
            email,
            password:hashedPassword,
            role
        })
        if(newUser){
            generateToken(newUser._id,res);
            await newUser.save();
            return  res.status(201).json({
                _id:newUser._id,
                username:newUser.username,
                email:newUser.email,
                role:newUser.role   
            })

        }else{
            return res.status(400).json({message:"Invalid user data"});
        }
        

        
     } catch (error) {
        console.log("Error in signup:",error);
        return res.status(500).json({message:error});
     }
}

export const login=async (req,res)=>{
    const {email,password}=req.body;
    try {
        const user=await User.findOne({email});
        if(!user){
            return res.status(400).json({message:"Invalid email or password"});
            console.log("User not found");
        }
        const isMatch=await bcrypt.compare(password,user.password);
        if(!isMatch){
            return res.status(400).json({message:"Invalid email or password"});
        }

        generateToken(user._id,res);
        return res.status(200).json({
            _id:user._id,
            username:user.username,
            email:user.email,
            role:user.role   
        });
    } catch (error) {
        console.log("Error in login:",error);
        return res.status(500).json({message:"Server error"});
    }
}

export const logout=(req,res)=>{
    try {
        res.clearCookie("jwt","",{maxAge:0})
        res.status(200).json({message:"Logged out successfully"});
        
    } catch (error) {
        console.log("Error in logout:",error);
        return res.status(500).json({message:"Server error"});
    }
}

export const checkAuth=(req,res)=>{
    try {
        res.status(200).json(req.user);
    } catch (error) {
        console.log("Error in checkAuth:",error);
        return res.status(500).json({message:"Server error"});
    }
}