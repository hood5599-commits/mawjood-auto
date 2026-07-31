import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'info' | 'error';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000); // يختفي الإشعار تلقائياً بعد 4 ثوانٍ
    return () => clearTimeout(timer);
  }, [message, onClose]);

  const bgColors = {
    success: '#38a169',
    info: '#3182ce',
    error: '#e53e3e'
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '25px',
      left: '25px',
      backgroundColor: bgColors[type],
      color: '#ffffff',
      padding: '14px 22px',
      borderRadius: '12px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
      fontWeight: 'bold',
      fontSize: '14px',
      zIndex: 99999,
      display: 'flex',
      alignItem: 'center',
      gap: '10px',
      animation: 'slideUp 0.3s ease-out'
    }}>
      <span>🔔 {message}</span>
      <button 
        onClick={onClose} 
        style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
      >
        ✕
      </button>
    </div>
  );
};
