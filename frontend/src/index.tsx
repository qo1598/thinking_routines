    // frontend/src/index.tsx
    import React from 'react';
    import ReactDOM from 'react-dom/client';
    import './index.css';
    import App from './App';
    import reportWebVitals from './reportWebVitals';
    import { BrowserRouter } from 'react-router-dom'; // BrowserRouter를 임포트합니다.

    const root = ReactDOM.createRoot(
      document.getElementById('root') as HTMLElement
    );
    root.render(
      <React.StrictMode>
        <BrowserRouter> {/* App 컴포넌트를 BrowserRouter로 감쌉니다. */}
          <App />
        </BrowserRouter>
      </React.StrictMode>
    );

    reportWebVitals();
