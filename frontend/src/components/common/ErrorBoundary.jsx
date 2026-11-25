import React, { Component } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from './Button';
import './ErrorBoundary.css';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container">
          <div className="error-boundary-card">
            <div className="error-boundary-icon-box">
              <AlertTriangle size={32} />
            </div>
            <h3 className="error-boundary-title">An Unexpected Error Occurred</h3>
            <p className="error-boundary-text">
              The application encountered a runtime issue. You can try refreshing the page or
              resetting the session.
            </p>
            {this.state.error?.message && (
              <pre className="error-boundary-code">
                {this.state.error.message}
              </pre>
            )}
            <div className="error-boundary-actions">
              <Button
                variant="primary"
                icon={RotateCcw}
                onClick={this.handleReset}
              >
                Reload Application
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
