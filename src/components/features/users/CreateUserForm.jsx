import { useState, useEffect } from 'react';
import { UserPlus } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import api from '../../../utils/api';
import { showToast } from '../../../utils/helpers';

export default function CreateUserForm({ onSuccess, onCancel, departments = [] }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [availableRoles, setAvailableRoles] = useState([]);
    const [loadingRoles, setLoadingRoles] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        whatsapp: '',
        password: '',
        role: '',
        department: '',
    });

    useEffect(() => {
        fetchAvailableRoles();
    }, []);

    const fetchAvailableRoles = async () => {
        try {
            setLoadingRoles(true);
            const response = await api.get('/users/available-roles');
            const roles = response.data.roles || [];
            setAvailableRoles(roles);

            // Set default role to the lowest level available
            if (roles.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    role: roles[roles.length - 1]._id // Last role is lowest level
                }));
            }
        } catch (error) {
            console.error('Error fetching available roles:', error);
            showToast('Failed to load available roles', 'error');
        } finally {
            setLoadingRoles(false);
        }
    };

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

        if (!formData.role) {
            showToast('Please select a role', 'error');
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
                onSuccess(response.data.user);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Failed to create user';
            showToast(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loadingRoles) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading form...</p>
                </div>
            </div>
        );
    }

    if (availableRoles.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600 mb-4">You don't have permission to create users with any roles.</p>
                <button
                    onClick={onCancel}
                    className="px-6 py-2.5 border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                    Close
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
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
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
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
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
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
                        className="w-full pl-16 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                        placeholder="98765 43210"
                        maxLength="10"
                        required
                    />
                </div>
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
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                    placeholder="Minimum 6 characters"
                    required
                    minLength="6"
                />
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
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none bg-white"
                    required
                >
                    <option value="">Select a role</option>
                    {availableRoles.map(role => (
                        <option key={role._id} value={role._id}>
                            {role.displayName} {role.description && `- ${role.description}`}
                        </option>
                    ))}
                </select>
                <small className="text-xs text-gray-500 mt-1 block">
                    You can only assign roles below your level
                </small>
            </div>

            {/* Department */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                </label>
                <select
                    name="department"
                    value={formData.department || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none bg-white"
                >
                    <option value="">Select a department (optional)</option>
                    {departments?.map(dept => (
                        <option key={dept._id} value={dept._id}>
                            {dept.name}
                        </option>
                    ))}
                </select>
                <small className="text-xs text-gray-500 mt-1 block">
                    Assign user to a department for better organization
                </small>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 px-6 py-2.5 border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-2.5 bg-black text-white rounded-lg hover:bg-primary-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
    );
}
