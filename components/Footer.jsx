import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Quick Links Section */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">QUICK LINKS</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Our History</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Community Work</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Admin Portal</a></li>
            </ul>
          </div>

          {/* Services Section */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">SERVICES</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition-colors">ID Issuance</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Vital Events Registration</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Business Permits</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Social Court</a></li>
            </ul>
          </div>

          {/* Language Settings Section */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">LANGUAGE SETTINGS</h3>
            <ul className="space-y-2">
              <li><button className="hover:text-white transition-colors" suppressHydrationWarning={true}>English</button></li>
              <li><button className="hover:text-white transition-colors" suppressHydrationWarning={true}>Amharic </button></li>
            </ul>
          </div>

          {/* Support Section */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">SUPPORT</h3>
            <div className="space-y-2">
              <p>Help Desk: <span className="text-white font-medium">8080</span> (Toll Free)</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center text-sm">
          <div className="flex space-x-4 mb-4 sm:mb-0">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <span>|</span>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
          <div>
            <p>© 2024 Bosa Addis Kebele Administration. All Rights Reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;