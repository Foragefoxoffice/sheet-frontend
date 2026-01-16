import { useState, useEffect } from 'react';
import { Download, Calendar, Users, CheckSquare, TrendingUp, FileText } from 'lucide-react';
import { DatePicker, Button, Table, Card } from 'antd';
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
                api.get('/users/for-tasks'), // Use for-tasks endpoint
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

        downloadCSV(tasksData, `tasks-report-${dateRange[0].format('YYYY-MM-DD')}-to-${dateRange[1].format('YYYY-MM-DD')}.csv`);
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

        downloadCSV(usersData, `users-report-${dayjs().format('YYYY-MM-DD')}.csv`);
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
            'Date Range': `${dateRange[0].format('YYYY-MM-DD')} to ${dateRange[1].format('YYYY-MM-DD')}`,
        }];

        downloadCSV(statsData, `statistics-report-${dayjs().format('YYYY-MM-DD')}.csv`);
    };

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
    }).filter(u => u.totalTasks > 0).sort((a, b) => b.completedTasks - a.completedTasks);

    const downloadUserPerformance = () => {
        const performanceData = userPerformance.map(u => ({
            'Name': u.name,
            'Email': u.email,
            'Role': u.role,
            'Total Tasks': u.totalTasks,
            'Completed Tasks': u.completedTasks,
            'Completion Rate': `${u.completionRate}%`,
        }));

        downloadCSV(performanceData, `user-performance-${dateRange[0].format('YYYY-MM-DD')}-to-${dateRange[1].format('YYYY-MM-DD')}.csv`);
    };

    const columns = [
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Button
                        onClick={downloadTasksReport}
                        style={{height: '50px'}}
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
                        style={{height: '50px'}}
                        className="h-auto py-4 flex items-center justify-start gap-3"
                        block
                    >
                        <Download className="w-5 h-5 text-primary" />
                        <div className="text-left">
                            <div className="font-medium text-gray-900">Users Report</div>
                            <div className="text-sm text-gray-500">{reportData.users.length} users</div>
                        </div>
                    </Button>

                    <Button
                        onClick={downloadStatisticsReport}
                         style={{height: '50px'}}
                        className="h-auto py-4 flex items-center justify-start gap-3"
                        block
                    >
                        <Download className="w-5 h-5 text-primary" />
                        <div className="text-left">
                            <div className="font-medium text-gray-900">Statistics</div>
                            <div className="text-sm text-gray-500">Summary data</div>
                        </div>
                    </Button>

                    <Button
                        onClick={downloadUserPerformance}
                         style={{height: '50px'}}
                        className="h-auto py-4 flex items-center justify-start gap-3"
                        block
                    >
                        <Download className="w-5 h-5 text-primary" />
                        <div className="text-left">
                            <div className="font-medium text-gray-900">Performance</div>
                            <div className="text-sm text-gray-500">User metrics</div>
                        </div>
                    </Button>
                </div>
            </div>

            {/* User Performance Table */}
            {userPerformance.length > 0 && (
                <div className="bg-white rounded-card shadow-card p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">User Performance</h2>
                    <Table
                        columns={columns}
                        dataSource={userPerformance}
                        pagination={false}
                        rowKey="key"
                    />
                </div>
            )}
        </div>
    );
}
