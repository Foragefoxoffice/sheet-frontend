import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { ROLES } from '../utils/constants';
import api from '../utils/api';
import { showToast } from '../utils/helpers';

export default function CreateUser() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        whatsapp: '',
        password: '',
        role: 'Staff',
    });

    // Determine available roles based on current user's role
    const getAvailableRoles = () => {
        if (user.role === ROLES.DIRECTOR) {
            return [
                { value: 'Director', label: 'Director' },
                { value: 'GeneralManager', label: 'General Manager' },
                { value: 'Manager', label: 'Manager' },
                { value: 'Staff', label: 'Staff' },
            ];
        } else if (user.role === ROLES.GENERAL_MANAGER) {
            return [
                { value: 'Manager', label: 'Manager' },
                { value: 'Staff', label: 'Staff' },
            ];
        } else if (user.role === ROLES.MANAGER) {
            return [{ value: 'Staff', label: 'Staff' }];
        }
        return [];
    };

    const availableRoles = getAvailableRoles();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleWhatsappChange = (e) => {
        const value = e.target.value.replace(/\D/g, '').substring(0, 10);
        setFormData(prev => ({
            ...prev,
            whatsapp: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.name.trim()) {
            showToast('Name is required', 'error');
            return;
        }

        if (!formData.email.trim() || !formData.email.includes('@')) {
            showToast('Valid email is required', 'error');
            return;
        }

        if (formData.whatsapp.length !== 10) {
            showToast('WhatsApp number must be 10 digits', 'error');
            return;
        }

        if (formData.password.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }

        setLoading(true);

        try {
            // Format whatsapp with country code
            const formattedWhatsapp = '91' + formData.whatsapp;

            const response = await api.post('/auth/register', {
                ...formData,
                whatsapp: formattedWhatsapp,
            });

            if (response.data.success) {
                showToast(`User ${formData.name} created successfully!`, 'success');
                // Reset form
                setFormData({
                    name: '',
                    email: '',
                    whatsapp: '',
                    password: '',
                    role: 'Staff',
                });

                // Navigate to users list after 1 second
                setTimeout(() => {
                    navigate('/users');
                }, 1000);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Failed to create user';
            showToast(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Check if user has permission to create users
    if (!user?.permissions?.createUsers) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="text-6xl mb-4">🔒</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600">You don't have permission to create users.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center">
                        <UserPlus className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Create New User</h1>
                        <p className="text-gray-500 mt-1">Add a new team member to the system</p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="bg-white rounded-card shadow-card p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name <span className="text-danger">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                            placeholder="Enter full name"
                            required
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address <span className="text-danger">*</span>
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                            placeholder="user@company.com"
                            required
                        />
                    </div>

                    {/* WhatsApp */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            WhatsApp Number <span className="text-danger">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-medium">
                                +91
                            </span>
                            <input
                                type="tel"
                                value={formData.whatsapp}
                                onChange={handleWhatsappChange}
                                className="w-full pl-16 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                placeholder="98765 43210"
                                maxLength="10"
                                required
                            />
                        </div>
                        <small className="text-xs text-gray-500 mt-1 block">
                            Enter 10-digit WhatsApp number (used for login)
                        </small>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Password <span className="text-danger">*</span>
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                            placeholder="Minimum 6 characters"
                            required
                            minLength="6"
                        />
                        <small className="text-xs text-gray-500 mt-1 block">
                            Password must be at least 6 characters long
                        </small>
                    </div>

                    {/* Role */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Role <span className="text-danger">*</span>
                        </label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none bg-white"
                            required
                        >
                            {availableRoles.map(role => (
                                <option key={role.value} value={role.value}>
                                    {role.label}
                                </option>
                            ))}
                        </select>
                        <small className="text-xs text-gray-500 mt-1 block">
                            {user?.role?.level >= 4
                                ? 'As a Director, you can create users with any role'
                                : user?.role?.level >= 3
                                    ? 'As a General Manager, you can create Managers and Staff'
                                    : 'As a Manager, you can only create Staff users'}
                        </small>
                    </div>

                    {/* Permission Info */}
                    <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                        <div className="flex gap-3">
                            <div className="text-primary mt-0.5">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-medium text-primary-900 mb-1">Role Permissions</h4>
                                <ul className="text-sm text-primary-800 space-y-1">
                                    {formData.role === 'Director' && (
                                        <>
                                            <li>• Full system access and control</li>
                                            <li>• Can create and manage all users</li>
                                            <li>• Can view and manage all tasks and reports</li>
                                        </>
                                    )}
                                    {formData.role === 'GeneralManager' && (
                                        <>
                                            <li>• Can create Managers and Staff</li>
                                            <li>• Can approve all tasks</li>
                                            <li>• Can view all tasks and reports</li>
                                        </>
                                    )}
                                    {formData.role === 'Manager' && (
                                        <>
                                            <li>• Can create and manage Staff users</li>
                                            <li>• Can approve tasks assigned to Staff</li>
                                            <li>• Can view all tasks and reports</li>
                                        </>
                                    )}
                                    {formData.role === 'Staff' && (
                                        <>
                                            <li>• Can create and manage own tasks</li>
                                            <li>• Can update task status</li>
                                            <li>• Can view assigned tasks</li>
                                        </>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-5 h-5" />
                                    Create User
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
