import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';
import {
    LayoutDashboard,
    Users,
    CheckSquare,
    UserPlus,
    ClipboardCheck,
    BarChart3,
    LogOut,
    Zap,
    Building2,
    Shield
} from 'lucide-react';

export default function Sidebar() {
    const { user, logout } = useAuth();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    const navItems = [
        {
            path: '/dashboard',
            icon: LayoutDashboard,
            label: 'Dashboard',
            permission: null, // Always visible
        },
        {
            path: '/users',
            icon: Users,
            label: 'Team Members',
            permission: 'viewUsers',
        },
        {
            path: '/departments',
            icon: Building2,
            label: 'Departments',
            permission: 'viewDepartments',
        },
        {
            path: '/create-task',
            icon: UserPlus,
            label: 'Create Task',
            permission: null, // All users can create tasks
        },
        {
            path: '/all-tasks',
            icon: CheckSquare,
            label: 'All Tasks',
            permission: null, // All users can view tasks
        },
        {
            path: '/tasks',
            icon: ClipboardCheck,
            label: 'Assigned to Me',
            permission: null, // All users can view their tasks
        },
        {
            path: '/assigned-tasks',
            icon: CheckSquare,
            label: 'I Assigned',
            permission: null, // All users can view tasks they assigned
        },
        {
            path: '/self-tasks',
            icon: Users,
            label: 'Self Tasks',
            permission: null, // All users can view their self tasks
        },
        {
            path: '/roles',
            icon: Shield,
            label: 'Roles',
            permission: 'viewRoles',
        },
        {
            path: '/approvals',
            icon: ClipboardCheck,
            label: 'Approvals',
            permission: null, // All users can view approvals for tasks they created
        },
        {
            path: '/reports',
            icon: BarChart3,
            label: 'Reports',
            permission: 'viewReports',
        },
    ];

    const filteredNavItems = navItems.filter((item) => {
        // If no permission required, show to everyone
        if (!item.permission) return true;

        // Check if user has the required permission
        return user?.permissions?.[item.permission] === true;
    });

    return (
        <aside className="w-20 bg-white border-r border-gray-200 flex flex-col fixed h-screen left-0 top-0 z-50">
            {/* Brand */}
            <div className="h-16 flex items-center justify-center border-b border-gray-200">
                <div className="w-10 h-14  bg-primary rounded-lg flex items-center justify-center">
                    <img src="/icon.png" alt="" />
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 space-y-2">
                {filteredNavItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex flex-col items-center justify-center py-3 mx-2 rounded-lg transition-all group relative ${isActive(item.path)
                                ? 'bg-primary-50 text-primary'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            title={item.label}
                        >
                            <Icon className="w-5 h-5" />

                            {/* Tooltip */}
                            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                {item.label}
                            </div>
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-gray-200">
                <div className="flex flex-col items-center space-y-3">
                    {/* User Avatar */}
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>

                    {/* Logout Button */}
                    <button
                        onClick={logout}
                        className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-danger hover:bg-danger-50 rounded-lg transition-all group relative"
                        title="Logout"
                    >
                        <LogOut className="w-5 h-5" />

                        {/* Tooltip */}
                        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            Logout
                        </div>
                    </button>
                </div>
            </div>
        </aside>
    );
}
