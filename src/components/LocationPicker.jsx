import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { updateUserLocation } from "../redux/thunks/authThunks";
import { MapPin, Search, X, Loader2, Navigation } from "lucide-react";
import toast from "react-hot-toast";

// Famous Indian cities with coordinates
const FAMOUS_CITIES = [
  { name: "Kakancheri", state: "Kerala", country: "India", lat: 11.1643, lng: 75.8943 },
  { name: "Kozhikode", state: "Kerala", country: "India", lat: 11.2588, lng: 75.7804 },
  { name: "Malappuram", state: "Kerala", country: "India", lat: 11.0732, lng: 76.0740 },
  { name: "Kochi", state: "Kerala", country: "India", lat: 9.9312, lng: 76.2673 },
  { name: "Thiruvananthapuram", state: "Kerala", country: "India", lat: 8.5241, lng: 76.9366 },
  { name: "Delhi", state: "Delhi", country: "India", lat: 28.6139, lng: 77.2090 },
  { name: "Mumbai", state: "Maharashtra", country: "India", lat: 19.0760, lng: 72.8777 },
  { name: "Bangalore", state: "Karnataka", country: "India", lat: 12.9716, lng: 77.5946 },
  { name: "Chennai", state: "Tamil Nadu", country: "India", lat: 13.0827, lng: 80.2707 },
  { name: "Kolkata", state: "West Bengal", country: "India", lat: 22.5726, lng: 88.3639 },
  { name: "Hyderabad", state: "Telangana", country: "India", lat: 17.3850, lng: 78.4867 },
  { name: "Pune", state: "Maharashtra", country: "India", lat: 18.5204, lng: 73.8567 },
  { name: "Ahmedabad", state: "Gujarat", country: "India", lat: 23.0225, lng: 72.5714 },
  { name: "Jaipur", state: "Rajasthan", country: "India", lat: 26.9124, lng: 75.7873 },
  { name: "Surat", state: "Gujarat", country: "India", lat: 21.1702, lng: 72.8311 },
  { name: "Lucknow", state: "Uttar Pradesh", country: "India", lat: 26.8467, lng: 80.9462 },
];

const LocationPicker = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  const [activeTab, setActiveTab] = useState("popular"); // "popular" | "search"
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const searchTimeout = useRef(null);

  // Search with Nominatim (OpenStreetMap)
  const handleSearch = async (query) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
        {
          headers: {
            "User-Agent": "expireOff-app/1.0 (contact@expireoff.com)",
          },
        }
      );
      const data = await res.json();
      setSearchResults(data);
    } catch (error) {
      toast.error("City search unavailable. Please check connection and try again.");
    } finally {
      setSearching(false);
    }
  };

  // Debounce search input
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      if (searchQuery) handleSearch(searchQuery);
    }, 500);
    return () => clearTimeout(searchTimeout.current);
  }, [searchQuery]);

  // Save location
  const handleSelectLocation = async (locationData) => {
    setSaving(true);
    try {
      await dispatch(updateUserLocation(locationData));
      toast.success(`Location set to ${locationData.city}!`);
      onClose();
    } catch (error) {
      toast.error("Failed to update location");
    } finally {
      setSaving(false);
    }
  };

  // Handle popular city selection
  const selectPopularCity = (city) => {
    handleSelectLocation({
      city: city.name,
      state: city.state,
      country: city.country,
      latitude: city.lat,
      longitude: city.lng,
    });
  };

  // Handle search result selection
  const selectSearchResult = (result) => {
    const address = result.address || {};
    handleSelectLocation({
      city: address?.city || address?.town || address?.village || result?.name || "",
      state: address?.state || "",
      country: address?.country || "",
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    });
  };

  if (!isOpen) return null;

  return createPortal(
    /* Increased z-index to 9999 to guarantee it sits above sticky navbars and product cards */
    <div className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-md flex items-center justify-center z-[9999] p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-md my-auto max-h-[90vh] flex flex-col shadow-2xl overflow-hidden backdrop-blur-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-800/80 flex items-center justify-between bg-gray-50/80 dark:bg-gray-950/40 shrink-0">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
              <MapPin size={17} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            Select Location
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-800/80 bg-gray-50/50 dark:bg-gray-950/20 px-3 pt-3 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab("popular")}
            className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === "popular"
                ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 shadow-sm dark:shadow-inner"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50 border border-transparent"
            }`}
          >
            Popular Cities
          </button>
          <button
            onClick={() => setActiveTab("search")}
            className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === "search"
                ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 shadow-sm dark:shadow-inner"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50 border border-transparent"
            }`}
          >
            Search
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 custom-scrollbar">
          {activeTab === "popular" ? (
            <div className="grid grid-cols-1 gap-2.5">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">
                Choose from popular cities:
              </p>
              {FAMOUS_CITIES.map((city) => (
                <button
                  key={city.name}
                  onClick={() => selectPopularCity(city)}
                  disabled={saving}
                  className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-gray-50/70 dark:bg-gray-950/40 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border border-gray-200 dark:border-gray-800 hover:border-emerald-300 dark:hover:border-emerald-500/30 transition-all text-left group cursor-pointer"
                >
                  <div className="w-9 h-9 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/20 group-hover:border-emerald-300 dark:group-hover:border-emerald-500/30 transition-all shrink-0 shadow-xs">
                    <Navigation size={16} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">{city.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{city.state}</p>
                  </div>
                  {saving && (
                    <Loader2 size={16} className="animate-spin text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div>
              {/* Search Input */}
              <div className="relative mb-4">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search city, area, or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-950/60 border border-gray-300 dark:border-gray-800 rounded-xl py-3 pl-10 pr-10 text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm dark:shadow-inner"
                />
                {searching && (
                  <Loader2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-emerald-600 dark:text-emerald-400" />
                )}
              </div>

              {/* Search Results */}
              <div className="space-y-2">
                {searchResults.length === 0 && searchQuery.length >= 2 && !searching && (
                  <p className="text-center text-gray-400 text-xs py-8">No results found</p>
                )}
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => selectSearchResult(result)}
                    disabled={saving}
                    className="w-full flex items-start gap-3.5 p-3.5 rounded-2xl bg-gray-50/70 dark:bg-gray-950/40 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border border-gray-200 dark:border-gray-800 hover:border-emerald-300 dark:hover:border-emerald-500/30 transition-all text-left group cursor-pointer"
                  >
                    <div className="w-8 h-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/20 group-hover:border-emerald-300 dark:group-hover:border-emerald-500/30 transition-all mt-0.5 shrink-0 shadow-xs">
                      <MapPin size={15} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white text-xs group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors leading-relaxed">
                        {result.display_name || result.name || "Unknown location"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800/80 bg-gray-50/80 dark:bg-gray-950/60 shrink-0">
          <p className="text-[11px] text-gray-500 dark:text-gray-400 text-center font-medium">
            You can also use "Detect My Location" for automatic GPS detection
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default LocationPicker;