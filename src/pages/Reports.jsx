import { useState, useEffect } from 'react';
import {
    Download, Calendar, Users, FileText,
    BarChart3, PieChart, LayoutGrid, CheckCircle2,
    Clock, AlertCircle, Briefcase, ArrowDownToLine
} from 'lucide-react';
import { DatePicker, Button, Table, Card } from 'antd';
import { PieChart as RechartsPie, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import dayjs from 'dayjs';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';
import { showToast, formatDate } from '../utils/helpers';
import StatCard from '../components/common/StatCard';

const { RangePicker } = DatePicker;

export default function Reports() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState([
        dayjs().subtract(30, 'day'),
        dayjs()
    ]);
    const [reportData, setReportData] = useState({
        tasks: [],
        users: [],
        statistics: {
            totalTasks: 0,
            completedTasks: 0,
            pendingTasks: 0,
            inProgressTasks: 0,
            overdueTasks: 0,
        }
    });

    useEffect(() => {
        fetchReportData();
    }, [dateRange]);

    const fetchReportData = async () => {
        try {
            setLoading(true);

            const [tasksRes, usersRes] = await Promise.all([
                api.get('/tasks/assigned'),
                api.get('/users/for-tasks'),
            ]);

            const tasks = tasksRes.data.tasks || [];
            const users = usersRes.data.users || [];

            // Filter tasks by date range
            const filteredTasks = tasks.filter(task => {
                const taskDate = new Date(task.createdAt);
                const start = dateRange[0].startOf('day').toDate();
                const end = dateRange[1].endOf('day').toDate();
                return taskDate >= start && taskDate <= end;
            });

            const now = new Date();
            const statistics = {
                totalTasks: filteredTasks.length,
                completedTasks: filteredTasks.filter(t => t.status === 'Completed').length,
                pendingTasks: filteredTasks.filter(t => t.status === 'Pending').length,
                inProgressTasks: filteredTasks.filter(t => t.status === 'In Progress').length,
                overdueTasks: filteredTasks.filter(t =>
                    t.status !== 'Completed' && new Date(t.dueDate) < now
                ).length,
            };

            setReportData({
                tasks: filteredTasks,
                users,
                statistics,
            });
        } catch (error) {
            console.error('Error fetching report data:', error);
            showToast('Failed to load report data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const downloadCSV = (data, filename) => {
        const csv = convertToCSV(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('CSV downloaded successfully!', 'success');
    };

    const convertToCSV = (data) => {
        if (data.length === 0) return '';

        const headers = Object.keys(data[0]);
        const csvRows = [];

        csvRows.push(headers.join(','));

        for (const row of data) {
            const values = headers.map(header => {
                const value = row[header];
                const escaped = ('' + value).replace(/"/g, '""');
                return `"${escaped}"`;
            });
            csvRows.push(values.join(','));
        }

        return csvRows.join('\n');
    };

    const calculatePendingDuration = (createdAt, status) => {
        if (status === 'Completed') return 'Completed';

        const created = new Date(createdAt);
        const now = new Date();
        const diffMs = now - created;

        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) {
            return `${days} day${days > 1 ? 's' : ''} ${hours} hour${hours !== 1 ? 's' : ''}`;
        }
        return `${hours} hour${hours !== 1 ? 's' : ''}`;
    };

    const formatDateTime = (date) => {
        if (!date) return 'N/A';
        const d = new Date(date);
        return d.toLocaleString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const downloadTasksReport = () => {
        const tasksData = reportData.tasks.map(task => ({
            'S. No': task.sno,
            'Date Raised': formatDateTime(task.createdAt),
            'Raised By (Name)': task.createdBy?.name || task.createdByEmail || 'N/A',
            'Raised By Department': task.createdBy?.department?.name || 'N/A',
            'Raised By Email': task.createdByEmail || 'N/A',
            'Raised By WhatsApp': task.createdBy?.whatsapp || 'N/A',
            'Task Title / Description': task.task,
            'Assigned To (Name)': task.assignedToName || 'N/A',
            'Assigned To Department': task.assignedTo?.department?.name || task.department?.name || 'N/A',
            'Assigned To Email': task.assignedToEmail || 'N/A',
            'Assigned To WhatsApp': task.assignedTo?.whatsapp || 'N/A',
            'Priority': task.priority,
            'Target Completion Date and Time': formatDateTime(task.dueDate),
            'Status': task.status,
            'Pending Duration': calculatePendingDuration(task.createdAt, task.status),
            'Approval Status': task.approvalStatus || 'N/A',
            'Approval by': task.approvedBy?.name || task.approvedByEmail || 'N/A',
            'Notes / Comments': task.notes || 'N/A',
        }));

        downloadCSV(tasksData, `tasks-report-${dateRange[0].format('YYYY-MM-DD')}-to-${dateRange[1].format('YYYY-MM-DD')}.csv`);
    };

    const downloadUsersReport = () => {
        const usersData = reportData.users.map(u => ({
            'Name': u.name,
            'Email': u.email,
            'WhatsApp': u.whatsapp,
            'Role': u.role?.displayName || u.role,
            'Designation': u.designation || 'N/A',
            'Department': u.department?.name || 'N/A',
            'Created At': formatDate(u.createdAt),
        }));

        downloadCSV(usersData, `users-report-${dayjs().format('YYYY-MM-DD')}.csv`);
    };

    // Prepare chart data for statistics
    const statisticsChartData = [
        { name: 'Completed', value: reportData.statistics.completedTasks, color: '#10b981' },
        { name: 'In Progress', value: reportData.statistics.inProgressTasks, color: '#3b82f6' },
        { name: 'Pending', value: reportData.statistics.pendingTasks, color: '#f59e0b' },
        { name: 'Overdue', value: reportData.statistics.overdueTasks, color: '#ef4444' },
    ].filter(item => item.value > 0);

    // User performance data
    const userPerformance = reportData.users.map(u => {
        const userTasks = reportData.tasks.filter(t => t.assignedToEmail === u.email);
        const completed = userTasks.filter(t => t.status === 'Completed').length;
        const total = userTasks.length;

        return {
            key: u._id,
            name: u.name,
            email: u.email,
            role: u.role?.displayName || u.role,
            totalTasks: total,
            completedTasks: completed,
            completionRate: total > 0 ? Number(((completed / total) * 100).toFixed(1)) : 0,
        };
    }).filter(u => u.totalTasks > 0).sort((a, b) => b.completionRate - a.completionRate);

    // Top 10 performers for chart
    const topPerformers = userPerformance.slice(0, 10);



    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading reports...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header & Filter */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-[#253094]">Reports & Analytics</h1>
                    <p className="text-gray-500 mt-1">Get insights into task distribution and team performance</p>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
                    <div className="pl-3 pr-2 border-r border-gray-200">
                        <Calendar className="w-5 h-5 text-gray-500" />
                    </div>
                    <RangePicker
                        value={dateRange}
                        onChange={setDateRange}
                        allowClear={false}
                        bordered={false}
                        className="w-64"
                    />
                </div>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard
                    title="Total Tasks"
                    value={reportData.statistics.totalTasks}
                    icon={LayoutGrid}
                    iconBg="bg-blue-50"
                    iconColor="text-blue-500"
                />
                <StatCard
                    title="Completed"
                    value={reportData.statistics.completedTasks}
                    icon={CheckCircle2}
                    iconBg="bg-green-50"
                    iconColor="text-green-500"
                />
                <StatCard
                    title="In Progress"
                    value={reportData.statistics.inProgressTasks}
                    icon={Briefcase}
                    iconBg="bg-indigo-50"
                    iconColor="text-indigo-500"
                />
                <StatCard
                    title="Pending"
                    value={reportData.statistics.pendingTasks}
                    icon={Clock}
                    iconBg="bg-orange-50"
                    iconColor="text-orange-500"
                />
                <StatCard
                    title="Overdue"
                    value={reportData.statistics.overdueTasks}
                    icon={AlertCircle}
                    iconBg="bg-red-50"
                    iconColor="text-red-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Download Center - spans 1 col */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-primary-50 rounded-lg">
                            <ArrowDownToLine className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">Export Report Data</h2>
                    </div>

                    <div className="space-y-4">
                        <button style={{ marginBottom: '1rem' }}
                            onClick={downloadTasksReport}
                            className="w-full group flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:border-primary-200 hover:bg-primary-50/30 transition-all duration-200 text-left cursor-pointer"
                        >
                            <div className="p-2.5 bg-white rounded-lg shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                                <FileText className="w-6 h-6 text-blue-500" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 group-hover:text-primary-600">Tasks Report</h3>
                                <p className="text-sm text-gray-500 mt-0.5">{reportData.tasks.length} records available</p>
                            </div>
                        </button>

                        <button
                            onClick={downloadUsersReport}
                            className="w-full group flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:border-primary-200 hover:bg-primary-50/30 transition-all duration-200 text-left cursor-pointer"
                        >
                            <div className="p-2.5 bg-white rounded-lg shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                                <Users className="w-6 h-6 text-purple-500" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 group-hover:text-primary-600">Users Report</h3>
                                <p className="text-sm text-gray-500 mt-0.5">{reportData.users.length} records available</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Charts - spans 2 cols */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-50 rounded-lg">
                                <PieChart className="w-5 h-5 text-purple-600" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">Task Distribution</h2>
                        </div>
                    </div>

                    {statisticsChartData.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsPie>
                                        <Pie
                                            data={statisticsChartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {statisticsChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#fff',
                                                borderRadius: '12px',
                                                border: 'none',
                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                            }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </RechartsPie>
                                </ResponsiveContainer>
                            </div>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={statisticsChartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#6B7280', fontSize: 12 }}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#6B7280', fontSize: 12 }}
                                        />
                                        <Tooltip
                                            cursor={{ fill: '#F3F4F6' }}
                                            contentStyle={{
                                                backgroundColor: '#fff',
                                                borderRadius: '12px',
                                                border: 'none',
                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                            }}
                                        />
                                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                            {statisticsChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center text-gray-400">
                            No data available for charts
                        </div>
                    )}
                </div>
            </div>

            {/* Performance Section */}
            {userPerformance.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-green-50 rounded-lg">
                            <BarChart3 className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Team Performance Analysis</h2>
                            <p className="text-sm text-gray-500">Top performers based on task completion</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Top 5 Chart */}
                        <div className="lg:col-span-1 h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topPerformers.slice(0, 5)} layout="vertical" margin={{ left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        width={120}
                                        tick={{ fill: '#4B5563', fontSize: 12, fontWeight: 500 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#F3F4F6' }}
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            borderRadius: '12px',
                                            border: 'none',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                        }}
                                    />
                                    <Bar
                                        dataKey="completionRate"
                                        fill="#10b981"
                                        radius={[0, 4, 4, 0]}
                                        barSize={24}
                                        background={{ fill: '#F3F4F6', radius: [0, 4, 4, 0] }}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Detailed Table */}
                        <div className="lg:col-span-2">
                            <Table
                                columns={[
                                    {
                                        title: 'Employee',
                                        dataIndex: 'name',
                                        key: 'name',
                                        render: (text, record) => (
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-xs uppercase">
                                                    {text.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900">{text}</div>
                                                    <div className="text-xs text-gray-500">{record.role || 'N/A'}</div>
                                                </div>
                                            </div>
                                        )
                                    },
                                    {
                                        title: 'Performance',
                                        dataIndex: 'completionRate',
                                        key: 'completionRate',
                                        render: (rate) => (
                                            <div className="w-full max-w-[140px]">
                                                <div className="flex justify-between mb-1.5">
                                                    <span className="text-xs font-medium text-gray-700">Completion</span>
                                                    <span className={`text-xs font-bold ${rate >= 80 ? 'text-green-600' : rate >= 50 ? 'text-blue-600' : 'text-orange-600'}`}>{rate}%</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${rate >= 80 ? 'bg-green-500' : rate >= 50 ? 'bg-blue-500' : 'bg-orange-500'}`}
                                                        style={{ width: `${rate}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    },
                                    {
                                        title: 'Tasks',
                                        key: 'tasks',
                                        render: (_, record) => (
                                            <div className="flex items-center gap-4 text-xs">
                                                <div className="text-center">
                                                    <div className="font-bold text-gray-900">{record.totalTasks}</div>
                                                    <div className="text-gray-400">Total</div>
                                                </div>
                                                <div className="w-px h-6 bg-gray-100" />
                                                <div className="text-center">
                                                    <div className="font-bold text-green-600">{record.completedTasks}</div>
                                                    <div className="text-gray-400">Done</div>
                                                </div>
                                            </div>
                                        )
                                    }
                                ]}
                                dataSource={userPerformance}
                                pagination={{ pageSize: 5, size: 'small' }}
                                rowKey="key"
                                size="middle"
                                className="custom-table"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
