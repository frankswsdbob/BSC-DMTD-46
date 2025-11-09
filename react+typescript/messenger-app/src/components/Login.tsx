import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { CSSProperties } from 'react';
import { fetchUsers } from '../api/chatApi'; // 从API获取用户

const Login = () => {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async () => {
        if (!username.trim()) {
            alert('请输入用户名');
            return;
        }

        setLoading(true);
        try {
            // 从API获取用户列表（含内置兜底）
            const users = await fetchUsers();
            const isValidUser = users.some(user => user.name === username);

            if (!isValidUser) {
                alert('用户不存在，请输入正确的用户名');
                return;
            }

            // 存储当前用户和标签页ID（sessionStorage隔离）
            const windowId = uuidv4();
            sessionStorage.setItem('windowId', windowId);
            sessionStorage.setItem('currentUser', username);
            //使用 setTimeout 延迟跳转（简单有效，确保存储生效）
            setTimeout(() => {
                navigate('/channels');
                setLoading(false);
            }, 100);
            // 跳转到频道列表
            navigate('/channels');
        } catch (error) {
            alert('登录失败，请重试');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={loginContainer}>
            <div style={loginBox}>
                <div style={logoContainer}>
                    <div style={logo}>QQ</div>
                    <h2 style={title}>消息系统</h2>
                </div>
                <input
                    type="text"
                    placeholder="输入用户名（如Alice/Bob）"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={inputStyle}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    disabled={loading}
                />
                <button
                    onClick={handleLogin}
                    style={buttonStyle}
                    disabled={loading}
                >
                    {loading ? '登录中...' : '登录'}
                </button>
            </div>
        </div>
    );
};

// QQ风格登录样式
const loginContainer: CSSProperties = {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center' as const,
    minHeight: '100vh',
    backgroundColor: '#e8ebf1',
    padding: '20px'
};

const loginBox: CSSProperties = {
    width: '320px',
    padding: '30px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px'
};

const logoContainer: CSSProperties = {
    alignItems: 'center',
    justifyContent: 'center' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '15px'
};

const logo: CSSProperties = {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#0084ff',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center' as const,
    fontSize: '24px',
    fontWeight: 'bold'
};

const title: CSSProperties = {
    margin: 0,
    color: '#333',
    fontSize: '20px'
};

const inputStyle: CSSProperties = {
    padding: '10px 12px',
    width: '100%',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
    height: '40px'
};

const buttonStyle: CSSProperties = {
    padding: '10px 12px',
    backgroundColor: '#0084ff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    width: '100%',
    height: '40px',
    boxSizing: 'border-box' as const
};

export default Login;