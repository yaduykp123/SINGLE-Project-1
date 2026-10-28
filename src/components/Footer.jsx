import { Link } from "react-router-dom";
import { Heart, Mail, MapPin } from "lucide-react";

const Footer = ({ isAuthenticated }) => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 dark:border-gray-800/80 bg-white dark:bg-[#080d16] text-gray-600 dark:text-gray-300 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Link to="/" className="inline-flex items-center gap-2.5 mb-3 group">
              <div className="relative w-10 h-10 rounded-2xl p-1 bg-gradient-to-br from-emerald-500/10 via-emerald-600/5 to-transparent border border-emerald-500/20 dark:from-emerald-500/20 dark:via-emerald-600/10 dark:border-emerald-500/30 shadow-md shadow-emerald-500/10 dark:shadow-emerald-500/20 group-hover:shadow-emerald-500/30 group-hover:border-emerald-500/50 transition-all duration-300 flex items-center justify-center shrink-0">
                <img
                  src="/Images/fresh-produce-clock.png"
                  alt="expireOFF"
                  className="w-full h-full object-contain filter drop-shadow group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <span className="text-xl font-black tracking-tight text-gray-900 dark:text-white font-['Outfit'] select-none">
                expire<span className="text-emerald-600 dark:text-emerald-400 ml-0.5 drop-shadow-[0_0_12px_rgba(52,211,153,0.45)]">OFF</span>
              </span>
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              A real-world community project connecting households and local shops to make surplus food more affordable and reduce avoidable waste.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-3">Explore</h2>
            <div className="flex flex-col items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Link to="/" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Home</Link>
              {isAuthenticated ? (
                <Link to="/offers" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Offers</Link>
              ) : (
                <Link to="/register" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Create an account</Link>
              )}
              <Link to="/login" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Login</Link>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-3">Our mission</h2>
            <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <p className="flex gap-2"><Heart size={16} className="mt-0.5 shrink-0 text-rose-500 dark:text-rose-400" />Save food. Support local communities.</p>
              <p className="flex gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />Discover nearby value before it goes to waste.</p>
              <a href="mailto:contact@expireoff.com" className="inline-flex items-center gap-2 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                <Mail size={16} className="text-emerald-600 dark:text-emerald-400" />contact@expireoff.com
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-5 border-t border-gray-100 dark:border-gray-800/80 flex flex-col sm:flex-row gap-2 justify-between text-xs text-gray-400 dark:text-gray-500">
          <p>© {year} expireOFF. Built for a more sustainable everyday life.</p>
          <p>Reduce waste • Save money • Strengthen communities</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
