'use client';
import React, { useState } from 'react';
import { FaUser, FaLock, FaSignInAlt, FaEye, FaEyeSlash, FaBuilding, FaShieldAlt } from 'react-icons/fa';
import Image from 'next/image';
import Link from 'next/link';

export default function CheckUser() {
  const [form, setForm] = useState({
    username: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      console.log('Login response:', data);

      if (!res.ok) {
        alert(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      if (data.success && data.user) {
        localStorage.setItem('user', JSON.stringify({
          name: data.user.name,
          role: data.user.role,
          staff_id: data.user.staff_id,
          username: data.user.username
        }));
      }

      const role = data.user.role;

      if (role === "System Administrator") {
        window.location.href = '/dashboard/admin';
      } else if (role === "Kebele Manager") {
        window.location.href = '/dashboard/manager';
      } else if (role === "Record Officer") {
        window.location.href = '/dashboard/officer';
      } else {
        window.location.href = '/dashboard/resident';
      }

    } catch (error) {
      console.error('Login error:', error);
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      {/* Industrial Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(45deg, #fff 0px, #fff 2px, transparent 2px, transparent 8px)`
        }}></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(135deg, #4a5568 0px, #4a5568 1px, transparent 1px, transparent 20px)`
        }}></div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4">
        <div className="flex flex-col lg:flex-row rounded-lg overflow-hidden shadow-2xl">
          
          {/* LEFT SIDE - Branding/Info Panel */}
          <div className="lg:w-1/2 bg-gray-800 p-8 lg:p-12 flex flex-col justify-between">
            <div>
              {/* Flags */}
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-7 rounded overflow-hidden">
                  <Image src="/et.png" alt="Ethiopia" width={40} height={28} className="object-cover" />
                </div>
                <div className="w-10 h-7 rounded overflow-hidden">
                  <Image src="/or.png" alt="Oromia" width={40} height={28} className="object-cover" />
                </div>
                <div className="h-6 w-px bg-gray-600 mx-2"></div>
                <FaBuilding className="text-gray-400 text-xl" />
              </div>

              {/* Title */}
              <h1 className="text-4xl font-bold text-white mb-4">
                Bosa Addis Kebele
              </h1>
              <p className="text-gray-400 text-sm leading-relaxed mb-8">
                Administrative Management System
              </p>

              {/* Divider */}
              <div className="w-12 h-0.5 bg-blue-500 mb-8"></div>

              {/* Features List */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FaShieldAlt className="text-blue-400 text-sm" />
                  </div>
                  <div>
                    <h3 className="text-white text-sm font-medium mb-1">Secure Authentication</h3>
                    <p className="text-gray-500 text-xs">Role-based access control with encryption</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white text-sm font-medium mb-1">Data Protection</h3>
                    <p className="text-gray-500 text-xs">Encrypted database with audit logging</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white text-sm font-medium mb-1">24/7 Service Delivery</h3>
                    <p className="text-gray-500 text-xs">Digital services accessible anytime</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Text Left */}
            <div className="mt-8 pt-8 border-t border-gray-700">
              <p className="text-gray-600 text-xs">
                © 2024 Bosa Addis Kebele Administration
              </p>
            </div>
          </div>

          {/* RIGHT SIDE - Login Form */}
          <div className="lg:w-1/2 bg-white p-8 lg:p-12">
            <div className="max-w-md mx-auto">
              {/* Header */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In</h2>
                <p className="text-gray-500 text-sm">
                  Enter your credentials to access the system
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUser className="text-gray-400 text-sm" />
                    </div>
                    <input
                      onChange={(e) => setForm({...form, username: e.target.value})}
                      type="text"
                      placeholder="Enter your username"
                      value={form.username}
                      required
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLock className="text-gray-400 text-sm" />
                    </div>
                    <input
                      onChange={(e) => setForm({...form, password: e.target.value})}
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={form.password}
                      required
                      className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <FaEyeSlash className="text-gray-400 hover:text-gray-600 text-sm" />
                      ) : (
                        <FaEye className="text-gray-400 hover:text-gray-600 text-sm" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Forgot Password */}
                <div className="flex justify-end">
                  <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">
                    Forgot password?
                  </Link>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gray-800 hover:bg-gray-900 text-white py-2.5 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <FaSignInAlt className="text-sm" />
                      Sign In
                    </>
                  )}
                </button>
              </form>

              {/* Help Text */}
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  Need help? Contact the system administrator
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}