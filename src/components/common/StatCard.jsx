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
        <div className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-primary-100 transition-all duration-300 ease-in-out hover:-translate-y-1 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-gradient-to-br from-primary-50 to-transparent opacity-0 group-hover:opacity-100 rounded-full blur-2xl transition-opacity duration-500" />

            <div className="flex items-start justify-between relative z-10">
                <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-500 mb-1 uppercase">{title}</p>
                    <h3 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">{value}</h3>
                    {subtitle && (
                        <p className="text-sm text-gray-500 font-medium">{subtitle}</p>
                    )}
                    {trend && (
                        <div className="flex items-center gap-1 mt-3 bg-gray-50 w-fit px-2 py-1 rounded-lg">
                            {trend === 'up' ? (
                                <TrendingUp className="w-4 h-4 text-success" />
                            ) : (
                                <TrendingDown className="w-4 h-4 text-danger" />
                            )}
                            <span className={`text-sm font-bold ${trend === 'up' ? 'text-success' : 'text-danger'}`}>
                                {trendValue}
                            </span>
                            <span className="text-xs text-gray-400 font-medium">vs last week</span>
                        </div>
                    )}
                </div>
                {Icon && (
                    <div className={`${iconBg} ${iconColor} p-4 rounded-xl shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-7 h-7" />
                    </div>
                )}
            </div>
        </div>
    );
}
