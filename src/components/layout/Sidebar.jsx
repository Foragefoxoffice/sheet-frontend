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
    const isSuperAdmin = userRole === 'superadmin'; // Changed to lowercase to match DB

    // Debug logging
    console.log('🔍 Sidebar Debug:', {
        userRole,
        isSuperAdmin,
        fullUserObject: user
    });

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
            superAdminAccess: true, // Show to super admin
        },
        {
            path: '/departments',
            icon: Building2,
            label: 'Departments',
            permission: 'viewDepartments',
            superAdminAccess: true, // Show to super admin
            notForManager: true, // Hide from managers
        },
        {
            path: '/roles',
            icon: Shield,
            label: 'Roles',
            permission: ['viewRoles', 'createRoles', 'editRoles', 'deleteRoles'],
            superAdminAccess: true, // Show to super admin
        },


    ];

    const filteredNavItems = navItems.filter((item) => {
        // ✅ SUPER ADMIN LOGIC
        if (isSuperAdmin) {
            // Super Admin can see all items
            console.log(`Super Admin - showing item: ${item.label}`);
            return true;
        }

        // ✅ NORMAL USERS LOGIC

        // Check if user is manager
        const isManager = userRole === 'manager';

        // Hide items marked as notForManager from managers
        if (isManager && item.notForManager) {
            return false;
        }

        // Hide super-admin-only items
        if (item.permission === 'superAdminOnly') return false;

        // If no permission required → show
        if (!item.permission) return true;

        // Permission-based check
        // Handle array of permissions (OR logic)
        if (Array.isArray(item.permission)) {
            return item.permission.some(perm => user?.permissions?.[perm] === true);
        }

        // Single permission string
        return user?.permissions?.[item.permission] === true;
    });

    console.log('📋 Filtered nav items:', filteredNavItems.map(i => i.label));


    return (
        <aside
            className={`bg-white border-r border-gray-200 flex flex-col fixed h-screen left-0 top-0 z-50 transition-all duration-300 ${isSidebarExpanded ? 'w-64' : 'w-20'
                }`}
        >
            {/* Brand */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
                        <img src="/icon.png" alt="" className="w-full h-full object-contain" />
                    </div>
                    {isSidebarExpanded && (
                        <span className="text-lg font-bold text-gray-900 whitespace-nowrap">
                            VCGreen
                        </span>
                    )}
                </div>
            </div>

            {/* Toggle Button */}
            <button
                onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                className="absolute -right-3 top-20 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-600 transition-colors z-10"
                title={isSidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            >
                {isSidebarExpanded ? (
                    <ChevronLeft className="w-4 h-4" />
                ) : (
                    <ChevronRight className="w-4 h-4" />
                )}
            </button>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-2 space-y-1 ">
                {filteredNavItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center ${isSidebarExpanded ? 'justify-start' : 'justify-center'} gap-3 px-3 py-3 rounded-lg transition-all group relative ${isActive(item.path)
                                ? 'bg-primary-50 text-primary'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            title={!isSidebarExpanded ? item.label : ''}
                        >
                            <Icon className="w-5 h-5 shrink-0" />

                            {isSidebarExpanded && (
                                <span className="text-sm font-medium whitespace-nowrap">
                                    {item.label}
                                </span>
                            )}

                            {/* Tooltip - only show when collapsed */}
                            {!isSidebarExpanded && (
                                <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none z-50 shadow-lg">
                                    {item.label}
                                </div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-gray-200">
                <div className={`flex items-center ${isSidebarExpanded ? 'gap-3' : 'flex-col space-y-3'}`}>
                    {/* User Avatar */}
                    <div className="w-10 h-10 bg-linear-to-br from-primary to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>

                    {isSidebarExpanded && (
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                                {user?.name}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                                {user?.email}
                            </div>
                        </div>
                    )}

                    {/* Logout Button */}
                    <button
                        onClick={logout}
                        className={`flex items-center justify-center text-gray-500 hover:text-danger hover:bg-danger-50 rounded-lg transition-all group relative ${isSidebarExpanded ? 'w-10 h-10' : 'w-10 h-10'
                            }`}
                        title="Logout"
                    >
                        <LogOut className="w-5 h-5" />

                        {/* Tooltip - only show when collapsed */}
                        {!isSidebarExpanded && (
                            <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none z-50 shadow-lg">
                                Logout
                            </div>
                        )}
                    </button>
                </div>
            </div>
        </aside>
    );
}
