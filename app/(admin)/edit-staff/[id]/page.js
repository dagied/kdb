"use client";

import { useEffect, useState, useRef, use } from "react"; // ✅ FIXED
import Layout from "@/components/Layout";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaVenusMars,
  FaHeart,
  FaSpinner,
  FaCamera,
  FaStop
} from "react-icons/fa";
import { GiConfirmed } from "react-icons/gi";

export default function EditStaff({ params }) {

  // ✅ NEXT.JS 16 FIX (params is a Promise)
  const { id: staffId } = use(params);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    role_id: "",
    phone: "",
    email: "",
    gender: "",
    birthdate: "",
    marital_status: "",
    profile_image: ""
  });

  // ---------------- FETCH STAFF ----------------
  const fetchStaff = async () => {
    try {
      const res = await fetch(`/api/auth/admin/get-staff/${staffId}`);

      if (!res.ok) {
        const text = await res.text();
        console.error("Fetch error:", text);
        return;
      }

      const data = await res.json();

      setForm({
        full_name: data.full_name || "",
        role_id: data.role_id || "",
        phone: data.phone || "",
        email: data.email || "",
        gender: data.gender || "",
        birthdate: data.birthdate?.split("T")[0] || "",
        marital_status: data.marital_status || "",
        profile_image: data.profile_image || ""
      });

    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [staffId]);

  // ---------------- UPDATE STAFF ----------------
  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(
        `/api/auth/admin/update-staff/${staffId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.error);
        return;
      }

      alert("Staff updated successfully");

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- CAMERA ----------------
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      streamRef.current = stream;

    } catch (error) {
      alert("Camera not available");
    }
  };

  const stopCamera = () => {
    const stream = streamRef.current;

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    streamRef.current = null;
  };

  const captureImage = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!video || !video.srcObject) {
      alert("Start camera first");
      return;
    }

    canvas.width = 300;
    canvas.height = 300;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, 300, 300);

    const image = canvas.toDataURL("image/png");

    setForm({ ...form, profile_image: image });
  };

  // ---------------- UI ----------------
  return (
    <Layout role="System Administrator">

      <h1 className="text-2xl font-bold mb-6">Edit Staff</h1>

      <form onSubmit={handleUpdate} className="space-y-4">

        <input
          placeholder="Full Name"
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          className="border p-2 w-full"
        />

        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="border p-2 w-full"
        />

        <input
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="border p-2 w-full"
        />

        <select
          value={form.role_id}
          onChange={(e) => setForm({ ...form, role_id: e.target.value })}
          className="border p-2 w-full"
        >
          <option value="">Select Role</option>
          <option value="2">Officer</option>
          <option value="3">Manager</option>
        </select>

        <input
          type="date"
          value={form.birthdate}
          onChange={(e) => setForm({ ...form, birthdate: e.target.value })}
          className="border p-2 w-full"
        />

        <select
          value={form.gender}
          onChange={(e) => setForm({ ...form, gender: e.target.value })}
          className="border p-2 w-full"
        >
          <option>Male</option>
          <option>Female</option>
        </select>

        <select
          value={form.marital_status}
          onChange={(e) => setForm({ ...form, marital_status: e.target.value })}
          className="border p-2 w-full"
        >
          <option>Single</option>
          <option>Married</option>
        </select>

        {/* CAMERA */}
        <div className="space-y-2">
          <video ref={videoRef} autoPlay className="w-64 h-48 bg-black" />
          <canvas ref={canvasRef} className="hidden" />

          <div className="flex gap-2">
            <button type="button" onClick={startCamera}>Start</button>
            <button type="button" onClick={captureImage}>Capture</button>
            <button type="button" onClick={stopCamera}>Stop</button>
          </div>
        </div>

        {form.profile_image && (
          <img src={form.profile_image} className="w-32 h-32 rounded-full" />
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2"
        >
          {loading ? "Updating..." : "Update Staff"}
        </button>

      </form>

    </Layout>
  );
}