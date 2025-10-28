import React from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import API from '../../lib/axios';
import { useAuthStore } from '../../store/useAuthStore';

const Authpage = () => {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const {setAuthUser}=useAuthStore();
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        role: "casual"
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");
        try {
            const url = isLogin ? "/auth/login" : "/auth/signup";
            const data = isLogin
                ? { email: formData.email, password: formData.password }
                : formData;

            const res=await API.post(url, data);
            const user=res.data
            console.log("Auth successful:",user);
            setAuthUser(user);
            setMessage(res.data.message);

            if(user.role==="interviewer")navigate("/interviewSection");
            else if(user.role==="casual")navigate("/casualSection");
            else navigate("/candidateSection");

        
            
        }catch(error){
            console.log(error);
            setError(error.response?.data?.message || "Something went wrong");
        }
        finally{
            setLoading(false);
        }
    }


    return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-sm">
        <h2 className="text-xl font-bold text-center mb-4">{isLogin ? "Login" : "Signup"}</h2>
        <form className="flex flex-col space-y-3" onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <input
                type="text"
                name="username"
                placeholder="Name"
                value={formData.username}
                onChange={handleChange}
                className="border px-3 py-2 rounded"
                required
              />
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="border px-3 py-2 rounded"
              >
                <option value="interviewer">Interviewer</option>
                <option value="candidate">Candidate</option>
                <option value="casual">Casual</option>
              </select>
            </>
          )}
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="border px-3 py-2 rounded"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="border px-3 py-2 rounded"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-green-500 text-white py-2 rounded font-bold"
          >
            {loading ? "Please wait..." : isLogin ? "Login" : "Signup"}
          </button>
        </form>

        <p className="text-center text-sm mt-3">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <span
            className="text-green-500 cursor-pointer font-semibold"
            onClick={() => { setIsLogin(!isLogin); setMessage(""); }}
          >
            {isLogin ? "Signup" : "Login"}
          </span>
        </p>

        {message && <p className="text-center text-red-500 mt-2">{message}</p>}
      </div>
    </div>
  );
}

export default Authpage