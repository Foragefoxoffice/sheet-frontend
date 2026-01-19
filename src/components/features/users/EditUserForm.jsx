import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Form, Input, Select, Button, Space } from 'antd';
import { useAuth } from '../../../hooks/useAuth';
import api from '../../../utils/api';
import { showToast } from '../../../utils/helpers';

export default function EditUserForm({ user: userToEdit, onSuccess, onCancel, departments = [] }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [availableRoles, setAvailableRoles] = useState([]);
    const [loadingRoles, setLoadingRoles] = useState(true);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchAvailableRoles();
    }, []);

    useEffect(() => {
        if (userToEdit && availableRoles.length > 0) {
            // Extract department ID and role ID if they're objects
            const departmentId = typeof userToEdit.department === 'object'
                ? userToEdit.department?._id
                : userToEdit.department;

            const roleId = typeof userToEdit.role === 'object'
                ? userToEdit.role?._id
                : userToEdit.role;

            form.setFieldsValue({
                name: userToEdit.name,
                email: userToEdit.email,
                whatsapp: userToEdit.whatsapp?.startsWith('91') ? userToEdit.whatsapp.slice(2) : userToEdit.whatsapp,
                role: roleId,
                department: departmentId,
                designation: userToEdit.designation || '',
            });
        }
    }, [userToEdit, availableRoles, form]);

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

    const handleSubmit = async (values) => {
        setLoading(true);

        try {
            // Format whatsapp with country code
            const formattedWhatsapp = '91' + values.whatsapp;

            const requestData = {
                name: values.name,
                email: values.email,
                role: values.role,
                department: values.department,
                designation: values.designation,
                whatsapp: formattedWhatsapp,
            };

            const response = await api.put(`/users/${userToEdit._id}`, requestData);

            if (response.data.success) {
                showToast(`User ${values.name} updated successfully!`, 'success');
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
        <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className="space-y-4"
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
                        value={form.getFieldValue('whatsapp')}
                        onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').substring(0, 10);
                            form.setFieldsValue({ whatsapp: value });
                        }}
                    />
                </Space.Compact>
            </Form.Item>

            <Form.Item
                label={<span className="font-medium text-gray-700">Role</span>}
                name="role"
                rules={[{ required: true, message: 'Please select a role' }]}
                help="You can only assign roles below your level"
            >
                <Select placeholder="Select a role" size="large">
                    {availableRoles.map(role => (
                        <Select.Option key={role._id} value={role._id}>
                            {role.displayName} {role.description && `- ${role.description}`}
                        </Select.Option>
                    ))}
                </Select>
            </Form.Item>

            <Form.Item
                label={<span className="font-medium text-gray-700">Department</span>}
                name="department"
            >
                <Select placeholder="Select a department (optional)" size="large" allowClear>
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
                    icon={<Save className="w-4 h-4" />}
                >
                    Update User
                </Button>
            </div>
        </Form>
    );
}
