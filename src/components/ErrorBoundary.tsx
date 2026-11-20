import React from 'react';

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'Unknown error',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ApnaBazaar ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAFBF8] p-6">
          <div className="max-w-md w-full bg-white rounded-3xl border border-stone-200 p-6 text-center shadow-sm">
            <h2 className="text-xl font-bold text-stone-900">
              कुछ गड़बड़ हो गई / Something went wrong
            </h2>
            <p className="mt-2 text-sm text-stone-600">
              कृपया ऐप को दोबारा लोड करें। आपका सेव किया गया डेटा सुरक्षित है।
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 w-full min-h-[48px] rounded-2xl bg-emerald-700 text-white font-semibold text-base hover:bg-emerald-800 transition-colors"
            >
              ऐप दोबारा खोलें / Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
