import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TeacherLogin from './components/TeacherLogin';
import TeacherDashboard from './components/TeacherDashboard';
import TeacherRoomManagement from './components/TeacherRoomManagement';
import StudentEntry from './components/StudentEntry';
import SeeThinkWonderForm from './components/SeeThinkWonderForm';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* 기본 경로를 교사 로그인 페이지로 설정 */}
          <Route path="/" element={<TeacherLogin />} />
          
          {/* 교사 관련 경로 */}
          <Route path="/teacher" element={<TeacherLogin />} />
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/room/:roomId" element={<TeacherRoomManagement />} />
          
          {/* 학생 관련 경로 */}
          <Route path="/student" element={<StudentEntry />} />
          <Route path="/student/activity/:roomId" element={<SeeThinkWonderForm />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
