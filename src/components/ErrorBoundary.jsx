import React from "react";
import { RefreshCw, Home, ShieldAlert } from "lucide-react";
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error, errorInfo: null };
  }
  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary caught error]:", error, errorInfo);
    this.setState({ errorInfo });
  }
  handleReload = () => {
    window.location.reload();
  };
  handleReset = () => {
    try {
      localStorage.removeItem("convo_custom_hand_signs_v3");
    } catch {
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };
  render() {
    if (this.state.hasError) {
      return <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Something encountered an unexpected issue
              </h1>
              <p className="text-sm text-slate-400 leading-relaxed">
                The application caught a runtime error. You can reload the page or reset the app state to restore functionality.
              </p>
            </div>

            {this.state.error && <div className="text-left bg-slate-950 p-4 rounded-2xl border border-slate-800/80 max-h-40 overflow-y-auto">
                <p className="text-xs font-mono text-rose-400 break-words font-semibold">
                  {this.state.error.name}: {this.state.error.message}
                </p>
                {this.state.error.stack && <p className="text-[10px] font-mono text-slate-500 mt-2 whitespace-pre-wrap">
                    {this.state.error.stack.slice(0, 350)}...
                  </p>}
              </div>}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
        onClick={this.handleReload}
        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
      >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>

              <button
        onClick={this.handleReset}
        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all border border-slate-700 flex items-center justify-center space-x-2 cursor-pointer"
      >
                <Home className="w-4 h-4 text-indigo-400" />
                <span>Reset & Restore</span>
              </button>
            </div>
          </div>
        </div>;
    }
    return this.props.children;
  }
}
export {
  ErrorBoundary
};
