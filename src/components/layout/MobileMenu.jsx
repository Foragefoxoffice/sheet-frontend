import { useState } from 'react';
import { X, LogOut, Settings, BarChart3, Users, Building2, Shield, CheckSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function MobileMenu({ isOpen, onClose }) {
    const { user, logout } = useAuth();

    const menuItems = [
        {
            path: '/all-tasks',
            icon: CheckSquare,
            label: 'All Tasks',
            permission: null,
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
        },
        {
            path: '/departments',
            icon: Building2,
            label: 'Departments',
            permission: 'viewDepartments',
        },
        {
            path: '/roles',
            icon: Shield,
            label: 'Roles',
            permission: 'viewRoles',
        },
    ];

    const filteredMenuItems = menuItems.filter(item => {
        if (!item.permission) return true;
        return user?.permissions?.[item.permission] === true;
    });

    const handleLogout = () => {
        logout();
        onClose();
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`md:hidden fixed inset-0 bg-black transition-opacity duration-300 z-40 ${isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={onClose}
            />

            {/* Slide-in Menu */}
            <div
                className={`md:hidden fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Header */}
                <div className="bg-linear-to-br from-primary to-purple-600 p-6 text-white">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <div className="mt-4">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-3">
                            <span className="text-2xl font-bold">
                                {user?.name?.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <h3 className="text-lg font-semibold">{user?.name}</h3>
                        <p className="text-sm text-white/80">{user?.email}</p>
                        <p className="text-xs text-white/70 mt-1">{user?.role?.displayName || user?.role?.name}</p>
                    </div>
                </div>

                {/* Menu Items */}
                <div className="flex-1 overflow-y-auto py-4">
                    {filteredMenuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={onClose}
                                className="flex items-center gap-4 px-6 py-4 text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                            >
                                <Icon className="w-5 h-5 text-gray-500" />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        );
                    })}

                    <div className="border-t border-gray-200 my-2" />

                    <Link
                        to="/settings"
                        onClick={onClose}
                        className="flex items-center gap-4 px-6 py-4 text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                    >
                        <Settings className="w-5 h-5 text-gray-500" />
                        <span className="font-medium">Settings</span>
                    </Link>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-4 px-6 py-4 text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors w-full"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </div>
        </>
    );
}
