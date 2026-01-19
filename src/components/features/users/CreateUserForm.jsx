import { useState, useEffect } from 'react';
import { UserPlus } from 'lucide-react';
import { Form, Input, Select, Button, Space } from 'antd';
import { useAuth } from '../../../hooks/useAuth';
import api from '../../../utils/api';
import { showToast } from '../../../utils/helpers';

export default function CreateUserForm({ onSuccess, onCancel, departments = [] }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [availableRoles, setAvailableRoles] = useState([]);
    const [loadingRoles, setLoadingRoles] = useState(true);
    const [form] = Form.useForm();
    const [requiresDepartment, setRequiresDepartment] = useState(false);

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
                const defaultRole = roles[roles.length - 1];
                // Use setTimeout to ensure form is mounted before setting values
                setTimeout(() => {
                    form.setFieldsValue({ role: defaultRole._id });
                }, 0);
                updateDepartmentRequirement(defaultRole._id, roles);
            }
        } catch (error) {
            console.error('Error fetching available roles:', error);
            showToast('Failed to load available roles', 'error');
        } finally {
            setLoadingRoles(false);
        }
    };

    const updateDepartmentRequirement = (roleId, rolesList = availableRoles) => {
        const selectedRole = rolesList.find(r => r._id === roleId);
        const required = selectedRole?.name === 'manager' || selectedRole?.name === 'staff';
        setRequiresDepartment(required);
    };

    const handleRoleChange = (value) => {
        updateDepartmentRequirement(value);
        // Clear department if switching to a role that doesn't need it? No, keep it.
    };

    const handleSubmit = async (values) => {
        setLoading(true);

        try {
            // Format whatsapp with country code
            const formattedWhatsapp = '91' + values.whatsapp;

            const requestData = {
                name: values.name,
                email: values.email,
                password: values.password,
                role: values.role,
                department: values.department,
                designation: values.designation,
                whatsapp: formattedWhatsapp,
            };

            const response = await api.post('/auth/register', requestData);

            if (response.data.success) {
                showToast(`User ${values.name} created successfully!`, 'success');
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
                <Button onClick={onCancel}>Close</Button>
            </div>
        );
    }

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className="space-y-4"
            initialValues={{
                whatsapp: '',
            }}
        >
            <Form.Item
                label={<span className="font-medium text-gray-700">Full Name</span>}
                name="name"
                rules={[{ required: true, message: 'Please enter full name' }]}
            >
                <Input placeholder="Enter full name" size="large" />
            </Form.Item>

            <Form.Item
                label={<span className="font-medium text-gray-700">Designation</span>}
                name="designation"
            >
                <Input placeholder="Enter designation (e.g., Senior Developer)" size="large" />
            </Form.Item>

            <Form.Item
                label={<span className="font-medium text-gray-700">Email Address (Optional, can be shared)</span>}
                name="email"
                rules={[
                    { type: 'email', message: 'Please enter a valid email' }
                ]}
            >
                <Input placeholder="user@company.com (optional)" size="large" />
            </Form.Item>

            <Form.Item
                label={<span className="font-medium text-gray-700">WhatsApp Number</span>}
                name="whatsapp"
                rules={[
                    { required: true, message: 'Please enter WhatsApp number' },
                    { len: 10, message: 'WhatsApp number must be 10 digits' },
                    { pattern: /^\d+$/, message: 'Must be digits only' }
                ]}
            >
                <Space.Compact style={{ width: '100%' }}>
                    <Input
                        style={{ width: '60px' }}
                        value="+91"
                        disabled
                        className="text-center"
                        size="large"
                    />
                    <Input
                        placeholder="98765 43210"
                        maxLength={10}
                        size="large"
                        onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').substring(0, 10);
                            form.setFieldsValue({ whatsapp: value });
                        }}
                    />
                </Space.Compact>
            </Form.Item>

            <Form.Item
                label={<span className="font-medium text-gray-700">Password</span>}
                name="password"
                rules={[
                    { required: true, message: 'Please enter password' },
                    { min: 6, message: 'Password must be at least 6 characters' }
                ]}
            >
                <Input.Password placeholder="Minimum 6 characters" size="large" />
            </Form.Item>

            <Form.Item
                label={<span className="font-medium text-gray-700">Role</span>}
                name="role"
                rules={[{ required: true, message: 'Please select a role' }]}
                help={
                    <span className="text-xs text-gray-500">
                        {availableRoles.length > 0
                            ? `You can assign: ${availableRoles.map(r => r.displayName).join(', ')}`
                            : 'You can only assign roles below your level'}
                    </span>
                }
            >
                <Select
                    placeholder="Select a role"
                    size="large"
                    onChange={handleRoleChange}
                >
                    {availableRoles.map(role => (
                        <Select.Option key={role._id} value={role._id}>
                            {role.displayName} {role.description && `- ${role.description}`}
                        </Select.Option>
                    ))}
                </Select>
            </Form.Item>

            <Form.Item
                label={
                    <span className="font-medium text-gray-700">
                        Department {requiresDepartment && <span className="text-danger">*</span>}
                    </span>
                }
                name="department"
                rules={[{ required: requiresDepartment, message: 'Department is required for this role' }]}
                help={
                    <span className="text-xs text-gray-500">
                        {requiresDepartment
                            ? 'Department is required for Manager and Staff roles'
                            : 'Assign user to a department for better organization'}
                    </span>
                }
            >
                <Select
                    placeholder={requiresDepartment ? 'Select a department (required)' : 'Select a department (optional)'}
                    size="large"
                    allowClear
                >
                    {departments?.map(dept => (
                        <Select.Option key={dept._id} value={dept._id}>
                            {dept.name}
                        </Select.Option>
                    ))}
                </Select>
            </Form.Item>

            <div className="flex gap-3 pt-2">
                <Button size="large" onClick={onCancel} className="flex-1">
                    Cancel
                </Button>
                <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    size="large"
                    className="flex-1 bg-black text-white hover:bg-gray-800"
                    icon={<UserPlus className="w-4 h-4" />}
                >
                    Create User
                </Button>
            </div>
        </Form>
    );
}
