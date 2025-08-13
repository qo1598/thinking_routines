    import React, { useEffect } from 'react';
    // BrowserRouter as Router는 더 이상 필요 없으므로 제거합니다.
    import { Routes, Route, useLocation } from 'react-router-dom'; // BrowserRouter as Router는 제거하고 Routes, Route, useLocation만 남깁니다.
    import LandingPage from './components/LandingPage';
    import TeacherLogin from './components/TeacherLogin';
    import TeacherDashboard from './components/TeacherDashboard';
    import TeacherRoomDetail from './components/TeacherRoomDetail';
    import StudentResponseDetail from './components/StudentResponseDetail';
    import StudentEntry from './components/StudentEntry';
import SeeThinkWonderForm from './components/SeeThinkWonderForm';
import StudentActivityExplore from './components/StudentActivityExplore';
    import './App.css';
    import * as ChannelService from '@channel.io/channel-web-sdk-loader';

    // Vercel 빌드 캐시 문제 해결을 위한 주석

    function App() {
      const location = useLocation();

      useEffect(() => {
        const isStudentPath = location.pathname.startsWith('/student');

        if (isStudentPath) {
          ChannelService.shutdown(); // 학생 경로일 경우 채널톡 종료
        } else {
          ChannelService.loadScript();
          ChannelService.boot({
            pluginKey: '31d0c99e-1966-4296-b7bd-208b69dba1e0', // 여기에 실제 플러그인 키를 입력하세요.
          });
        }

        // 컴포넌트 언마운트 시 또는 경로 변경 시 ChannelService 정리
        return () => {
          ChannelService.shutdown();
        };
      }, [location.pathname]); // location.pathname이 변경될 때마다 useEffect 재실행

      return (
        // <Router> 태그는 더 이상 필요 없으므로 제거합니다.
        <div className="App">
          <Routes>
            {/* 기본 경로를 랜딩 페이지로 설정 */}
            <Route path="/" element={<LandingPage />} />
            {/* 교사 관련 경로 */}
            <Route path="/teacher" element={<TeacherLogin />} />
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
            <Route path="/teacher/activate" element={<TeacherDashboard />} />
            <Route path="/teacher/analysis" element={<TeacherDashboard />} />
            <Route path="/teacher/portfolio" element={<TeacherDashboard />} />
            <Route path="/teacher/portfolio/:activityId" element={<TeacherDashboard />} />
            <Route path="/teacher/thinking-routines" element={<TeacherDashboard />} />
            <Route path="/teacher/room/:roomId" element={<TeacherRoomDetail />} />
            <Route path="/teacher/room/:roomId/response/:responseId" element={<StudentResponseDetail />} />
            {/* 학생 관련 경로 */}
            <Route path="/student" element={<StudentEntry />} />
            <Route path="/student/activity/:roomId" element={<SeeThinkWonderForm />} />
            <Route path="/student/explore/:roomId" element={<StudentActivityExplore />} />
          </Routes>
        </div>
        // </Router> 태그는 더 이상 필요 없으므로 제거합니다.
      );
    }

    export default App;
