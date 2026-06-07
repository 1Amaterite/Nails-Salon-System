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
        <div className="glass-panel error-boundary-panel">
          <AlertOctagon size={48} className="error-boundary-icon" />
          <h2 className="error-boundary-title">Something went wrong</h2>
          <p className="error-boundary-text">
            An unexpected error occurred in this section of the application.
          </p>
          {this.state.error && <pre className="error-boundary-pre">{this.state.error.message}</pre>}
          <button onClick={this.handleReset} className="btn-primary btn-error">
            <RefreshCw size={16} /> Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
