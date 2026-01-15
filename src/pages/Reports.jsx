import { useState, useEffect } from 'react';
import { Download, Calendar, Users, CheckSquare, TrendingUp, FileText } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';
import { showToast, formatDate } from '../utils/helpers';
import { ROLES } from '../utils/constants';

export default function Reports() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    });
    const [reportData, setReportData] = useState({
        tasks: [],
        users: [],
        statistics: {
            totalTasks: 0,
            completedTasks: 0,
            pendingTasks: 0,
            inProgressTasks: 0,
            overdueTask: 0,
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
                api.get('/users/for-tasks'), // Use for-tasks endpoint
            ]);

            const tasks = tasksRes.data.tasks || [];
            const users = usersRes.data.users || [];

            // Filter tasks by date range
            const filteredTasks = tasks.filter(task => {
                const taskDate = new Date(task.createdAt);
                const start = new Date(dateRange.startDate);
                const end = new Date(dateRange.endDate);
                end.setHours(23, 59, 59, 999);
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

        // Add headers
        csvRows.push(headers.join(','));

        // Add data rows
        for (const row of data) {
            const values = headers.map(header => {
                const value = row[header];
                // Escape commas and quotes
                const escaped = ('' + value).replace(/"/g, '""');
                return `"${escaped}"`;
            });
            csvRows.push(values.join(','));
        }

        return csvRows.join('\n');
    };

    const downloadTasksReport = () => {
        const tasksData = reportData.tasks.map(task => ({
            'Task ID': task.sno,
            'Task Description': task.task,
            'Assigned To': task.assignedToName,
            'Created By': task.createdByEmail,
            'Priority': task.priority,
            'Status': task.status,
            'Due Date': formatDate(task.dueDate),
            'Created At': formatDate(task.createdAt),
            'Notes': task.notes || 'N/A',
        }));

        downloadCSV(tasksData, `tasks-report-${dateRange.startDate}-to-${dateRange.endDate}.csv`);
    };

    const downloadUsersReport = () => {
        const usersData = reportData.users.map(u => ({
            'Name': u.name,
            'Email': u.email,
            'WhatsApp': u.whatsapp,
            'Role': u.role?.displayName || u.role,
            'Department': u.department?.name || 'N/A',
            'Created At': formatDate(u.createdAt),
        }));

        downloadCSV(usersData, `users-report-${new Date().toISOString().split('T')[0]}.csv`);
    };

    const downloadStatisticsReport = () => {
        const statsData = [{
            'Total Tasks': reportData.statistics.totalTasks,
            'Completed': reportData.statistics.completedTasks,
            'In Progress': reportData.statistics.inProgressTasks,
            'Pending': reportData.statistics.pendingTasks,
            'Overdue': reportData.statistics.overdueTasks,
            'Completion Rate': reportData.statistics.totalTasks > 0
                ? `${((reportData.statistics.completedTasks / reportData.statistics.totalTasks) * 100).toFixed(1)}%`
                : '0%',
            'Date Range': `${dateRange.startDate} to ${dateRange.endDate}`,
        }];

        downloadCSV(statsData, `statistics-report-${new Date().toISOString().split('T')[0]}.csv`);
    };

    // User performance data
    const userPerformance = reportData.users.map(u => {
        const userTasks = reportData.tasks.filter(t => t.assignedToEmail === u.email);
        const completed = userTasks.filter(t => t.status === 'Completed').length;
        const total = userTasks.length;

        return {
            name: u.name,
            email: u.email,
            role: u.role?.displayName || u.role,
            totalTasks: total,
            completedTasks: completed,
            completionRate: total > 0 ? ((completed / total) * 100).toFixed(1) : 0,
        };
    }).filter(u => u.totalTasks > 0).sort((a, b) => b.completedTasks - a.completedTasks);

    const downloadUserPerformance = () => {
        const performanceData = userPerformance.map(u => ({
            'Name': u.name,
            'Email': u.email,
            'Role': u.role?.displayName || u.role,
            'Total Tasks': u.totalTasks,
            'Completed Tasks': u.completedTasks,
            'Completion Rate': `${u.completionRate}%`,
        }));

        downloadCSV(performanceData, `user-performance-${dateRange.startDate}-to-${dateRange.endDate}.csv`);
    };

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
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
                    <p className="text-gray-600 mt-1">View and download comprehensive reports</p>
                </div>
            </div>

            {/* Date Range Filter */}
            <div className="bg-white rounded-card shadow-card p-6">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Date Range:</span>
                    </div>
                    <input
                        type="date"
                        value={dateRange.startDate}
                        onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                        className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                        type="date"
                        value={dateRange.endDate}
                        onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                        className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none"
                    />
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white rounded-card shadow-card p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-gray-600">Total Tasks</div>
                            <div className="text-2xl font-bold text-gray-900 mt-1">
                                {reportData.statistics.totalTasks}
                            </div>
                        </div>
                        <CheckSquare className="w-10 h-10 text-blue-500" />
                    </div>
                </div>

                <div className="bg-white rounded-card shadow-card p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-gray-600">Completed</div>
                            <div className="text-2xl font-bold text-green-600 mt-1">
                                {reportData.statistics.completedTasks}
                            </div>
                        </div>
                        <CheckSquare className="w-10 h-10 text-green-500" />
                    </div>
                </div>

                <div className="bg-white rounded-card shadow-card p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-gray-600">In Progress</div>
                            <div className="text-2xl font-bold text-blue-600 mt-1">
                                {reportData.statistics.inProgressTasks}
                            </div>
                        </div>
                        <TrendingUp className="w-10 h-10 text-blue-500" />
                    </div>
                </div>

                <div className="bg-white rounded-card shadow-card p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-gray-600">Pending</div>
                            <div className="text-2xl font-bold text-yellow-600 mt-1">
                                {reportData.statistics.pendingTasks}
                            </div>
                        </div>
                        <FileText className="w-10 h-10 text-yellow-500" />
                    </div>
                </div>

                <div className="bg-white rounded-card shadow-card p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-gray-600">Overdue</div>
                            <div className="text-2xl font-bold text-red-600 mt-1">
                                {reportData.statistics.overdueTasks}
                            </div>
                        </div>
                        <FileText className="w-10 h-10 text-red-500" />
                    </div>
                </div>
            </div>

            {/* Download Reports Section */}
            <div className="bg-white rounded-card shadow-card p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Download Reports</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button
                        onClick={downloadTasksReport}
                        className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-primary-50 transition-all flex items-center gap-3"
                    >
                        <Download className="w-5 h-5 text-primary" />
                        <div className="text-left">
                            <div className="font-medium text-gray-900">Tasks Report</div>
                            <div className="text-sm text-gray-500">{reportData.tasks.length} tasks</div>
                        </div>
                    </button>

                    <button
                        onClick={downloadUsersReport}
                        className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-primary-50 transition-all flex items-center gap-3"
                    >
                        <Download className="w-5 h-5 text-primary" />
                        <div className="text-left">
                            <div className="font-medium text-gray-900">Users Report</div>
                            <div className="text-sm text-gray-500">{reportData.users.length} users</div>
                        </div>
                    </button>

                    <button
                        onClick={downloadStatisticsReport}
                        className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-primary-50 transition-all flex items-center gap-3"
                    >
                        <Download className="w-5 h-5 text-primary" />
                        <div className="text-left">
                            <div className="font-medium text-gray-900">Statistics</div>
                            <div className="text-sm text-gray-500">Summary data</div>
                        </div>
                    </button>

                    <button
                        onClick={downloadUserPerformance}
                        className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-primary-50 transition-all flex items-center gap-3"
                    >
                        <Download className="w-5 h-5 text-primary" />
                        <div className="text-left">
                            <div className="font-medium text-gray-900">Performance</div>
                            <div className="text-sm text-gray-500">User metrics</div>
                        </div>
                    </button>
                </div>
            </div>

            {/* User Performance Table */}
            {userPerformance.length > 0 && (
                <div className="bg-white rounded-card shadow-card p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">User Performance</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Name</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Role</th>
                                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Total Tasks</th>
                                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Completed</th>
                                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Completion Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {userPerformance.map((u, index) => (
                                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4">
                                            <div className="font-medium text-gray-900">{u.name}</div>
                                            <div className="text-sm text-gray-500">{u.email}</div>
                                        </td>
                                        <td className="py-3 px-4 text-gray-700">{u.role}</td>
                                        <td className="py-3 px-4 text-center font-medium">{u.totalTasks}</td>
                                        <td className="py-3 px-4 text-center font-medium text-green-600">{u.completedTasks}</td>
                                        <td className="py-3 px-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-green-500 rounded-full"
                                                        style={{ width: `${u.completionRate}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm font-medium text-gray-900">{u.completionRate}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
