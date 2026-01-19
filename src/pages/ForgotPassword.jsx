import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Alert, Space, Steps } from 'antd';
import { Lock, Phone, Shield, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '../utils/api';

const { Step } = Steps;

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form data
    const [whatsapp, setWhatsapp] = useState('');
    const [otp, setOtp] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // OTP timer
    const [otpExpiry, setOtpExpiry] = useState(0);
    const [canResend, setCanResend] = useState(false);

    // Countdown timer for OTP
    useEffect(() => {
        if (otpExpiry > 0) {
            const timer = setTimeout(() => {
                setOtpExpiry(otpExpiry - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (otpExpiry === 0 && currentStep === 1) {
            setCanResend(true);
        }
    }, [otpExpiry, currentStep]);

    // Format time remaining
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Step 1: Send OTP
    const handleSendOTP = async (values) => {
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const formattedWhatsapp = '91' + values.whatsapp;
            const response = await api.post('/password-reset/send-otp', {
                whatsapp: formattedWhatsapp
            });

            if (response.data.success) {
                setWhatsapp(formattedWhatsapp);
                setOtpExpiry(response.data.expiresIn || 900); // 15 minutes
                setCanResend(false);
                setSuccess('OTP sent successfully to your WhatsApp!');
                setTimeout(() => {
                    setCurrentStep(1);
                    setSuccess('');
                }, 1500);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Resend OTP
    const handleResendOTP = async () => {
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const response = await api.post('/password-reset/send-otp', {
                whatsapp
            });

            if (response.data.success) {
                setOtpExpiry(response.data.expiresIn || 900);
                setCanResend(false);
                setSuccess('OTP resent successfully!');
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to resend OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOTP = async (values) => {
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const response = await api.post('/password-reset/verify-otp', {
                whatsapp,
                otp: values.otp
            });

            if (response.data.success) {
                setResetToken(response.data.resetToken);
                setSuccess('OTP verified successfully!');
                setTimeout(() => {
                    setCurrentStep(2);
                    setSuccess('');
                }, 1500);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Reset Password
    const handleResetPassword = async (values) => {
        setError('');
        setSuccess('');

        if (values.newPassword !== values.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (values.newPassword.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        setLoading(true);

        try {
            const response = await api.post('/password-reset/reset-password', {
                whatsapp,
                resetToken,
                newPassword: values.newPassword
            });

            if (response.data.success) {
                setSuccess('Password reset successfully! Redirecting to login...');
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex overflow-hidden">
            {/* Left Column - Illustration */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-linear-to-br from-primary-600 via-primary-700 to-purple-900 overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-blob"></div>
                    <div className="absolute top-40 right-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000"></div>
                    <div className="absolute bottom-20 left-40 w-72 h-72 bg-primary-300 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-4000"></div>
                </div>
                <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
            </div>

            {/* Right Column - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-linear-to-br from-gray-50 to-white relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

                <div className="w-full max-w-md relative z-10">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-primary-500 to-primary-700 rounded-2xl mb-4 shadow-lg">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Task Manager</h1>
                    </div>

                    {/* Card */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 lg:p-10 border border-white/20">
                        {/* Header */}
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h2>
                            <p className="text-gray-600">Follow the steps to reset your password</p>
                        </div>

                        {/* Progress Steps */}
                        <Steps current={currentStep} className="mb-8">
                            <Step title="Phone" />
                            <Step title="Verify" />
                            <Step title="Reset" />
                        </Steps>

                        {error && (
                            <Alert
                                message={error}
                                type="error"
                                showIcon
                                className="mb-6 animate-shake"
                                closable
                                onClose={() => setError('')}
                            />
                        )}

                        {success && (
                            <Alert
                                message={success}
                                type="success"
                                showIcon
                                className="mb-6"
                            />
                        )}

                        {/* Step 1: Enter Phone Number */}
                        {currentStep === 0 && (
                            <Form
                                name="send-otp"
                                onFinish={handleSendOTP}
                                layout="vertical"
                                size="large"
                                requiredMark={false}
                            >
                                <Form.Item
                                    label={<span className="font-semibold text-gray-700">WhatsApp Number</span>}
                                    name="whatsapp"
                                    rules={[
                                        { required: true, message: 'Please enter your WhatsApp number' },
                                        { len: 10, message: 'Must be a valid 10-digit number' },
                                        { pattern: /^\d+$/, message: 'Must contain only digits' }
                                    ]}
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
                                            prefix={<Phone className="w-4 h-4 text-gray-400" />}
                                            className="py-2.5 rounded-lg"
                                        />
                                    </Space.Compact>
                                </Form.Item>

                                <Form.Item>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        loading={loading}
                                        className="w-full h-12 bg-linear-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 border-none shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 rounded-xl font-semibold text-lg flex items-center justify-center gap-2"
                                    >
                                        Send OTP <ArrowRight className="w-5 h-5" />
                                    </Button>
                                </Form.Item>

                                <div className="text-center">
                                    <Button
                                        type="link"
                                        onClick={() => navigate('/login')}
                                        className="text-primary-600 hover:text-primary-700"
                                    >
                                        <ArrowLeft className="w-4 h-4 inline mr-1" />
                                        Back to Login
                                    </Button>
                                </div>
                            </Form>
                        )}

                        {/* Step 2: Verify OTP */}
                        {currentStep === 1 && (
                            <Form
                                name="verify-otp"
                                onFinish={handleVerifyOTP}
                                layout="vertical"
                                size="large"
                                requiredMark={false}
                            >
                                <div className="text-center mb-6">
                                    <p className="text-gray-600">
                                        Enter the 6-digit OTP sent to<br />
                                        <span className="font-semibold text-gray-900">+{whatsapp}</span>
                                    </p>
                                    {otpExpiry > 0 && (
                                        <p className="text-sm text-gray-500 mt-2">
                                            OTP expires in: <span className="font-semibold text-primary-600">{formatTime(otpExpiry)}</span>
                                        </p>
                                    )}
                                </div>

                                <Form.Item
                                    label={<span className="font-semibold text-gray-700">Enter OTP</span>}
                                    name="otp"
                                    rules={[
                                        { required: true, message: 'Please enter the OTP' },
                                        { len: 6, message: 'OTP must be 6 digits' },
                                        { pattern: /^\d+$/, message: 'OTP must contain only digits' }
                                    ]}
                                >
                                    <Input
                                        placeholder="123456"
                                        maxLength={6}
                                        className="py-2.5 rounded-lg text-center text-2xl tracking-widest"
                                        autoFocus
                                    />
                                </Form.Item>

                                <Form.Item>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        loading={loading}
                                        className="w-full h-12 bg-linear-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 border-none shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 rounded-xl font-semibold text-lg flex items-center justify-center gap-2"
                                    >
                                        Verify OTP <CheckCircle className="w-5 h-5" />
                                    </Button>
                                </Form.Item>

                                <div className="text-center space-y-2">
                                    <Button
                                        type="link"
                                        onClick={handleResendOTP}
                                        disabled={!canResend || loading}
                                        className="text-primary-600 hover:text-primary-700"
                                    >
                                        {canResend ? 'Resend OTP' : 'Resend OTP (wait for timer)'}
                                    </Button>
                                    <br />
                                    <Button
                                        type="link"
                                        onClick={() => {
                                            setCurrentStep(0);
                                            setError('');
                                            setSuccess('');
                                        }}
                                        className="text-gray-600 hover:text-gray-700"
                                    >
                                        <ArrowLeft className="w-4 h-4 inline mr-1" />
                                        Change Number
                                    </Button>
                                </div>
                            </Form>
                        )}

                        {/* Step 3: Set New Password */}
                        {currentStep === 2 && (
                            <Form
                                name="reset-password"
                                onFinish={handleResetPassword}
                                layout="vertical"
                                size="large"
                                requiredMark={false}
                            >
                                <Form.Item
                                    label={<span className="font-semibold text-gray-700">New Password</span>}
                                    name="newPassword"
                                    rules={[
                                        { required: true, message: 'Please enter your new password' },
                                        { min: 6, message: 'Password must be at least 6 characters' }
                                    ]}
                                >
                                    <Input.Password
                                        placeholder="Enter new password"
                                        prefix={<Lock className="w-4 h-4 text-gray-400" />}
                                        className="py-2.5 rounded-lg"
                                    />
                                </Form.Item>

                                <Form.Item
                                    label={<span className="font-semibold text-gray-700">Confirm Password</span>}
                                    name="confirmPassword"
                                    rules={[
                                        { required: true, message: 'Please confirm your password' },
                                        { min: 6, message: 'Password must be at least 6 characters' }
                                    ]}
                                >
                                    <Input.Password
                                        placeholder="Confirm new password"
                                        prefix={<Lock className="w-4 h-4 text-gray-400" />}
                                        className="py-2.5 rounded-lg"
                                    />
                                </Form.Item>

                                <Form.Item>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        loading={loading}
                                        className="w-full h-12 bg-linear-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 border-none shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 rounded-xl font-semibold text-lg flex items-center justify-center gap-2"
                                    >
                                        Reset Password <CheckCircle className="w-5 h-5" />
                                    </Button>
                                </Form.Item>
                            </Form>
                        )}

                        {/* Footer */}
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <p className="text-center text-sm text-gray-600">
                                Protected by enterprise-grade security
                                <Shield className="inline-block w-4 h-4 ml-1 text-primary-600" />
                            </p>
                        </div>
                    </div>

                    {/* Bottom Text */}
                    <p className="text-center text-sm text-gray-500 mt-6">
                        © 2025 VCGreen Task Manager. All rights reserved.
                    </p>
                </div>
            </div>

            {/* Custom Styles */}
            <style>{`
                @keyframes blob {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    25% { transform: translate(20px, -20px) scale(1.1); }
                    50% { transform: translate(-20px, 20px) scale(0.9); }
                    75% { transform: translate(20px, 20px) scale(1.05); }
                }

                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }

                .animate-blob {
                    animation: blob 7s infinite;
                }

                .animation-delay-2000 {
                    animation-delay: 2s;
                }

                .animation-delay-4000 {
                    animation-delay: 4s;
                }

                .animate-shake {
                    animation: shake 0.3s ease-in-out;
                }

                .bg-grid-pattern {
                    background-image: 
                        linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
                    background-size: 50px 50px;
                }
            `}</style>
        </div>
    );
}
