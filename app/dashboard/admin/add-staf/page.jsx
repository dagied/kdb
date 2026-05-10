"use client";

import { useState, useRef, useEffect } from "react";
import Layout from "@/components/Layout";
import { FaCamera, FaStop, FaUpload, FaUser, FaEnvelope, FaPhone, FaCalendarAlt, FaVenusMars, FaHeart, FaUserTag, FaSpinner } from "react-icons/fa";
import { MdOutlinePhotoCamera, MdOutlineCloudUpload } from "react-icons/md";
import { GiConfirmed } from "react-icons/gi";

export default function AddStaff() {

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    role_id: "",
    phone: "",
    email: "",
    gender: "Male",
    birthdate: "",
    marital_status: "Single",
    profile_image: ""
  });

  const [loading, setLoading] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // ---------------- START CAMERA ----------------
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
    } catch (error) {
      alert("Camera access denied or not available");
    }
  };

  // ---------------- END CAMERA ----------------
  const stopCamera = () => {
    const stream = streamRef.current;

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    streamRef.current = null;
  };

  // ---------------- CAPTURE IMAGE ----------------
  const captureImage = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!video || !video.srcObject) {
      alert("Start camera first");
      return;
    }

    if (canvas) {
      canvas.width = 300;
      canvas.height = 300;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, 300, 300);

      const image = canvas.toDataURL("image/png");

      setForm({ ...form, profile_image: image });
    }
  };

  // ---------------- FILE UPLOAD ----------------
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      setForm({ ...form, profile_image: reader.result });
    };

    reader.readAsDataURL(file);
  };

  // ---------------- SUBMIT ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    await fetch("/api/auth/admin/create-staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    setLoading(false);
    alert("Staff Created Successfully");

    // stop camera after submit (good UX)
    stopCamera();
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <Layout role="System Administrator">

      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
          <FaUser className="text-blue-600" />
          Add Staff
        </h1>
        <p className="text-gray-500 mt-2">Create new staff account for Kebele Management System</p>
      </div>

      {/* IMAGE SECTION */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-6 hover:shadow-xl transition-shadow duration-300">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <MdOutlinePhotoCamera className="text-blue-600" />
            Profile Image
          </h2>
          <p className="text-sm text-gray-500 ml-6">Capture or upload staff photo</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-2 gap-8">

            {/* CAMERA SECTION */}
            <div className="space-y-4">
              <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden shadow-md">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-64 object-cover"
                  suppressHydrationWarning
                />
                {(!videoRef.current || !videoRef.current.srcObject) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <p className="text-white text-sm">Camera inactive</p>
                  </div>
                )}
              </div>

              <canvas ref={canvasRef} className="hidden" />

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={startCamera}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  suppressHydrationWarning
                >
                  <FaCamera />
                  Start Camera
                </button>

                <button
                  type="button"
                  onClick={captureImage}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  suppressHydrationWarning
                >
                  <MdOutlinePhotoCamera />
                  Capture
                </button>

                <button
                  type="button"
                  onClick={stopCamera}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  suppressHydrationWarning
                >
                  <FaStop />
                  Stop
                </button>
              </div>
            </div>

            {/* UPLOAD SECTION */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <MdOutlineCloudUpload />
                  Upload Profile Image
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    suppressHydrationWarning
                  />
                </div>
              </div>

              {form.profile_image && (
                <div className="flex flex-col items-center space-y-3 pt-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-md opacity-50"></div>
                    <img
                      src={form.profile_image}
                      className="relative w-36 h-36 rounded-full border-4 border-white shadow-xl object-cover"
                      alt="Profile preview"
                      suppressHydrationWarning
                    />
                  </div>
                  <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <GiConfirmed />
                    Image captured
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FaUserTag className="text-blue-600" />
              Staff Information
            </h2>
            <p className="text-sm text-gray-500 ml-6">Enter staff personal and contact details</p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FaUser className="text-blue-500" />
                  Full Name
                </label>
                <input
                  placeholder="Enter full name"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all duration-200 hover:border-gray-300"
                  onChange={(e) =>
                    setForm({ ...form, full_name: e.target.value })
                  }
                  suppressHydrationWarning
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FaUserTag className="text-purple-500" />
                  Role
                </label>
                <select
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all duration-200 bg-white hover:border-gray-300"
                  onChange={(e) =>
                    setForm({
                      ...form,
                      role_id: e.target.value ? Number(e.target.value) : ""
                    })
                  }
                  suppressHydrationWarning
                >
                  <option value="">Select Role</option>
                  <option value="2">Manager</option>
                  <option value="3">Officer</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FaPhone className="text-green-500" />
                  Phone Number
                </label>
                <input
                  placeholder="Enter phone number"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all duration-200 hover:border-gray-300"
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value })
                  }
                  suppressHydrationWarning
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FaEnvelope className="text-red-500" />
                  Email Address
                </label>
                <input
                  placeholder="Enter email address"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all duration-200 hover:border-gray-300"
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  suppressHydrationWarning
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FaVenusMars className="text-pink-500" />
                  Gender
                </label>
                <select
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all duration-200 bg-white hover:border-gray-300"
                  onChange={(e) =>
                    setForm({ ...form, gender: e.target.value })
                  }
                  suppressHydrationWarning
                >
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FaCalendarAlt className="text-orange-500" />
                  Birth Date
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all duration-200 hover:border-gray-300"
                  onChange={(e) =>
                    setForm({ ...form, birthdate: e.target.value })
                  }
                  suppressHydrationWarning
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FaHeart className="text-red-400" />
                  Marital Status
                </label>
                <select
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all duration-200 bg-white hover:border-gray-300"
                  onChange={(e) =>
                    setForm({ ...form, marital_status: e.target.value })
                  }
                  suppressHydrationWarning
                >
                  <option>Single</option>
                  <option>Married</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          suppressHydrationWarning
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin" />
              Creating Staff...
            </>
          ) : (
            <>
              <GiConfirmed className="text-xl" />
              Create Staff Account
            </>
          )}
        </button>
      </form>

    </Layout>
  );
}