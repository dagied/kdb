"use client";

import { withAuth } from '@/components/withAuth';
import { useState, useRef } from "react";
import Layout from "@/components/Layout";
import { FaBullhorn, FaPaperPlane, FaUsers, FaUserTie, FaUserCheck } from "react-icons/fa";

function AnnouncementPage() {
  const [form, setForm] = useState({
    title: "",
    content: "",
    target: "all",
  });

  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const [open, setOpen] = useState(false);

  const options = [
    { value: "all", label: "All Staff Members", icon: FaUsers },
    { value: "manager", label: "Kebele Managers", icon: FaUserTie },
    { value: "officer", label: "Record Officers", icon: FaUserCheck },
  ];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/admin/create-announcement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || data.message || "Failed to send announcement");
        return;
      }

      alert(`✅ Announcement sent successfully to ${data.sentTo || 0} staff members`);

      setForm({
        title: "",
        content: "",
        target: "all",
      });

    } catch (err) {
      console.error("Announcement error:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Get target icon and label
  const getTargetInfo = () => {
    switch(form.target) {
      case "manager":
        return { icon: FaUserTie, label: "Kebele Managers", color: "text-purple-600" };
      case "officer":
        return { icon: FaUserCheck, label: "Record Officers", color: "text-green-600" };
      default:
        return { icon: FaUsers, label: "All Staff Members", color: "text-blue-600" };
    }
  };

  const TargetIcon = getTargetInfo().icon;
  const targetColor = getTargetInfo().color;

  return (
    <Layout role="System Administrator">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg mb-4">
              <FaBullhorn className="text-white text-2xl" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Create Announcement
            </h1>
            <p className="text-gray-600 mt-2">Send important updates to staff members</p>
          </div>

          {/* Main Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-white/20">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4">
              <div className="flex items-center gap-3">
                <FaPaperPlane className="text-white text-xl" />
                <h2 className="text-white font-semibold text-lg">New Announcement</h2>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6" suppressHydrationWarning>
              {/* Title Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Announcement Title
                </label>
                <input
                  type="text"
                  name="title"
                  placeholder="e.g., Important System Update, Holiday Notice, etc."
                  value={form.title}
                  onChange={handleChange}
                  className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none text-gray-800 placeholder-gray-400"
                  required
                  suppressHydrationWarning
                />
              </div>

              {/* Content Textarea */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Message Content
                </label>
                <textarea
                  name="content"
                  placeholder="Write your announcement message here..."
                  value={form.content}
                  onChange={handleChange}
                  className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none text-gray-800 placeholder-gray-400 resize-none"
                  rows="8"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tip: You can use HTML formatting for rich text content
                </p>
              </div>

              {/* Target Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Send To
                </label>
                <div className="relative" ref={dropdownRef}>
                  {/* Selected */}
                  <div
                    onClick={() => setOpen(!open)}
                    className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl bg-white cursor-pointer flex justify-between items-center"
                  >
                    <div className="flex items-center gap-2">
                      {(() => {
                        const selected = options.find(o => o.value === form.target);
                        const Icon = selected?.icon || FaUsers;
                        return (
                          <>
                            <Icon className={`${form.target === 'manager' ? 'text-purple-600' : form.target === 'officer' ? 'text-green-600' : 'text-blue-600'}`} />
                            {selected?.label || "All Staff Members"}
                          </>
                        );
                      })()}
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {/* Dropdown */}
                  {open && (
                    <div className="absolute w-full mt-2 bg-white border rounded-xl shadow-lg z-10">
                      {options.map((opt) => {
                        const Icon = opt.icon;
                        return (
                          <div
                            key={opt.value}
                            onClick={() => {
                              setForm(prev => ({ ...prev, target: opt.value }));
                              setOpen(false);
                            }}
                            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          >
                            <Icon className="text-gray-600" />
                            {opt.label}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Preview Card */}
              {form.title && form.content && (
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-5 border-2 border-blue-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500`}>
                      <TargetIcon className="text-white text-sm" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-700 text-sm">Preview: Sending to</h3>
                      <p className={`text-sm font-medium ${targetColor}`}>{getTargetInfo().label}</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="font-bold text-gray-800 mb-2">{form.title || "Title Preview"}</h4>
                    <p className="text-gray-600 text-sm whitespace-pre-wrap">{form.content || "Content preview will appear here..."}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="relative w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold text-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden group"
                suppressHydrationWarning
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending Announcement...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane className="text-xl group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-200" />
                      Send Announcement
                    </>
                  )}
                </span>
                {!loading && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                )}
              </button>
            </form>

            <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>Announcements will be sent via email and in-app notifications to all selected recipients</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// ✅ ONLY ONE DEFAULT EXPORT - Remove the duplicate export
export default withAuth(AnnouncementPage, ['System Administrator']);