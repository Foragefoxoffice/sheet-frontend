import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Profile() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="max-w-2xl mx-auto p-0 md:p-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Profile</h1>

            <div className="bg-white rounded-lg shadow-card p-6 mb-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-20 h-20 bg-linear-to-br from-primary to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-3xl font-bold text-white">
                            {user?.name?.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">{user?.name}</h2>
                        <p className="text-gray-600">{user?.email}</p>
                        <p className="text-sm text-gray-500 mt-1">{user?.role?.displayName || user?.role?.name}</p>
                    </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-500">Full Name</label>
                            <p className="text-gray-900">{user?.name}</p>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-500">Email Address</label>
                            <p className="text-gray-900">{user?.email}</p>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-500">Role</label>
                            <p className="text-gray-900">{user?.role?.displayName || user?.role?.name}</p>
                        </div>

                        {user?.department && (
                            <div>
                                <label className="text-sm font-medium text-gray-500">Department</label>
                                <p className="text-gray-900">{user?.department?.name}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Button
                type="primary"
                danger
                size="large"
                onClick={handleLogout}
                className="w-full md:w-auto flex items-center justify-center gap-2"
                icon={<LogOut className="w-5 h-5" />}
            >
                Logout
            </Button>
        </div>
    );
}
