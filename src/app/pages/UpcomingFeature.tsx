import { Rocket, Clock, Sparkles } from "lucide-react";

export function UpcomingFeature() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <Rocket size={48} className="text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                <Sparkles size={16} className="text-white" />
              </div>
            </div>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">Coming Soon!</h1>

          <p className="text-xl text-gray-600 mb-8">
            This exciting feature is currently under development
          </p>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Clock size={24} className="text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Under Construction</h2>
            </div>
            <p className="text-gray-600">
              Our team is working hard to bring you this feature. It will be available in an upcoming release.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-blue-600 mb-1">🎯</div>
              <p className="text-sm text-gray-600">Enhanced Features</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-purple-600 mb-1">⚡</div>
              <p className="text-sm text-gray-600">Improved Performance</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-green-600 mb-1">✨</div>
              <p className="text-sm text-gray-600">Better Experience</p>
            </div>
          </div>

          <p className="text-sm text-gray-500">
            Thank you for your patience. Stay tuned for updates!
          </p>
        </div>
      </div>
    </div>
  );
}
