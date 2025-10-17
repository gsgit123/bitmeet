import React from 'react'
import {Routes ,Route} from 'react-router-dom'
import LandingPage from '../pages/LandingPage'
import InterviewSection from '../pages/dashboards/InterviewSection'
import CasualSection from '../pages/dashboards/CasualSection'
import InterviewLogin from '../pages/login/InterviewLogin'
import CasualLogin from '../pages/login/CasualLogin'


const App = () => {
  return (
    <Routes>
        <Route path='/' element={<LandingPage/>}/>
        <Route path='/interviewSection' element={<InterviewSection/>}/>
        <Route path='/casualSection' element={<CasualSection/>}/>
        <Route path='/interviewLogin' element={<InterviewLogin/>}/>
        <Route path='/casualLogin' element={<CasualLogin/>}/>

    </Routes>
  )
}

export default App