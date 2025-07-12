import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';

// 컴포넌트 import (추후 생성)
import TeacherLogin from './components/TeacherLogin';
import TeacherDashboard from './components/TeacherDashboard';
import StudentEntry from './components/StudentEntry';
import SeeThinkWonderForm from './components/SeeThinkWonderForm';

function App() {
  return (
    <Router>
      <div className="App min-h-screen bg-gray-50">
        <Routes>
          {/* 교사용 라우트 */}
          <Route path="/teacher" element={<TeacherLogin />} />
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          
          {/* 학생용 라우트 */}
          <Route path="/student" element={<StudentEntry />} />
          <Route path="/student/activity/:roomId" element={<SeeThinkWonderForm />} />
          
          {/* 기본 라우트 */}
          <Route path="/" element={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-8">
                  사고루틴 웹앱
                </h1>
                <p className="text-xl text-gray-600 mb-12">
                  See-Think-Wonder 사고루틴으로 깊이 있는 학습을 시작해보세요
                </p>
                <div className="space-x-4">
                  <Link 
                    to="/teacher" 
                    className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                  >
                    교사용 로그인
                  </Link>
                  <Link 
                    to="/student" 
                    className="bg-secondary-600 hover:bg-secondary-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                  >
                    학생 참여
                  </Link>
                </div>
              </div>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
