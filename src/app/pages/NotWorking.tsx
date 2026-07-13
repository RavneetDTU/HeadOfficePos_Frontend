import { AlertTriangle, Wrench, RefreshCw } from "lucide-react";

export function NotWorking() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                <AlertTriangle size={48} className="text-white" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
                <Wrench size={20} className="text-white" />
              </div>
            </div>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">Temporarily Unavailable</h1>

          <p className="text-xl text-gray-600 mb-8">
            This feature is currently experiencing technical issues
          </p>

          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 mb-8 border border-orange-200">
            <div className="flex items-center justify-center gap-3 mb-3">
              <RefreshCw size={24} className="text-orange-600" />
              <h2 className="text-lg font-semibold text-gray-900">We're Working On It</h2>
            </div>
            <p className="text-gray-600">
              Our technical team has been notified and is actively working to resolve this issue. Please check back soon.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">What You Can Do</h3>
            <ul className="text-sm text-gray-700 space-y-2 text-left max-w-md mx-auto">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Try refreshing the page</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Check back in a few minutes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Contact support if the issue persists</span>
              </li>
            </ul>
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Refresh Page
            </button>
            <button
              onClick={() => window.history.back()}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Go Back
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-8">
            We apologize for any inconvenience. Thank you for your patience.
          </p>
        </div>
      </div>
    </div>
  );
}
