import { useState, useEffect } from 'react';
import { Users, CheckSquare, TrendingUp, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from 'antd';

import { useAuth } from '../hooks/useAuth';
import StatCard from '../components/common/StatCard';
import DonutChart from '../components/common/DonutChart';
import api from '../utils/api';
import { showToast } from '../utils/helpers';

function DashboardSkeleton({
    canViewUsers,
    canCreateTasks,
    canViewAllTasks,
    canViewDeptTasks,
    canApproveTasks
}) {
    const statCardCount = canViewUsers ? 4 : 3;

    const quickActionCount =
        (canCreateTasks ? 1 : 0) +
        (canViewAllTasks || canViewDeptTasks ? 1 : 0) +
        1 + // My Tasks (always)
        (canApproveTasks ? 1 : 0);

    return (
        <div className="p-0 md:p-0 space-y-6">
            {/* Header skeleton */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="w-full md:w-auto">
                    <Skeleton active title={{ width: 220 }} paragraph={{ rows: 1, width: 320 }} />
                </div>
                <div className="w-full md:w-[260px]">
                    <div className="bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                        <Skeleton active title={false} paragraph={{ rows: 1, width: '100%' }} />
                    </div>
                </div>
            </div>

            {/* Stat cards skeleton */}
            <div
                className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${statCardCount === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
                    }`}
            >
                {Array.from({ length: statCardCount }).map((_, idx) => (
                    <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <Skeleton active title={{ width: 140 }} paragraph={{ rows: 2, width: ['60%', '40%'] }} />
                            </div>
                            <Skeleton.Avatar active size={48} shape="square" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-card p-6 shadow-card">
                    <Skeleton active title={{ width: 220 }} paragraph={{ rows: 1, width: 180 }} />
                    <div className="mt-4">
                        <div className="flex items-center justify-center py-6">
                            <Skeleton.Avatar active size={220} shape="circle" />
                        </div>
                        <div className="mt-4 space-y-3">
                            <Skeleton active title={false} paragraph={{ rows: 4, width: ['90%', '80%', '85%', '75%'] }} />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-card p-6 shadow-card">
                    <Skeleton active title={{ width: 140 }} paragraph={{ rows: 1, width: 220 }} />
                    <div className="mt-4 space-y-4">
                        {Array.from({ length: 3 }).map((_, idx) => (
                            <div key={idx} className="p-4 rounded-lg border border-gray-100 bg-gray-50/40">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <Skeleton active title={{ width: 140 }} paragraph={{ rows: 1, width: 80 }} />
                                    </div>
                                    <Skeleton.Avatar active size={48} shape="square" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick actions skeleton */}
            <div className="bg-white rounded-card p-6 shadow-card">
                <Skeleton active title={{ width: 140 }} paragraph={false} />
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Array.from({ length: Math.min(quickActionCount, 3) }).map((_, idx) => (
                        <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <Skeleton.Avatar active size={48} shape="square" />
                            <div className="mt-4">
                                <Skeleton active title={{ width: 160 }} paragraph={{ rows: 1, width: 220 }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function Dashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState({
        users: 0,
        tasks: {
            total: 0,
            pending: 0,
            inProgress: 0,
            completed: 0,
        },
        myTasks: {
            total: 0,
            pending: 0,
            overdue: 0,
        }
    });

    // Permission checks
    const canViewUsers = user?.permissions?.viewUsers || false;
    const canViewAllTasks = user?.permissions?.viewAllTasks || false;
    const canViewDeptTasks = user?.permissions?.viewDepartmentTasks || false;
    const canCreateTasks = user?.permissions?.createTasks || false;
    const canApproveTasks = user?.permissions?.approveTasks || false;

    // Determine task scope for display
    const taskScope = canViewAllTasks ? 'all' : canViewDeptTasks ? 'department' : 'my';
    const taskScopeLabel = canViewAllTasks ? 'Total Tasks' : canViewDeptTasks ? 'Department Tasks' : 'My Tasks';

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            const requests = [];

            // Fetch users only if user has permission
            if (canViewUsers) {
                requests.push(api.get('/users/for-tasks'));
            } else {
                requests.push(Promise.resolve({ data: { count: 0 } }));
            }

            // Fetch all tasks using the single endpoint that handles permissions
            requests.push(api.get('/tasks/all'));

            const [usersRes, tasksRes] = await Promise.all(requests);

            const allTasks = tasksRes.data.tasks || [];

            // Remove duplicates just in case
            const uniqueTasks = Array.from(
                new Map(allTasks.map(task => [task._id, task])).values()
            );

            // Filter "My Tasks" (Assigned TO me by others)
            const myTasks = uniqueTasks.filter(task =>
                task.assignedTo?.email === user?.email &&
                task.createdBy?.email !== user?.email
            );

            const now = new Date();

            setDashboardData({
                users: usersRes.data.count || 0,
                tasks: {
                    total: uniqueTasks.length,
                    pending: uniqueTasks.filter(t => t.status === 'Pending').length,
                    inProgress: uniqueTasks.filter(t => t.status === 'In Progress').length,
                    completed: uniqueTasks.filter(t => t.status === 'Completed').length,
                },
                myTasks: {
                    total: myTasks.length,
                    pending: myTasks.filter(t => t.status === 'Pending').length,
                    overdue: myTasks.filter(t =>
                        t.status !== 'Completed' && new Date(t.dueDate) < now
                    ).length,
                }
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            showToast('Failed to load dashboard data', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Task distribution data for donut chart
    const taskDistributionData = [
        { name: 'Completed', value: dashboardData.tasks.completed },
        { name: 'In Progress', value: dashboardData.tasks.inProgress },
        { name: 'Pending', value: dashboardData.tasks.pending },
    ].filter(item => item.value > 0);

    if (loading) {
        return (
            <DashboardSkeleton
                canViewUsers={canViewUsers}
                canCreateTasks={canCreateTasks}
                canViewAllTasks={canViewAllTasks}
                canViewDeptTasks={canViewDeptTasks}
                canApproveTasks={canApproveTasks}
            />
        );
    }

    return (
        <div className="p-0 md:p-0 space-y-6">
            {/* Header */}
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl md-text-3xl font-extrabold text-[#253094]">Dashboard Overview</h1>
                    <p className="text-gray-500 mt-1 font-medium">Welcome back! Here's what's happening today.</p>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                    <div className="text-sm font-semibold text-gray-700">
                        {new Date().toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                        })}
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Team Members - Only show if user has viewUsers permission */}
                {canViewUsers && (
                    <StatCard
                        title="Team Members"
                        value={dashboardData.users.toString()}
                        subtitle="Total active users"
                        icon={Users}
                        iconBg="bg-primary-50"
                        iconColor="text-primary-600"
                    />
                )}

                {/* Total/Department/My Tasks - Based on permissions */}
                <StatCard
                    title={taskScopeLabel}
                    value={dashboardData.tasks.total.toString()}
                    subtitle={`${dashboardData.tasks.completed} completed`}
                    icon={CheckSquare}
                    iconBg="bg-[#2d9e3614]"
                    iconColor="text-[#2D9E36]"
                />

                <StatCard
                    title="Tasks Assigned For Me"
                    value={dashboardData.myTasks.total.toString()}
                    subtitle={`${dashboardData.myTasks.pending} pending`}
                    icon={TrendingUp}
                    iconBg="bg-primary-50"
                    iconColor="text-primary-500"
                />

                <StatCard
                    title="Overdue Tasks"
                    value={dashboardData.myTasks.overdue.toString()}
                    subtitle="Require attention"
                    icon={Clock}
                    iconBg="bg-red-50"
                    iconColor="text-red-500"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Task Distribution */}
                <div className="bg-white rounded-card p-6 shadow-card">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-900">
                            {taskScope === 'all' ? 'All Task Distribution' :
                                taskScope === 'department' ? 'Department Task Distribution' :
                                    'My Task Distribution'}
                        </h2>
                    </div>

                    {taskDistributionData.length > 0 ? (
                        <>
                            <DonutChart
                                data={taskDistributionData}
                                centerValue={dashboardData.tasks.total.toString()}
                                centerLabel={taskScopeLabel}
                            />

                            {/* Status Breakdown */}
                            <div className="mt-6 space-y-3">
                                <h3 className="text-sm font-medium text-gray-700 mb-3">Status Breakdown</h3>
                                {taskDistributionData.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{
                                                    backgroundColor:
                                                        item.name === 'Completed' ? '#2D9E36' :
                                                            item.name === 'In Progress' ? '#253094' : '#F59E0B'
                                                }}
                                            ></div>
                                            <span className="text-sm text-gray-600">{item.name}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full"
                                                    style={{
                                                        width: `${(item.value / dashboardData.tasks.total) * 100}%`,
                                                        backgroundColor:
                                                            item.name === 'Completed' ? '#2D9E36' :
                                                                item.name === 'In Progress' ? '#253094' : '#F59E0B'
                                                    }}
                                                ></div>
                                            </div>
                                            <span className="text-sm font-medium text-gray-900 w-6 text-right">{item.value}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <CheckSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No tasks yet</p>
                            <p className="text-sm text-gray-400 mt-1">
                                {canCreateTasks ? 'Create your first task to see analytics' : 'No tasks assigned to you'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Task Summary */}
                <div className="bg-white rounded-card p-6 shadow-card">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-900">Task Summary</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm text-green-700 font-medium">Completed Tasks</div>
                                    <div className="text-2xl font-bold text-green-900 mt-1">
                                        {dashboardData.tasks.completed}
                                    </div>
                                </div>
                                <div className="w-12 h-12 bg-[#2D9E36] rounded-xl shadow-lg shadow-success-500/30 flex items-center justify-center transform transition-transform hover:scale-110">
                                    <CheckSquare className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm text-blue-700 font-medium">In Progress</div>
                                    <div className="text-2xl font-bold text-blue-900 mt-1">
                                        {dashboardData.tasks.inProgress}
                                    </div>
                                </div>
                                <div className="w-12 h-12 bg-primary-500 rounded-xl shadow-lg shadow-primary-500/30 flex items-center justify-center transform transition-transform hover:scale-110">
                                    <TrendingUp className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm text-yellow-700 font-medium">Pending Tasks</div>
                                    <div className="text-2xl font-bold text-yellow-900 mt-1">
                                        {dashboardData.tasks.pending}
                                    </div>
                                </div>
                                <div className="w-12 h-12 bg-yellow-500 rounded-xl shadow-lg shadow-yellow-500/30 flex items-center justify-center transform transition-transform hover:scale-110">
                                    <Clock className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </div>

                        {dashboardData.myTasks.overdue > 0 && (
                            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm text-red-700 font-medium">Overdue Tasks</div>
                                        <div className="text-2xl font-bold text-red-900 mt-1">
                                            {dashboardData.myTasks.overdue}
                                        </div>
                                    </div>
                                    <div className="w-12 h-12 bg-red-500 rounded-xl shadow-lg shadow-red-500/30 flex items-center justify-center transform transition-transform hover:scale-110">
                                        <Clock className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions - Permission-based */}
            <div className="bg-white rounded-card p-6 shadow-card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Create New Task - Only if user has createTasks permission */}
                    {canCreateTasks && (
                        <div
                            onClick={() => navigate('/create-task')}
                            className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-primary-100 transition-all duration-300 cursor-pointer overflow-hidden relative hover:-translate-y-1"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary-50 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                                    📝
                                </div>
                                <h3 className="font-bold text-lg text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">Create New Task</h3>
                                <p className="text-sm text-gray-500">Assign new tasks to your team members</p>
                            </div>
                        </div>
                    )}

                    {/* View All Tasks - Only if user can view all or department tasks */}
                    {(canViewAllTasks || canViewDeptTasks) && (
                        <div
                            onClick={() => navigate('/all-tasks')}
                            className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-primary-100 transition-all duration-300 cursor-pointer overflow-hidden relative hover:-translate-y-1"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary-50 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                                    📋
                                </div>
                                <h3 className="font-bold text-lg text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
                                    {canViewAllTasks ? 'View All Tasks' : 'View Department Tasks'}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {canViewAllTasks ? 'Monitor status of all tasks' : 'See your department tasks'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* My Tasks - Always show */}
                    <div
                        onClick={() => navigate('/my-tasks')}
                        className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-primary-100 transition-all duration-300 cursor-pointer overflow-hidden relative hover:-translate-y-1"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary-50 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                                👤
                            </div>
                            <h3 className="font-bold text-lg text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">My Tasks</h3>
                            <p className="text-sm text-gray-500">View and manage tasks assigned to you</p>
                        </div>
                    </div>

                    {/* Pending Approvals - Only if user has approveTasks permission */}
                    {canApproveTasks && (
                        <div
                            onClick={() => navigate('/approvals')}
                            className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-primary-100 transition-all duration-300 cursor-pointer overflow-hidden relative hover:-translate-y-1"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-success-50 rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-success-50 text-success-600 rounded-xl flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                                    ✅
                                </div>
                                <h3 className="font-bold text-lg text-gray-900 mb-1 group-hover:text-success-600 transition-colors">Pending Approvals</h3>
                                <p className="text-sm text-gray-500">Review and approve completed tasks</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
