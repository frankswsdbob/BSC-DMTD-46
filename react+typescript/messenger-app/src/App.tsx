import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useParams, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import ChannelList from './components/ChannelList';
import { MessageView } from './components/MessageView';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isLoggedIn = !!sessionStorage.getItem('currentUser');

  if (!isLoggedIn) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

// 用于获取路由参数并传递给 MessageView 的组件
const MessageViewWrapper = () => {
  const { channelName } = useParams<{ channelName: string }>(); // 获取路由参数
  const currentUser = sessionStorage.getItem('currentUser'); // 从 sessionStorage 获取当前用户
  const navigate = useNavigate(); // 添加导航钩子

  // 确保参数存在（实际项目中可能需要更完善的错误处理）
  if (!channelName || !currentUser) {
    return <Navigate to="/channels" replace />;
  }

  // 添加返回处理函数
  const handleBack = () => {
    navigate('/channels');
  };

  return <MessageView currentUser={currentUser} channelName={channelName} onBack={handleBack} />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
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
              <MessageViewWrapper /> {/* 使用包装组件 */}
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;