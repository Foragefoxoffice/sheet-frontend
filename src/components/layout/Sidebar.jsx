import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSidebar } from './Layout';
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
    Shield,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

export default function Sidebar() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const { isSidebarExpanded, setIsSidebarExpanded } = useSidebar();

    const isActive = (path) => location.pathname === path;

    // Check if user is super admin
    const userRole = typeof user?.role === 'string' ? user?.role : user?.role?.name;
    const isSuperAdmin = userRole === 'superadmin';

    const navItems = [
        {
            path: '/dashboard',
            icon: LayoutDashboard,
            label: 'Dashboard',
            permission: null,
        },
        {
            path: '/all-tasks',
            icon: CheckSquare,
            label: 'All Tasks',
        },
        {
            path: '/approvals',
            icon: ClipboardCheck,
            label: 'Approvals',
            permission: 'viewApprovals',
        },
        {
            path: '/reports',
            icon: BarChart3,
            label: 'Reports',
            permission: 'viewReports',
        },
        {
            path: '/users',
            icon: Users,
            label: 'Team Members',
            permission: 'viewUsers',
            superAdminAccess: true,
        },
        {
            path: '/departments',
            icon: Building2,
            label: 'Departments',
            permission: 'viewDepartments',
            superAdminAccess: true,
            notForManager: true,
        },
        {
            path: '/roles',
            icon: Shield,
            label: 'Roles',
            permission: ['viewRoles', 'createRoles', 'editRoles', 'deleteRoles'],
            superAdminAccess: true,
        },
    ];

    const filteredNavItems = navItems.filter((item) => {
        if (isSuperAdmin) return true;

        const isManager = userRole === 'manager';
        if (isManager && item.notForManager) return false;
        if (item.permission === 'superAdminOnly') return false;
        if (!item.permission) return true;

        if (Array.isArray(item.permission)) {
            return item.permission.some(perm => user?.permissions?.[perm] === true);
        }
        return user?.permissions?.[item.permission] === true;
    });

    return (
        <aside
            className={`bg-white border-r border-gray-100 flex flex-col fixed h-screen left-0 top-0 z-50 transition-all duration-300 ease-in-out shadow-2xl shadow-gray-200/50 ${isSidebarExpanded ? 'w-72' : 'w-[88px]'
                }`}
        >
            {/* Brand Section */}
            <div className="h-24 flex items-center justify-start px-6 mb-2">
                <div className="flex items-center gap-2 overflow-hidden">
                    <div className="rounded-xl flex items-center justify-center shrink-0">
                        {/* Use logo image if available, else fallback to icon */}
                        <img src="/icon.png" alt="Logo" className="w-10 h-10 object-contain" />
                    </div>

                    <div className={`transition-all duration-300 ${isSidebarExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 absolute'} flex flex-col`}>
                        <span className="text-xl font-bold text-gray-900 tracking-tight whitespace-nowrap">
                            VCGreen
                        </span>
                        <span className="text-xs font-medium text-gray-400 tracking-wide uppercase">
                            Workspace
                        </span>
                    </div>
                </div>
            </div>

            {/* Toggle Button */}
            <button
                onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                className="absolute -right-3 top-28 w-6 h-6 cursor-pointer bg-white border border-gray-200 text-gray-500 rounded-full flex items-center justify-center shadow-md hover:text-primary hover:border-primary transition-all duration-200 z-10"
            >
                {isSidebarExpanded ? (
                    <ChevronLeft className="w-3.5 h-3.5" />
                ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                )}
            </button>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-4 space-y-1.5 overflow-y-auto overflow-x-hidden nice-scrollbar">
                {filteredNavItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`relative flex items-center rounded-xl transition-all mb-4 duration-300 group overflow-hidden ${isSidebarExpanded ? 'px-4 py-3.5 gap-4' : 'justify-center p-3.5'
                                } ${active
                                    ? 'text-white shadow-lg shadow-[#253094]/30'
                                    : 'text-gray-500 hover:text-[#253094] hover:bg-[#253094]/20'
                                }`}
                        >
                            {/* Active Background Gradient */}
                            {active && (
                                <div className="absolute inset-0 bg-[#253094] z-0" />
                            )}

                            {/* Icon with refined scaling */}
                            <Icon
                                className={`relative z-10 w-5 h-5 shrink-0 transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'
                                    }`}
                            />

                            {/* Label */}
                            {isSidebarExpanded && (
                                <span className={`relative z-10 text-[15px] font-medium whitespace-nowrap transition-all duration-300 delay-75 ${active ? 'font-semibold' : ''
                                    }`}>
                                    {item.label}
                                </span>
                            )}

                            {/* Collapsed Tooltip */}
                            {!isSidebarExpanded && (
                                <div className="absolute left-16 ml-2 px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50 shadow-xl translate-x-2 group-hover:translate-x-0">
                                    {item.label}
                                </div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile Footer */}
            <div className={`p-4 mt-auto border-t border-gray-100 transition-all duration-300 ${isSidebarExpanded ? 'bg-gray-50/50' : ''}`}>
                <div className={`flex items-center ${isSidebarExpanded ? 'gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm' : 'flex-col gap-4'}`}>
                    {/* User Avatar */}
                    <div className="w-10 h-10 rounded-full bg-[#253094] flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md ring-2 ring-white">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>

                    {isSidebarExpanded && (
                        <div className="flex-1 min-w-0 overflow-hidden">
                            <h4 style={{ marginBottom: 0 }} className="text-sm font-semibold text-gray-900 truncate">
                                {user?.name}
                            </h4>
                            <p style={{ marginBottom: 0 }} className="text-xs text-gray-500 truncate capitalize">
                                {userRole || 'Team Member'}
                            </p>
                        </div>
                    )}

                    {/* Logout/Settings Controls */}
                    <button
                        onClick={logout}
                        className={`flex items-center justify-center text-gray-400 hover:text-danger hover:bg-red-50 rounded-lg transition-colors p-2 ${!isSidebarExpanded && 'mt-2 hover:bg-transparent hover:text-danger'
                            }`}
                        title="Logout"
                    >
                        <LogOut color='red' className="w-5 h-5 cursor-pointer" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
