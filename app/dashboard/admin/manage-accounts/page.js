"use client";

import { withAuth } from '@/components/withAuth';
import { useEffect, useState } from "react";
import Layout from "@/components/Layout";

export default function ManageAccount() {
  const [form, setForm] = useState({
    account_id: "",
    full_name: "",
    phone: "",
    gender: "",
    marital_status: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [loading, setLoading] = useState(false);

  // 📥 Load staff info
  useEffect(() => {
    const fetchData = async () => {
      try {
        const account_id = localStorage.getItem("account_id");

        if (!account_id) return;

        const res = await fetch(`/api/auth/account/${account_id}`);
        const data = await res.json();

        // ✅ FILL ALL VALUES (no empty UI)
        setForm({
          account_id: data.account_id || "",
          full_name: data.full_name || "",
          phone: data.phone || "",
          gender: data.gender || "",
          marital_status: data.marital_status || "",
          email: data.email || "",
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });

      } catch (err) {
        console.log(err);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value || ""
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      alert("❌ Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/admin/manage-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error);
        return;
      }

      alert("✅ Update completed successfully");

      setForm(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      }));

    } catch (err) {
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout role="System Administrator">

      <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-lg">

        <h1 className="text-2xl font-bold mb-4">
          Manage Account
        </h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">

          {/* Hidden ID but still controlled */}
          <input
            type="hidden"
            name="account_id"
            value={form.account_id}
          />

          {/* PERSONAL INFO (ALWAYS FILLED) */}
          <input
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            placeholder="Full Name"
            className="border p-2 rounded"
          />

          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Phone"
            className="border p-2 rounded"
          />

          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            className="border p-2 rounded"
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>

          <select
            name="marital_status"
            value={form.marital_status}
            onChange={handleChange}
            className="border p-2 rounded"
          >
            <option value="">Marital Status</option>
            <option value="Single">Single</option>
            <option value="Married">Married</option>
          </select>

          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            className="border p-2 rounded col-span-2"
          />

          {/* PASSWORD SECTION */}
          <input
            type="password"
            name="currentPassword"
            value={form.currentPassword}
            onChange={handleChange}
            placeholder="Current Password"
            className="border p-2 rounded col-span-2"
          />

          <input
            type="password"
            name="newPassword"
            value={form.newPassword}
            onChange={handleChange}
            placeholder="New Password"
            className="border p-2 rounded"
          />

          <input
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm Password"
            className="border p-2 rounded"
          />

          <button
            disabled={loading}
            className="bg-blue-600 text-white p-2 rounded col-span-2"
          >
            {loading ? "Updating..." : "Save Changes"}
          </button>

        </form>

      </div>
    </Layout>
  );
}

export default withAuth(ManageAccount, ['System Administrator']);