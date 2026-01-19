import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ArrowLeft } from 'lucide-react';
import { Form, Input, Select, Button, Card, Alert, Space } from 'antd';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';
import { showToast } from '../utils/helpers';

export default function CreateUser() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [availableRoles, setAvailableRoles] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loadingRoles, setLoadingRoles] = useState(true);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchAvailableRoles();
        fetchDepartments();
    }, []);

    const fetchAvailableRoles = async () => {
        try {
            setLoadingRoles(true);
            const response = await api.get('/users/available-roles');
            setAvailableRoles(response.data.roles || []);
        } catch (error) {
            console.error('Error fetching available roles:', error);
            showToast('Failed to load available roles', 'error');
        } finally {
            setLoadingRoles(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await api.get('/departments');
            setDepartments(response.data.departments || []);
        } catch (error) {
            console.error('Error fetching departments:', error);
            showToast('Failed to load departments', 'error');
        }
    };

    const handleSubmit = async (values) => {
        setLoading(true);

        try {
            // Format whatsapp with country code
            const formattedWhatsapp = '91' + values.whatsapp;

            const response = await api.post('/auth/register', {
                ...values,
                whatsapp: formattedWhatsapp,
            });

            if (response.data.success) {
                showToast(`User ${values.name} created successfully!`, 'success');
                // Reset form
                form.resetFields();

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

    if (loadingRoles) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-6">
            {/* Header */}
            <div className="mb-8">
                <Button
                    type="text"
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 pl-0"
                    icon={<ArrowLeft className="w-4 h-4" />}
                >
                    Back
                </Button>
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
            <Card className="shadow-card border-none">
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    size="large"
                >
                    {/* Name */}
                    <Form.Item
                        label={<span className="font-medium text-gray-700">Full Name</span>}
                        name="name"
                        rules={[{ required: true, message: 'Please enter full name' }]}
                    >
                        <Input placeholder="Enter full name" />
                    </Form.Item>

                    {/* Designation */}
                    <Form.Item
                        label={<span className="font-medium text-gray-700">Designation</span>}
                        name="designation"
                    >
                        <Input placeholder="Enter designation (e.g., Senior Developer)" />
                    </Form.Item>

                    {/* Email */}
                    <Form.Item
                        label={<span className="font-medium text-gray-700">Email Address</span>}
                        name="email"
                        rules={[
                            { required: true, message: 'Please enter email' },
                            { type: 'email', message: 'Please enter a valid email' }
                        ]}
                    >
                        <Input placeholder="user@company.com" />
                    </Form.Item>

                    {/* WhatsApp */}
                    <Form.Item
                        label={<span className="font-medium text-gray-700">WhatsApp Number</span>}
                        name="whatsapp"
                        rules={[
                            { required: true, message: 'Please enter WhatsApp number' },
                            { pattern: /^\d{10}$/, message: 'Must be exactly 10 digits' }
                        ]}
                        help="Enter 10-digit WhatsApp number (used for login)"
                    >
                        <Space.Compact style={{ width: '100%' }}>
                            <Input
                                style={{ width: '60px' }}
                                value="+91"
                                disabled
                                className="text-center"
                            />
                            <Input
                                placeholder="98765 43210"
                                maxLength={10}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '');
                                    form.setFieldsValue({ whatsapp: value });
                                }}
                            />
                        </Space.Compact>
                    </Form.Item>

                    {/* Password */}
                    <Form.Item
                        label={<span className="font-medium text-gray-700">Password</span>}
                        name="password"
                        rules={[
                            { required: true, message: 'Please enter password' },
                            { min: 6, message: 'Password must be at least 6 characters' }
                        ]}
                    >
                        <Input.Password placeholder="Minimum 6 characters" />
                    </Form.Item>

                    {/* Role */}
                    <Form.Item
                        label={<span className="font-medium text-gray-700">Role</span>}
                        name="role"
                        rules={[{ required: true, message: 'Please select a role' }]}
                        help={
                            availableRoles.length > 0
                                ? `You can assign: ${availableRoles.map(r => r.displayName).join(', ')}`
                                : 'You can only assign roles below your level'
                        }
                    >
                        <Select placeholder="Select a role">
                            {availableRoles.map(role => (
                                <Select.Option key={role._id} value={role._id}>
                                    {role.displayName}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    {/* Department */}
                    <Form.Item
                        label={<span className="font-medium text-gray-700">Department *</span>}
                        name="department"
                        rules={[{ required: true, message: 'Please select a department' }]}
                    >
                        <Select placeholder="Select a department (required)">
                            {departments.map(dept => (
                                <Select.Option key={dept._id} value={dept._id}>
                                    {dept.name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    {/* Permission Info - Dynamic based on selected role */}
                    <Form.Item shouldUpdate={(prev, curr) => prev.role !== curr.role} noStyle>
                        {({ getFieldValue }) => {
                            const selectedRoleId = getFieldValue('role');
                            const selectedRole = availableRoles.find(r => r._id === selectedRoleId);

                            if (!selectedRole) return null;

                            const permissions = selectedRole.permissions || {};
                            const enabledPermissions = Object.entries(permissions)
                                .filter(([_, value]) => value === true)
                                .map(([key]) => key);

                            return (
                                <Alert
                                    message="Role Permissions"
                                    description={
                                        <ul className="text-sm list-none pl-0 mt-1">
                                            <li>• {selectedRole.description || 'No description available'}</li>
                                            <li>• {enabledPermissions.length} permissions enabled</li>
                                        </ul>
                                    }
                                    type="info"
                                    showIcon
                                    className="mb-6"
                                />
                            );
                        }}
                    </Form.Item>

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <Button
                            size="large"
                            className="flex-1"
                            onClick={() => navigate(-1)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            size="large"
                            className="flex-1 bg-primary text-white hover:bg-primary-600"
                            icon={<UserPlus className="w-5 h-5" />}
                        >
                            Create User
                        </Button>
                    </div>
                </Form>
            </Card>
        </div>
    );
}
