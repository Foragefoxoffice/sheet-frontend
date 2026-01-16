import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

const COLORS = {
    Completed: '#10B981',
    'In Progress': '#1877F2',
    Planning: '#F59E0B',
    'On Hold': '#EF4444',
};

export default function DonutChart({ data, centerValue, centerLabel }) {
    return (
        <div className="relative">
            <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={2}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#9CA3AF'} />
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>

            {/* Center Text */}
            {centerValue && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                    <div className="text-3xl font-bold text-gray-900">{centerValue}</div>
                    {centerLabel && (
                        <div className="text-sm text-gray-500 mt-1">{centerLabel}</div>
                    )}
                </div>
            )}
        </div>
    );
}
