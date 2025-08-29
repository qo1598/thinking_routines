import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import TeacherLogin from './components/TeacherLogin';
import TeacherDashboard from './components/TeacherDashboard';
import TeacherRoomDetail from './components/TeacherRoomDetail';
import StudentResponseDetail from './components/StudentResponseDetail';
import StudentEntry from './components/StudentEntry';
import StudentActivityDetail from './components/StudentActivityDetail';
import ThinkingRoutinesForm from './components/ThinkingRoutinesForm';
import StudentActivityExplore from './components/StudentActivityExplore';
import './App.css';

function App() {

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/teacher" element={<TeacherLogin />} />
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        <Route path="/teacher/activate" element={<TeacherDashboard />} />
        <Route path="/teacher/analysis" element={<TeacherDashboard />} />
        <Route path="/teacher/portfolio" element={<TeacherDashboard />} />
        <Route path="/teacher/portfolio/:activityId" element={<StudentActivityDetail />} />
        <Route path="/teacher/thinking-routines" element={<TeacherDashboard />} />
        <Route path="/teacher/room/:roomId" element={<TeacherRoomDetail />} />
        <Route path="/teacher/room/:roomId/response/:responseId" element={<StudentResponseDetail />} />
        <Route path="/student" element={<StudentEntry />} />
        <Route path="/student/activity/:roomId" element={<ThinkingRoutinesForm />} />
        <Route path="/student/explore/:roomId" element={<StudentActivityExplore />} />
      </Routes>
    </div>
  );
}

export default App;
