'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

const Contact = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    houseNumber: '',
    subject: 'Service Inquiry',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);
    
    // Simulate API call - replace with your actual API endpoint
    try {
      // Example API call (uncomment when you have your API ready)
      // const response = await fetch('/api/contact', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // });
      
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubmitStatus({ type: 'success', message: 'Thank you for your message! We will get back to you soon.' });
      setFormData({
        fullName: '',
        houseNumber: '',
        subject: 'Service Inquiry',
        message: '',
      });
    } catch (error) {
      setSubmitStatus({ type: 'error', message: 'Something went wrong. Please try again later.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Coordinates for Bosa Addis Kebele office (Addis Ababa)
  const officePosition = [9.0227, 38.7468];

  return (
    <div id="contact" className="min-h-screen bg-gray-50 mt-20">
      {/* Header */}
      <div className=" py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-2 text-black">Get In Touch</h1>
          <p className="text-blue-500">We're here to help and answer any questions you might have</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Send us a Message</h2>
            
            {submitStatus && (
              <div className={`mb-6 p-4 rounded-lg ${
                submitStatus.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {submitStatus.message}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-5" suppressHydrationWarning={true}>
              {/* Full Name */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  required
                  disabled={isSubmitting}
                  suppressHydrationWarning={true}
                />
              </div>

              {/* House Number */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">House Number</label>
                <input
                  type="text"
                  name="houseNumber"
                  value={formData.houseNumber}
                  onChange={handleChange}
                  placeholder="e.g. 102/B"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  disabled={isSubmitting}
                  suppressHydrationWarning={true}
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">Subject</label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  disabled={isSubmitting}
                  suppressHydrationWarning={true}
                >
                  <option>Service Inquiry</option>
                  <option>ID Issuance</option>
                  <option>Business Permit</option>
                  <option>Vital Events Registration</option>
                  <option>Social Court</option>
                  <option>General Complaint</option>
                </select>
              </div>

              {/* Message */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="How can we help you today?"
                  rows="5"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
                  required
                  disabled={isSubmitting}
                  suppressHydrationWarning={true}
                ></textarea>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                suppressHydrationWarning={true}
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>

          {/* Office Information & Map */}
          <div className="space-y-6">
            {/* Address Card */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">JIMMA,OROMIA</h3>
                <p className="text-gray-600 text-lg">ጂማ,ኦሮሚያ</p>
              </div>
            </div>

            {/* Contact Details Card */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Visit Our Office</h3>
              <p className="text-gray-600 mb-4">
                Woreda 03, Bosa Addis Neighborhood, near the Central Community Hall.
              </p>
              <div className="space-y-2">
                <p className="flex items-center text-gray-700">
                  <span className="text-blue-600 mr-3">📞</span>
                  <a href="tel:+251111234567" className="hover:text-blue-600 transition">+251 11 123 4567</a>
                </p>
                <p className="flex items-center text-gray-700">
                  <span className="text-blue-600 mr-3">✉️</span>
                  <a href="mailto:info@bosaaddiskebele.gov.et" className="hover:text-blue-600 transition">info@bosaaddiskebele.gov.et</a>
                </p>
              </div>
            </div>

            {/* Leaflet Map */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="h-80 w-full">
                <MapContainer
                  center={officePosition}
                  zoom={14}
                  scrollWheelZoom={true}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={officePosition}>
                    <Popup>
                      <div className="text-center">
                        <strong>Bosa Addis Kebele</strong><br />
                        Woreda 03, Bosa Addis Neighborhood<br />
                        Near Central Community Hall
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;