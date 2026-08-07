import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { ErrorSentry } from '../utils/errorSentry';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    ErrorSentry.reportError({
      error_type: 'UI_BUG',
      message: error.message,
      stack_trace: errorInfo.componentStack || undefined, // 👈 تم التعديل لمنع استناد قيمة null
      page_url: window.location.href,
      severity: 'CRITICAL'
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '16px', margin: '20px', border: '1px solid #e2e8f0', fontFamily: 'Cairo, sans-serif' }}>
          <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>🛠️</span>
          <h2 style={{ color: '#1f3a5f', margin: '0 0 8px 0' }}>حدث خطأ مؤقت في تحميل الواجهة</h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>تم تسجيل المشكلة وإرسال إشعار لفريق الدعم الفني فوراً للعمل على حلها.</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ padding: '12px 24px', backgroundColor: '#1f3a5f', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            🔄 إعادة تحميل الصفحة
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
