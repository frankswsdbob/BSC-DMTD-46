import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import ChannelList from './components/ChannelList';
import MessageView from './components/MessageView';

// 核心修复：创建动态检测登录状态的组件
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  // 每次渲染都重新检测 sessionStorage，确保状态最新
  const isLoggedIn = !!sessionStorage.getItem('currentUser');

  if (!isLoggedIn) {
    // 未登录时跳回登录页，保留跳转前的路径（可选）
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        {/* 用 ProtectedRoute 包裹需要登录的路由 */}
        <Route
          path="/channels"
          element={
            <ProtectedRoute>
              <ChannelList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/channels/:channelName"
          element={
            <ProtectedRoute>
              <MessageView />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;