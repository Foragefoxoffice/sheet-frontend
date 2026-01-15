import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { ROLES } from '../../../utils/constants';
import api from '../../../utils/api';
import { showToast } from '../../../utils/helpers';

export default function CreateDepartmentForm({ onSuccess, onCancel, managers = [] }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        manager: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            showToast('Department name is required', 'error');
            return;
        }

        setLoading(true);

        try {
            const response = await api.post('/departments', {
                name: formData.name,
                description: formData.description,
                manager: formData.manager || null,
            });

            if (response.data.success) {
                showToast(`Department "${formData.name}" created successfully!`, 'success');
                onSuccess(response.data.department);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Failed to create department';
            showToast(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Department Name */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department Name <span className="text-danger">*</span>
                </label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                    placeholder="e.g., Engineering, Sales, Marketing"
                    required
                />
            </div>

            {/* Description */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                </label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none resize-none"
                    placeholder="Brief description of the department"
                />
            </div>

            {/* Manager */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department Manager
                </label>
                <select
                    name="manager"
                    value={formData.manager}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none bg-white"
                >
                    <option value="">Select a manager (optional)</option>
                    {managers.map(manager => (
                        <option key={manager.id} value={manager.id}>
                            {manager.name} ({manager.email})
                        </option>
                    ))}
                </select>
                <small className="text-xs text-gray-500 mt-1 block">
                    You can assign a manager now or later
                </small>
            </div>

            {/* Info */}
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <div className="flex gap-3">
                    <div className="text-primary mt-0.5">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h4 className="text-sm font-medium text-primary-900 mb-1">Department Info</h4>
                        <p className="text-sm text-primary-800">
                            Departments help organize your team. You can assign managers and staff to departments for better task management.
                        </p>
                    </div>
                </div>
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
                    className="flex-1 px-6 py-2.5 bg-primary text-black rounded-lg hover:bg-primary-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Creating...
                        </>
                    ) : (
                        <>
                            <Building2 className="w-5 h-5" />
                            Create Department
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
