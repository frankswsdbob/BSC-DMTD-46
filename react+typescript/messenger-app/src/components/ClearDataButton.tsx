// src/components/ClearDataButton.tsx
import { useState } from 'react';
import { CSSProperties } from 'react';
import { fetchAllMessages } from '../api/chatApi';

interface ClearDataButtonProps {
    onClearComplete?: () => void; // 清理完成后的回调（用于刷新界面）
}

const ClearDataButton = ({ onClearComplete }: ClearDataButtonProps) => {
    const [loading, setLoading] = useState(false);

    // 清空本地所有聊天数据
    const handleClearData = async () => {
        if (loading) return;
        if (!window.confirm('确定要清空所有本地聊天数据吗？此操作不可恢复！')) {
            return;
        }

        setLoading(true);
        try {
            // 1. 清除localStorage中的消息数据
            localStorage.removeItem('allMessages');
            localStorage.removeItem('latestMessages');

            // 2. 触发localStorage事件，通知其他组件数据已清空
            window.dispatchEvent(new Event('storage'));

            // 3. 调用回调通知父组件刷新界面
            if (onClearComplete) {
                onClearComplete();
            }

            alert('本地聊天数据已清空');
        } catch (error) {
            console.error('清空数据失败:', error);
            alert('清空失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleClearData}
            style={buttonStyle}
            disabled={loading}
        >
            {loading ? '清理中...' : 'Clear Local Data'}
        </button>
    );
};

// style
const buttonStyle: CSSProperties = {
    padding: '6px 12px',
    backgroundColor: '#e6391eff',
    color: 'white',
    border: '1px solid #dcdf35ff',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '12px',
    margin: '0 15px 10px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
    transition: 'background-color 0.2s'
};

export default ClearDataButton;