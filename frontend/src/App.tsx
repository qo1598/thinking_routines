import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import TeacherLogin from './components/TeacherLogin';
import TeacherDashboard from './components/TeacherDashboard';
import TeacherRoomDetail from './components/TeacherRoomDetail';
import StudentResponseDetail from './components/StudentResponseDetail';
import StudentEntry from './components/StudentEntry';
import SeeThinkWonderForm from './components/SeeThinkWonderForm';
import './App.css';
import * as ChannelService from '@channel.io/channel-web-sdk-loader';

function App() {
  useEffect(() => {
    ChannelService.loadScript();
    ChannelService.boot({
      pluginKey: '31d0c99e-1966-4296-b7bd-208b69dba1e0',
    });
  }, []);

  return (
    <Router>
    <div className="App">
        <Routes>
          {/* 기본 경로를 랜딩 페이지로 설정 */}
          <Route path="/" element={<LandingPage />} />
          {/* 교사 관련 경로 */}
          <Route path="/teacher" element={<TeacherLogin />} />
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/thinking-routines" element={<TeacherDashboard />} />
          <Route path="/teacher/room/:roomId" element={<TeacherRoomDetail />} />
          <Route path="/teacher/room/:roomId/response/:responseId" element={<StudentResponseDetail />} />
          {/* 학생 관련 경로 */}
          <Route path="/student" element={<StudentEntry />} />
          <Route path="/student/activity/:roomId" element={<SeeThinkWonderForm />} />
        </Routes>
    </div>
    </Router>
  );
}

export default App;
