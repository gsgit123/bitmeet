import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../lib/axios";
import { useAuthStore } from "../../store/useAuthStore";

const CandidateSection = () => {
  const [meetId, setMeetId] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { authUser } = useAuthStore();

  const handleJoin = async () => {
    if (!meetId.trim()) {
      alert("Please enter a valid meet ID");
      return;
    }

    try {
      setLoading(true);
      const res = await API.post("/meet/join", { meetId });
      if (res.data.success !== false) {
        navigate(`/meet/${meetId}`);
      } else {
        alert(res.data.message || "Unable to join meet");
      }
    } catch (err) {
      console.error("Error joining meet:", err);
      alert(err.response?.data?.message || "Meet not found");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        Welcome, {authUser?.username || "Candidate"}
      </h1>

      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Enter Meet ID"
          value={meetId}
          onChange={(e) => setMeetId(e.target.value)}
          className="border px-4 py-2 rounded-lg w-72"
        />
        <button
          onClick={handleJoin}
          disabled={loading}
          className={`px-6 py-2 rounded-lg text-white ${
            loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {loading ? "Joining..." : "Join Meet"}
        </button>
      </div>
    </div>
  );
};

export default CandidateSection;
