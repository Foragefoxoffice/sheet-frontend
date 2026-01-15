import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    iconBg = 'bg-primary-50',
    iconColor = 'text-primary-500',
    trend,
    trendValue
}) {
    return (
        <div className="bg-white rounded-card p-6 shadow-card hover:shadow-card-hover transition-shadow">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">{value}</h3>
                    {subtitle && (
                        <p className="text-sm text-gray-500">{subtitle}</p>
                    )}
                    {trend && (
                        <div className="flex items-center gap-1 mt-2">
                            {trend === 'up' ? (
                                <TrendingUp className="w-4 h-4 text-success" />
                            ) : (
                                <TrendingDown className="w-4 h-4 text-danger" />
                            )}
                            <span className={`text-sm font-medium ${trend === 'up' ? 'text-success' : 'text-danger'}`}>
                                {trendValue}
                            </span>
                            <span className="text-sm text-gray-500">from last week</span>
                        </div>
                    )}
                </div>
                {Icon && (
                    <div className={`${iconBg} ${iconColor} p-3 rounded-lg`}>
                        <Icon className="w-6 h-6" />
                    </div>
                )}
            </div>
        </div>
    );
}
