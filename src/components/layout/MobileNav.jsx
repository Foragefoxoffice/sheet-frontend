import { Home, CheckSquare, PlusCircle, ClipboardCheck, User, Users, Building2, Shield } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function MobileNav() {
    const location = useLocation();
    const { user } = useAuth();

    // Check if user is super admin
    const userRole = typeof user?.role === 'string' ? user?.role : user?.role?.name;
    const isSuperAdmin = userRole === 'SuperAdmin';

    const navItems = [
        {
            path: '/dashboard',
            icon: Home,
            label: 'Home',
            notForSuperAdmin: true,
            permission: null,
        },
        {
            path: '/all-tasks',
            icon: CheckSquare,
            label: 'All Tasks',
            notForSuperAdmin: true,
            permission: null,
        },
        {
            path: '/create-task',
            icon: PlusCircle,
            label: 'Create',
            notForSuperAdmin: true,
            permission: 'createTasks',
        },
        {
            path: '/approvals',
            icon: ClipboardCheck,
            label: 'Approvals',
            notForSuperAdmin: true,
            permission: 'approveTasks',
        },
        {
            path: '/users',
            icon: Users,
            label: 'Team',
            superAdminAccess: true,
            permission: 'viewUsers',
        },
        {
            path: '/departments',
            icon: Building2,
            label: 'Depts',
            superAdminAccess: true,
            permission: 'viewDepartments',
        },
        {
            path: '/roles',
            icon: Shield,
            label: 'Roles',
            superAdminAccess: true,
            permission: 'viewRoles',
        },
        {
            path: '/profile',
            icon: User,
            label: 'Profile',
            permission: null,
        },
    ];

    const filteredNavItems = navItems.filter(item => {
        // Check permission first
        if (item.permission && !user?.permissions?.[item.permission]) {
            return false;
        }

        // Super admin: only show items with superAdminAccess flag or no restriction
        if (isSuperAdmin) {
            return item.superAdminAccess === true || (!item.notForSuperAdmin && !item.superAdminAccess);
        }
        // Other users: hide items marked as superAdminAccess only
        return !item.superAdminAccess;
    });

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
            <div className="flex justify-around items-center h-16">
                {filteredNavItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${active
                                ? 'text-primary'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Icon className={`w-6 h-6 mb-1 ${active ? 'stroke-2' : 'stroke-1.5'}`} />
                            <span className={`text-xs ${active ? 'font-semibold' : 'font-normal'}`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
