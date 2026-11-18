import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryState {
  error: Error | null;
}

class AppErrorBoundary extends React.Component<
  {children: React.ReactNode},
  ErrorBoundaryState
> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = {error: null};
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {error};
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-dvh flex items-center justify-center bg-[#F8F7F4] text-[#141517] p-6">
          <div className="max-w-md w-full bg-white border border-black/10 rounded-2xl p-6 space-y-3">
            <p className="text-xs font-mono text-[#B45309]">
              Spark&amp;Lintel Design-Builders
            </p>
            <h1 className="font-display text-xl font-semibold">
              Studio Display Recovery
            </h1>
            <p className="text-sm text-[#57534E]">
              {this.state.error.message ||
                'A display error occurred while loading the 3D studio.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-[#141517] text-white text-xs font-semibold cursor-pointer"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);
