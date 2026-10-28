import React, { useState, useEffect, useRef } from "react";
import axiosInstance from "../api/axiosInstance";
import {
  QrCode,
  Camera,
  X,
  Search,
  CheckCircle,
  AlertCircle,
  Loader2,
  Package,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";

const BarcodeScannerModal = ({ isOpen, onClose, onProductFound }) => {
  const [barcodeInput, setBarcodeInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setBarcodeInput("");
      setLookupResult(null);
      setErrorMsg("");
    }
  }, [isOpen]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setErrorMsg("");
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera access is not supported by your browser");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);

      // Check for native BarcodeDetector API (modern Chrome / Android)
      if ("BarcodeDetector" in window) {
        const barcodeDetector = new window.BarcodeDetector({
          formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"],
        });

        const scanFrame = async () => {
          if (!streamRef.current || !videoRef.current) return;
          try {
            const barcodes = await barcodeDetector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const detected = barcodes[0].rawValue;
              stopCamera();
              setBarcodeInput(detected);
              handleLookup(detected);
              return;
            }
          } catch {
            // Frame detection error, continue loop
          }
          if (streamRef.current) requestAnimationFrame(scanFrame);
        };
        requestAnimationFrame(scanFrame);
      }
    } catch (err) {
      setErrorMsg(err.message || "Could not start camera. Please enter barcode number below.");
      setIsCameraActive(false);
    }
  };

  const handleLookup = async (codeToSearch) => {
    const code = (codeToSearch || barcodeInput).trim();
    if (!code) {
      toast.error("Please enter a valid barcode");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setLookupResult(null);

    try {
      const res = await axiosInstance.get(`/inventory/barcode/${encodeURIComponent(code)}`);
      if (res.data.success && res.data.product) {
        setLookupResult(res.data.product);
        toast.success(`Found "${res.data.product.name}" in catalogue!`);
      } else {
        setErrorMsg(res.data.message || "Barcode not found in catalogue.");
        setLookupResult({ barcode: code, isNew: true });
      }
    } catch (err) {
      setErrorMsg("Lookup failed. Please verify network connectivity or enter details manually.");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (lookupResult) {
      onProductFound(lookupResult);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative text-gray-800 dark:text-gray-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <QrCode size={18} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Barcode Assisted Entry</h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
          Scan standard EAN/UPC barcodes or enter numbers directly to autofill product details.
        </p>

        {/* Camera Scanner View */}
        {isCameraActive ? (
          <div className="relative w-full h-56 bg-black rounded-2xl overflow-hidden mb-4 border border-emerald-500/40">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 border-2 border-emerald-400/60 rounded-xl m-8 pointer-events-none animate-pulse" />
            <button
              onClick={stopCamera}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gray-900/90 text-white text-xs font-semibold hover:bg-red-600 transition-all border border-gray-700"
            >
              Stop Camera
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={startCamera}
            className="w-full py-3 mb-4 rounded-2xl bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 hover:border-emerald-500/50 hover:bg-gray-100 dark:hover:bg-gray-900/70 text-gray-700 dark:text-gray-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm dark:shadow-inner"
          >
            <Camera size={16} className="text-emerald-600 dark:text-emerald-400" />
            <span>Open Camera Barcode Scanner</span>
          </button>
        )}

        {/* Manual Barcode Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLookup();
          }}
          className="flex items-center gap-2 mb-4"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="e.g. 8901030865489"
              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-emerald-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs transition-all flex items-center gap-1.5 shrink-0"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
            <span>Lookup</span>
          </button>
        </form>

        {/* Lookup Result Box */}
        {lookupResult && (
          <div className="bg-gray-50 dark:bg-gray-950/80 border border-emerald-500/30 rounded-2xl p-4 mb-4">
            {lookupResult.isNew ? (
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-600 dark:text-amber-300">New Barcode: {lookupResult.barcode}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    No verified catalogue entry found. You can assign this barcode to your new batch inventory.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  {lookupResult.image && (
                    <img
                      src={lookupResult.image}
                      alt={lookupResult.name}
                      className="w-14 h-14 object-cover rounded-xl border border-gray-200 dark:border-gray-800 shrink-0"
                    />
                  )}
                  <div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                      Catalogue Verified
                    </span>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mt-1 line-clamp-1">{lookupResult.name}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {lookupResult.brand && `${lookupResult.brand} • `}
                      {lookupResult.category} • {lookupResult.unit}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleApply}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <CheckCircle size={15} />
                  <span>Autofill Product & Batch</span>
                </button>
              </div>
            )}
          </div>
        )}

        {errorMsg && !lookupResult && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl p-3 flex items-start gap-2.5 mb-4 text-xs text-red-600 dark:text-red-300">
            <AlertCircle size={16} className="text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BarcodeScannerModal;
