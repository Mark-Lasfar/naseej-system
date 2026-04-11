import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FaUser, FaLock, FaEnvelope, FaUserPlus, FaSignInAlt, FaEye, FaEyeSlash, FaStore } from 'react-icons/fa';

const API_URL = process.env.REACT_APP_API_URL || 'https://naseej-backend.vercel.app/api';

const Login = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
        // ❌ حذف role من هنا
    });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: '' });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.username.trim()) {
            newErrors.username = 'Username is required';
        } else if (formData.username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
        }

        if (!isLogin) {
            if (!formData.email) {
                newErrors.email = 'Email is required';
            } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
                newErrors.email = 'Email is invalid';
            }

            if (!formData.password) {
                newErrors.password = 'Password is required';
            } else if (formData.password.length < 6) {
                newErrors.password = 'Password must be at least 6 characters';
            }

            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Passwords do not match';
            }
        } else {
            if (!formData.password) {
                newErrors.password = 'Password is required';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            if (isLogin) {
                const response = await axios.post(`${API_URL}/auth/login`, {
                    username: formData.username,
                    password: formData.password
                });
                toast.success(`Welcome back, ${response.data.user.username}!`);
                onLogin(response.data.token, response.data.user);
            } else {
                // ✅ تسجيل مستخدم جديد - الدور دائمًا customer
                const response = await axios.post(`${API_URL}/auth/register`, {
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    role: 'customer'  // ✅ ثابت customer
                });
                toast.success(`Account created successfully! Welcome ${response.data.user.username}!`);
                onLogin(response.data.token, response.data.user);
            }
        } catch (error) {
            toast.error(error.response?.data?.error || 'Authentication failed.');
        } finally {
            setLoading(false);
        }
    };

    const fillDemoCredentials = () => {
        setFormData({
            ...formData,
            username: 'admin',
            password: 'admin123'
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all duration-500">
                {/* Logo */}
                <div className="text-center mb-6">
                    <div className="flex justify-center mb-4">
                        <img
                            src="/logo-icon.svg"
                            alt="Naseej Logo"
                            className="w-20 h-20"
                        />
                    </div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Naseej</h1>
                    <p className="text-gray-500 text-sm">Integrated Management System for Carpets & Textiles</p>
                </div>

                {/* Toggle Buttons */}
                <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => { setIsLogin(true); setErrors({}); }}
                        className={`flex-1 py-2 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 ${isLogin
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                                : 'text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        <FaSignInAlt size={16} />
                        Login
                    </button>
                    <button
                        onClick={() => { setIsLogin(false); setErrors({}); }}
                        className={`flex-1 py-2 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 ${!isLogin
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                                : 'text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        <FaUserPlus size={16} />
                        Register
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    {/* Username */}
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-medium mb-2">Username</label>
                        <div className="relative">
                            <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition ${errors.username ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                    }`}
                                placeholder="Enter your username"
                                disabled={loading}
                            />
                        </div>
                        {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
                    </div>

                    {/* Email (Register only) */}
                    {!isLogin && (
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-medium mb-2">Email</label>
                            <div className="relative">
                                <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                        }`}
                                    placeholder="Enter your email"
                                    disabled={loading}
                                />
                            </div>
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                        </div>
                    )}

                    {/* Password */}
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-medium mb-2">Password</label>
                        <div className="relative">
                            <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 transition ${errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                    }`}
                                placeholder="Enter your password"
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                            </button>
                        </div>
                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                    </div>

                    {/* Confirm Password (Register only) */}
                    {!isLogin && (
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-medium mb-2">Confirm Password</label>
                            <div className="relative">
                                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                        }`}
                                    placeholder="Confirm your password"
                                    disabled={loading}
                                />
                            </div>
                            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                        </div>
                    )}

                    {/* ❌ تم إزالة حقل Role بالكامل */}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                {isLogin ? 'Logging in...' : 'Creating account...'}
                            </>
                        ) : (
                            <>
                                {isLogin ? <FaSignInAlt /> : <FaUserPlus />}
                                {isLogin ? 'Login' : 'Register'}
                            </>
                        )}
                    </button>
                </form>

                {/* Demo Credentials */}
                {isLogin && (
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-500 mb-2">Demo Credentials</p>
                        <button
                            onClick={fillDemoCredentials}
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 mx-auto"
                        >
                            <FaStore size={12} />
                            Use admin / admin123
                        </button>
                        <p className="text-xs text-gray-400 mt-2">
                            (Admin account only for testing)
                        </p>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-6 pt-4 border-t text-center">
                    <p className="text-xs text-gray-400">
                        &copy; 2024 Naseej System. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;