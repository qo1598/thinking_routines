import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
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
import * as ChannelService from '@channel.io/channel-web-sdk-loader';

function App() {
  const location = useLocation();

  useEffect(() => {
    const isStudentPath = location.pathname.startsWith('/student');

    if (isStudentPath) {
      ChannelService.shutdown();
    } else {
      ChannelService.loadScript();
      ChannelService.boot({
        pluginKey: '31d0c99e-1966-4296-b7bd-208b69dba1e0',
      });
    }

    return () => {
      ChannelService.shutdown();
    };
  }, [location.pathname]);

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
