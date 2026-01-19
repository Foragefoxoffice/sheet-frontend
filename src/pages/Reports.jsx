import { useState, useEffect } from 'react';
import { Download, Calendar, Users, CheckSquare, TrendingUp, FileText, BarChart3, PieChart } from 'lucide-react';
import { DatePicker, Button, Table, Card } from 'antd';
import { PieChart as RechartsPie, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import dayjs from 'dayjs';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';
import { showToast, formatDate } from '../utils/helpers';

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

    const performanceColumns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <div>
                    <div className="font-medium text-gray-900">{text}</div>
                    <div className="text-sm text-gray-500">{record.email}</div>
                </div>
            )
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
        },
        {
            title: 'Total Tasks',
            dataIndex: 'totalTasks',
            key: 'totalTasks',
            align: 'center',
            sorter: (a, b) => a.totalTasks - b.totalTasks,
        },
        {
            title: 'Completed',
            dataIndex: 'completedTasks',
            key: 'completedTasks',
            align: 'center',
            sorter: (a, b) => a.completedTasks - b.completedTasks,
            render: (text) => <span className="text-green-600 font-medium">{text}</span>
        },
        {
            title: 'Completion Rate',
            dataIndex: 'completionRate',
            key: 'completionRate',
            align: 'center',
            sorter: (a, b) => a.completionRate - b.completionRate,
            render: (rate) => (
                <div className="flex items-center justify-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${rate}%` }}
                        ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{rate}%</span>
                </div>
            )
        }
    ];

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
        <div className="p-0 md:p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
                    <p className="text-gray-600 mt-1">View insights and download comprehensive reports</p>
                </div>
            </div>

            {/* Date Range Filter */}
            <div className="bg-white rounded-card shadow-card p-6">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Date Range:</span>
                    </div>
                    <RangePicker
                        value={dateRange}
                        onChange={setDateRange}
                        size="large"
                        allowClear={false}
                    />
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card className="shadow-card border-none">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-gray-600">Total Tasks</div>
                            <div className="text-2xl font-bold text-gray-900 mt-1">
                                {reportData.statistics.totalTasks}
                            </div>
                        </div>
                        <CheckSquare className="w-10 h-10 text-blue-500" />
                    </div>
                </Card>

                <Card className="shadow-card border-none">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-gray-600">Completed</div>
                            <div className="text-2xl font-bold text-green-600 mt-1">
                                {reportData.statistics.completedTasks}
                            </div>
                        </div>
                        <CheckSquare className="w-10 h-10 text-green-500" />
                    </div>
                </Card>

                <Card className="shadow-card border-none">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-gray-600">In Progress</div>
                            <div className="text-2xl font-bold text-blue-600 mt-1">
                                {reportData.statistics.inProgressTasks}
                            </div>
                        </div>
                        <TrendingUp className="w-10 h-10 text-blue-500" />
                    </div>
                </Card>

                <Card className="shadow-card border-none">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-gray-600">Pending</div>
                            <div className="text-2xl font-bold text-yellow-600 mt-1">
                                {reportData.statistics.pendingTasks}
                            </div>
                        </div>
                        <FileText className="w-10 h-10 text-yellow-500" />
                    </div>
                </Card>

                <Card className="shadow-card border-none">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-gray-600">Overdue</div>
                            <div className="text-2xl font-bold text-red-600 mt-1">
                                {reportData.statistics.overdueTasks}
                            </div>
                        </div>
                        <FileText className="w-10 h-10 text-red-500" />
                    </div>
                </Card>
            </div>

            {/* Download Reports Section */}
            <div className="bg-white rounded-card shadow-card p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Download Reports</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                        onClick={downloadTasksReport}
                        style={{ height: '60px' }}
                        className="h-auto py-4 flex items-center justify-start gap-3"
                        block
                    >
                        <Download className="w-5 h-5 text-primary" />
                        <div className="text-left">
                            <div className="font-medium text-gray-900">Tasks Report</div>
                            <div className="text-sm text-gray-500">{reportData.tasks.length} tasks</div>
                        </div>
                    </Button>

                    <Button
                        onClick={downloadUsersReport}
                        style={{ height: '60px' }}
                        className="h-auto py-4 flex items-center justify-start gap-3"
                        block
                    >
                        <Download className="w-5 h-5 text-primary" />
                        <div className="text-left">
                            <div className="font-medium text-gray-900">Users Report</div>
                            <div className="text-sm text-gray-500">{reportData.users.length} users</div>
                        </div>
                    </Button>
                </div>
            </div>

            {/* Statistics Chart */}
            {statisticsChartData.length > 0 && (
                <div className="bg-white rounded-card shadow-card p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <PieChart className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold text-gray-900">Task Distribution</h2>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Pie Chart */}
                        <div>
                            <ResponsiveContainer width="100%" height={300}>
                                <RechartsPie>
                                    <Pie
                                        data={statisticsChartData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {statisticsChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </RechartsPie>
                            </ResponsiveContainer>
                        </div>

                        {/* Bar Chart */}
                        <div>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={statisticsChartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#3b82f6">
                                        {statisticsChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* Performance Chart & Table */}
            {userPerformance.length > 0 && (
                <div className="bg-white rounded-card shadow-card p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold text-gray-900">User Performance</h2>
                    </div>

                    {/* Performance Bar Chart */}
                    {topPerformers.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-gray-700 mb-4">Top Performers by Completion Rate</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={topPerformers} layout="horizontal">
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" domain={[0, 100]} />
                                    <YAxis dataKey="name" type="category" width={150} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="completionRate" fill="#10b981" name="Completion Rate (%)" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Performance Table */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-4">Detailed Performance Metrics</h3>
                        <Table
                            columns={performanceColumns}
                            dataSource={userPerformance}
                            pagination={{ pageSize: 10 }}
                            rowKey="key"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
