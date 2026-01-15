import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import api from '../../../utils/api';
import { showToast } from '../../../utils/helpers';

export default function EditUserForm({ user: userToEdit, onSuccess, onCancel, departments = [] }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [availableRoles, setAvailableRoles] = useState([]);
    const [loadingRoles, setLoadingRoles] = useState(true);

    // Extract department ID and role ID if they're objects
    const departmentId = typeof userToEdit?.department === 'object'
        ? userToEdit?.department?._id
        : userToEdit?.department;

    const roleId = typeof userToEdit?.role === 'object'
        ? userToEdit?.role?._id
        : userToEdit?.role;

    const [formData, setFormData] = useState({
        name: userToEdit?.name || '',
        email: userToEdit?.email || '',
        whatsapp: userToEdit?.whatsapp?.replace('91', '') || '',
        role: roleId || '',
        department: departmentId || '',
    });

    useEffect(() => {
        fetchAvailableRoles();
    }, []);

    const fetchAvailableRoles = async () => {
        try {
            setLoadingRoles(true);
            const response = await api.get('/users/available-roles');
            const roles = response.data.roles || [];

            // Include the current user's role even if it's at the same level
            // (so they can keep their current role)
            const currentRole = userToEdit?.role;
            if (currentRole && typeof currentRole === 'object') {
                const hasCurrentRole = roles.some(r => r._id === currentRole._id);
                if (!hasCurrentRole) {
                    roles.push(currentRole);
                }
            }

            setAvailableRoles(roles);
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

        if (!formData.role) {
            showToast('Please select a role', 'error');
            return;
        }

        setLoading(true);

        try {
            // Format whatsapp with country code
            const formattedWhatsapp = '91' + formData.whatsapp;

            const response = await api.put(`/users/${userToEdit._id}`, {
                ...formData,
                whatsapp: formattedWhatsapp,
            });

            if (response.data.success) {
                showToast(`User ${formData.name} updated successfully!`, 'success');
                onSuccess(response.data.user);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Failed to update user';
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
                            Updating...
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            Update User
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
