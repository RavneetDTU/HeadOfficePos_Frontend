import { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
}

export function KPICard({ title, value, trend, icon: Icon, iconColor = "text-blue-600", iconBg = "bg-blue-50" }: KPICardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 mb-2">{value}</p>
          {trend && (
            <div className="flex items-center gap-1">
              {trend.isPositive ? (
                <TrendingUp size={16} className="text-green-600" />
              ) : (
                <TrendingDown size={16} className="text-red-600" />
              )}
              <span className={`text-sm font-medium ${trend.isPositive ? "text-green-600" : "text-red-600"}`}>
                {trend.value}
              </span>
              <span className="text-xs text-gray-500">vs last month</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg ${iconBg} flex items-center justify-center`}>
          <Icon size={24} className={iconColor} />
        </div>
      </div>
    </div>
  );
}
