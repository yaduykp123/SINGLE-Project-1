import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateUserLocation as updateLocationThunk } from "../redux/thunks/authThunks";
import { MapPin, ChevronDown, Loader2, Crosshair } from "lucide-react";
import toast from "react-hot-toast";
import LocationPicker from "./LocationPicker";

const LocationDetector = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [detecting, setDetecting] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const detectLocationByIpFallback = async () => {
    try {
      const res = await fetch("https://ipapi.co/json/");
      if (res.ok) {
        const data = await res.json();
        if (data && data.city && data.city !== "Not found") {
          dispatch(
            updateLocationThunk({
              latitude: data.latitude || 0,
              longitude: data.longitude || 0,
              city: data.city,
              state: data.region || "",
              country: data.country_name || "",
            })
          );
          setDetecting(false);
          toast.success(`Location set to ${data.city}!`);
          return true;
        }
      }
    } catch (e) {}

    try {
      const res = await fetch("https://geolocation-db.com/json/");
      if (res.ok) {
        const data = await res.json();
        if (data && data.city && data.city !== "Not found") {
          dispatch(
            updateLocationThunk({
              latitude: data.latitude || 0,
              longitude: data.longitude || 0,
              city: data.city,
              state: data.state || "",
              country: data.country_name || "",
            })
          );
          setDetecting(false);
          toast.success(`Location set to ${data.city}!`);
          return true;
        }
      }
    } catch (e) {}

    setDetecting(false);
    return false;
  };

  const extractCityFromAddress = (address) => {
    if (!address) return "";
    const city =
      address.neighbourhood ||
      address.suburb ||
      address.village ||
      address.town ||
      address.city ||
      address.municipality ||
      address.city_district ||
      address.district ||
      address.county ||
      address.state_district ||
      "";
    return city.replace(/\s+Taluk$/i, "").replace(/\s+District$/i, "").trim();
  };

  const saveCoordinatesAndGeocode = async (position) => {
    const { latitude, longitude } = position.coords;

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            "User-Agent": "expireOff-app/1.0 (contact@expireoff.com)",
          },
        }
      );
      const data = await res.json();
      const address = data.address || {};
      const detectedCity = extractCityFromAddress(address);

      if (detectedCity) {
        const locationData = {
          latitude,
          longitude,
          city: detectedCity,
          state: address.state || "",
          country: address.country || "",
        };

        dispatch(updateLocationThunk(locationData));
        toast.success(`Location set to ${detectedCity}!`);
      } else {
        await detectLocationByIpFallback();
      }
    } catch (error) {
      await detectLocationByIpFallback();
    }
    setDetecting(false);
  };

  const detectLocation = () => {
    setDetecting(true);

    if (!navigator.geolocation) {
      detectLocationByIpFallback();
      return;
    }

    // 1. Try High Accuracy GPS / Wi-Fi positioning first
    navigator.geolocation.getCurrentPosition(
      saveCoordinatesAndGeocode,
      (firstError) => {
        // 2. If high accuracy fails or times out, try standard accuracy
        navigator.geolocation.getCurrentPosition(
          saveCoordinatesAndGeocode,
          (secondError) => {
            // 3. Fallback silently to IP lookup without opening modal
            detectLocationByIpFallback();
          },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 0 }
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <button
          onClick={detectLocation}
          disabled={detecting}
          className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium disabled:opacity-50"
        >
          {detecting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Crosshair size={16} />
          )}
          {detecting ? "Detecting..." : "Detect My Location"}
        </button>

        {/* Manual selection button */}
        <button
          onClick={() => setShowPicker(true)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 font-medium"
        >
          <MapPin size={16} />
          <span>Select Location Manually</span>
          <ChevronDown size={14} />
        </button>
      </div>

      {/* Location Picker Modal */}
      <LocationPicker isOpen={showPicker} onClose={() => setShowPicker(false)} />
    </>
  );
};

export default LocationDetector;