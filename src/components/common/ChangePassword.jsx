import { useState } from 'react';
import { Form, Input, Button } from 'antd';
import { Lock, Save } from 'lucide-react';
import api from '../../utils/api';
import { showToast } from '../../utils/helpers';

export default function ChangePassword({ user: userToUpdate, onSuccess, onCancel }) {
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            const userId = userToUpdate._id || userToUpdate.id;
            const response = await api.put(`/users/${userId}`, {
                password: values.password
            });

            if (response.data.success) {
                showToast(`Password updated successfully for ${userToUpdate.name}`, 'success');
                form.resetFields();
                onSuccess && onSuccess(response.data.user);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Failed to update password';
            showToast(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className="space-y-4"
        >
            <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-sm text-blue-700 font-medium mb-0">
                    Changing password for: <span className="font-bold">{userToUpdate?.name}</span>
                </p>
                <p className="text-xs text-blue-600 mt-1 mb-0">
                    Enter a new password for this user. They will need this password for their next login.
                </p>
            </div>

            <Form.Item
                label={<span className="font-medium text-gray-700">New Password</span>}
                name="password"
                rules={[
                    { required: true, message: 'Please enter new password' },
                    { min: 6, message: 'Password must be at least 6 characters' }
                ]}
            >
                <Input.Password
                    prefix={<Lock className="w-4 h-4 text-gray-400 mr-2" />}
                    placeholder="Enter new password"
                    size="large"
                />
            </Form.Item>

            <Form.Item
                label={<span className="font-medium text-gray-700">Confirm Password</span>}
                name="confirmPassword"
                dependencies={['password']}
                rules={[
                    { required: true, message: 'Please confirm new password' },
                    ({ getFieldValue }) => ({
                        validator(_, value) {
                            if (!value || getFieldValue('password') === value) {
                                return Promise.resolve();
                            }
                            return Promise.reject(new Error('Passwords do not match'));
                        },
                    }),
                ]}
            >
                <Input.Password
                    prefix={<Lock className="w-4 h-4 text-gray-400 mr-2" />}
                    placeholder="Confirm new password"
                    size="large"
                />
            </Form.Item>

            <div className="md:flex grid gap-3 pt-4">
                <Button size="large" onClick={onCancel} className="flex-1 rounded-xl">
                    Cancel
                </Button>
                <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    size="large"
                    className="flex-1 bg-primary text-white hover:bg-primary-600 rounded-xl flex items-center justify-center gap-2"
                    icon={<Save className="w-4 h-4" />}
                >
                    Update Password
                </Button>
            </div>
        </Form>
    );
}