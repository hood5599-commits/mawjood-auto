import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  supabaseUrl: string;
  apiKey: string;
}

interface State {
  hasError: boolean;
  errorInfo: string | null;
}

export class AIErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorInfo: error.toString() };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.reportErrorToDatabase(error, errorInfo);
  }

  private async reportErrorToDatabase(error: Error, errorInfo: ErrorInfo) {
    try {
      const cleanUrl = this.props.supabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
      
      const payload = {
        error_level: 'error',
        error_message: error.message || error.toString(),
        stack_trace: errorInfo.componentStack,
        component_name: 'Client_UI_Component',
        user_agent: navigator.userAgent,
        auto_resolved: false
      };

      await fetch(`${cleanUrl}/rest/v1/system_logs`, {
        method: 'POST',
        headers: {
          'apikey': this.props.apiKey,
          'Authorization': `Bearer ${this.props.apiKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.error("Failed to log error to database:", e);
    }
  }

  private handleReload = () => {
    this.setState({ hasError: false, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          fontFamily: 'Cairo, sans-serif',
          maxWidth: '500px',
          margin: '60px auto',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          direction: 'rtl'
        }}>
          <h3 style={{ color: '#1f3a5f', marginBottom: '10px' }}>تم رصد ملاحظة تقنية بسيطة</h3>
          <p style={{ color: '#64748b', fontSize: '13.5px', marginBottom: '20px' }}>
            يقوم نظام الصيانة الذاتي برصد المشكلة وتحليلها لإصلاحها تلقائياً. يمكنك إعادة تنشيط الصفحة للمتابعة.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              padding: '12px 28px',
              backgroundColor: '#1f3a5f',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            إعادة تحميل الصفحة
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AIErrorBoundary;
