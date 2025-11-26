import { Link } from 'react-router-dom';
import { Plane, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="glass-strong border-t border-white/20 dark:border-slate-700/20 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center space-x-2 mb-4 group">
              <Plane className="w-6 h-6 text-blue-600 dark:text-blue-400 transform group-hover:rotate-12 transition-transform" />
              <span className="text-xl font-display font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                TravelVerse
              </span>
            </Link>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Your journey begins here. Book flights, hotels, and cars with ease.
            </p>
            <div className="flex space-x-3">
              <a
                href="#"
                className="glass p-2 rounded-lg hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all transform hover:scale-110"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </a>
              <a
                href="#"
                className="glass p-2 rounded-lg hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all transform hover:scale-110"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5 text-blue-400 dark:text-blue-300" />
              </a>
              <a
                href="#"
                className="glass p-2 rounded-lg hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all transform hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              </a>
              <a
                href="#"
                className="glass p-2 rounded-lg hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all transform hover:scale-110"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5 text-blue-700 dark:text-blue-500" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/flights"
                  className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Search Flights
                </Link>
              </li>
              <li>
                <Link
                  to="/hotels"
                  className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Search Hotels
                </Link>
              </li>
              <li>
                <Link
                  to="/cars"
                  className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Rent a Car
                </Link>
              </li>
              <li>
                <Link
                  to="/my-bookings"
                  className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  My Bookings
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-display font-bold text-lg mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Help Center
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display font-bold text-lg mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-2 text-slate-600 dark:text-slate-400">
                <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>123 Travel Street, San Francisco, CA 94102</span>
              </li>
              <li className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                <Phone className="w-5 h-5 flex-shrink-0" />
                <span>(555) 123-4567</span>
              </li>
              <li className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                <Mail className="w-5 h-5 flex-shrink-0" />
                <span>support@travelverse.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 dark:border-slate-700/20 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            © {currentYear} TravelVerse. All rights reserved.
          </p>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Built with ❤️ for travelers worldwide
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

