import { Component } from 'react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '40px',
                    textAlign: 'center',
                    backgroundColor: '#fef2f2',
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <h1 style={{ color: '#dc2626', marginBottom: '16px' }}>Something went wrong</h1>
                    <p style={{ color: '#7f1d1d', marginBottom: '24px' }}>
                        An error occurred while rendering the application.
                    </p>
                    <details style={{
                        textAlign: 'left',
                        whiteSpace: 'pre-wrap',
                        maxWidth: '800px',
                        backgroundColor: '#fff',
                        padding: '16px',
                        borderRadius: '8px',
                        border: '1px solid #fecaca'
                    }}>
                        <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>Error Details</summary>
                        {this.state.error && (
                            <pre style={{ color: '#dc2626', overflowX: 'auto' }}>
                                {this.state.error.toString()}
                            </pre>
                        )}
                        {this.state.errorInfo && (
                            <pre style={{ color: '#6b7280', fontSize: '12px', overflowX: 'auto' }}>
                                {this.state.errorInfo.componentStack}
                            </pre>
                        )}
                    </details>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: '24px',
                            padding: '12px 24px',
                            backgroundColor: '#7C3AED',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '16px'
                        }}
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
