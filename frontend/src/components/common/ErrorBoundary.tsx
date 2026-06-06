import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className="glass-panel"
          style={{
            padding: '40px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '300px',
            gap: '16px',
            border: '1px solid rgba(220, 38, 38, 0.2)',
            background: 'rgba(220, 38, 38, 0.02)',
            borderRadius: '16px',
          }}
        >
          <AlertOctagon size={48} style={{ color: '#dc2626' }} />
          <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', margin: 0 }}>
            Something went wrong
          </h2>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '14px',
              maxWidth: '400px',
              margin: 0,
            }}
          >
            An unexpected error occurred in this section of the application.
          </p>
          {this.state.error && (
            <pre
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#b91c1c',
                maxWidth: '100%',
                overflowX: 'auto',
                fontFamily: 'monospace',
                textAlign: 'left',
              }}
            >
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleReset}
            className="btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: '#dc2626',
              color: '#ffffff',
            }}
          >
            <RefreshCw size={16} /> Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
