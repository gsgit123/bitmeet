import React from 'react'
import {useNavigate} from 'react-router-dom'
import API from '../../lib/axios'
import { useAuthStore } from '../../store/useAuthStore'
import { useState } from 'react'

const InterviewSection = () => {
  const [meetId,setMeetId]=useState("");
  const navigate=useNavigate();
  const {authUser}=useAuthStore();

  const handleCreate=async()=>{
    try{
      const res=await API.post("/meet/create");
      const {meetId}=res.data;
      navigate(`/meet/${meetId}`);
    }catch(error){
      console.log("Error creating meet:",error);
    }

  }
  const handleJoin=async()=>{
    try{
      const res=await API.post("/meet/join",{meetId});
      navigate(`/meet/${meetId}`);
    }catch(error){
      console.log("Error joining meet:",error);
    }
  }


  return (
    <div className="flex flex-col items-center justify-center h-screen gap-5">
      <h1 className="text-3xl font-bold text-gray-800">Welcome, {authUser.username}</h1>

      {authUser.role === "interviewer" && (
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg"
        >
          Create New Meet
        </button>
      )}

      <div className="flex gap-3 mt-4">
        <input
          type="text"
          placeholder="Enter Meet ID"
          value={meetId}
          onChange={(e) => setMeetId(e.target.value)}
          className="border px-4 py-2 rounded-lg"
        />
        <button
          onClick={handleJoin}
          className="bg-green-500 text-white px-6 py-2 rounded-lg"
        >
          Join Meet
        </button>
      </div>
    </div>
  );
}

export default InterviewSection;