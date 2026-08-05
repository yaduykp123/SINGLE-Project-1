import { Link } from "react-router-dom";
import { Heart, Leaf, Mail, MapPin } from "lucide-react";

const Footer = ({ isAuthenticated }) => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-800/80 bg-[#080d16] text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Leaf size={19} className="text-emerald-400" />
              </div>
              <span className="text-xl font-black tracking-tight text-white">
                expire<span className="text-emerald-400">OFF</span>
              </span>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-gray-400">
              A real-world community project connecting households and local shops to make surplus food more affordable and reduce avoidable waste.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-3">Explore</h2>
            <div className="flex flex-col items-start gap-2 text-sm">
              <Link to="/" className="hover:text-emerald-400 transition-colors">Home</Link>
              {isAuthenticated ? (
                <Link to="/offers" className="hover:text-emerald-400 transition-colors">Offers</Link>
              ) : (
                <Link to="/register" className="hover:text-emerald-400 transition-colors">Create an account</Link>
              )}
              <Link to="/login" className="hover:text-emerald-400 transition-colors">Login</Link>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-3">Our mission</h2>
            <div className="space-y-2 text-sm text-gray-400">
              <p className="flex gap-2"><Heart size={16} className="mt-0.5 shrink-0 text-rose-400" />Save food. Support local communities.</p>
              <p className="flex gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-emerald-400" />Discover nearby value before it goes to waste.</p>
              <a href="mailto:contact@expireoff.com" className="inline-flex items-center gap-2 hover:text-emerald-400 transition-colors">
                <Mail size={16} className="text-emerald-400" />contact@expireoff.com
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-5 border-t border-gray-800/80 flex flex-col sm:flex-row gap-2 justify-between text-xs text-gray-500">
          <p>© {year} expireOFF. Built for a more sustainable everyday life.</p>
          <p>Reduce waste • Save money • Strengthen communities</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
