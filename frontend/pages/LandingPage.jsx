import React from 'react'
import { useNavigate } from 'react-router-dom'

const LandingPage = () => {
    const navigate=useNavigate();
  return (
    <>
    <div>This is langing page .It will contain choices of interview and casuaal meet</div>
    <button onClick={()=> navigate("/interviewLogin")}>interview</button><br/>
    <button onClick={()=> navigate("/casualLogin")}>casual</button>
    </>
  )
}

export default LandingPage