import { useState, useEffect, useRef, useCallback, memo } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { createProduct, updateProduct } from "../redux/thunks/productThunks";
import { setFormOpen, setEditingProduct } from "../redux/slices/productSlice";
import { X, Upload, Search, Tag, Plus, Minus, Check, AlertCircle, Scan } from "lucide-react";
import BarcodeScannerModal from "./BarcodeScannerModal";
import {
  getProductNameError,
  getPriceError,
  getQuantityError,
  getStockError,
  getDescriptionError,
  getExpiryDateError,
  validateForm
} from "../utils/validation";
import toast from "react-hot-toast";

const CATEGORIES = [
  "Grocery Items",
  "Fruits",
  "Vegetables",
  "Meat/Fish",
  "Dairy",
  "Other",
];

const UNITS = ["kg", "g", "ltr", "ml", "units", "packs", "pieces","tray","dozen","bunch","bottle","box","packet"];

const PRODUCT_NAMES = {
  "Grocery Items": ["Rice", "Wheat Flour", "Sugar", "Salt", "Cooking Oil", "Pulses", "Spices", "Dal", "Tea"],
  "Fruits": ["Apples", "Bananas", "Oranges", "Mangoes", "Grapes", "Watermelon", "Papaya", "Guava"],
  "Vegetables": ["Tomatoes", "Potatoes", "Onions", "Carrots", "Spinach", "Cauliflower", "Brinjal", "Chili"],
  "Meat/Fish": ["Chicken", "Mutton", "Fish", "Prawns", "Eggs"],
  "Dairy": ["Milk", "Cheese", "Butter", "Yogurt", "Paneer", "Cream", "Ghee"],
  "Other": ["Bread", "Biscuits", "Noodles", "Snacks", "Chips", "Juice"],
};

const BRANDS = {
  "Grocery Items": ["Aashirvaad", "Fortune", "Tata Sampann", "MDH", "Catch", "India Gate","Local"],
  "Fruits": ["Organic", "Fresh", "Local Farm"],
  "Vegetables": ["Organic", "Fresh", "Local Farm"],
  "Meat/Fish": ["Fresho", "Zorabian", "Local"],
  "Dairy": ["Amul", "Mother Dairy", "Nestle", "Britannia","Local Farm"],
  "Other": ["Britannia", "Parle", "Maggi", "Sunfeast", "Lays"],
};

// MOVED OUTSIDE: FormInput is now a standalone memoized component
const FormInput = memo(({ label, name, type = "text", icon: Icon, placeholder, value, onChange, onBlur, error, touched, required, min, step }) => {
  const hasError = touched && error;
  const isValid = touched && !error && value && value.toString().trim() !== "";

  return (
    <div className="w-full">
      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
        {label} {required && <span className="text-emerald-600 dark:text-emerald-400">*</span>}
      </label>
      <div className="relative">
        {Icon && <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          min={min}
          step={step}
          className={`w-full bg-gray-50 dark:bg-gray-950/60 border rounded-xl py-3 text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none transition-all shadow-sm dark:shadow-inner ${
            Icon ? "pl-10" : "pl-3.5"
          } pr-10 ${
            hasError 
              ? "border-red-500/80 focus:ring-2 focus:ring-red-500/20" 
              : isValid
              ? "border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20"
              : "border-gray-300 dark:border-gray-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          }`}
        />
        {touched && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            {hasError ? (
              <AlertCircle size={15} className="text-red-500 dark:text-red-400" />
            ) : (
              <Check size={15} className="text-emerald-600 dark:text-emerald-400" />
            )}
          </div>
        )}
      </div>
      {hasError && (
        <p className="text-[11px] text-red-500 dark:text-red-400 mt-1 font-medium">{error}</p>
      )}
    </div>
  );
});
FormInput.displayName = "FormInput";

const ProductForm = () => {
  const dispatch = useDispatch();
  const { editingProduct, loading } = useSelector((state) => state.product);

  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    description: "",
    category: "Grocery Items",
    marketPrice: "",
    discountPrice: "",
    quantity: "",
    unit: "kg",
    stock: "1",
    expiryDate: "",
    barcode: "",
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageError, setImageError] = useState("");

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false);
  const [quickDiscount, setQuickDiscount] = useState(null);

  const nameRef = useRef(null);
  const brandRef = useRef(null);

  const handleBarcodeFound = useCallback((product) => {
    setFormData((prev) => ({
      ...prev,
      name: product.name || prev.name,
      brand: product.brand || prev.brand,
      category: product.category || prev.category,
      unit: product.unit || prev.unit,
      marketPrice: product.marketPrice ? product.marketPrice.toString() : prev.marketPrice,
      discountPrice: product.discountPrice ? product.discountPrice.toString() : prev.discountPrice,
      quantity: product.quantity ? product.quantity.toString() : prev.quantity,
      barcode: product.barcode || prev.barcode,
      description: product.description || prev.description,
    }));
    if (product.image && !imagePreview) {
      setImagePreview(product.image);
    }
    toast.success(`Autofilled details for "${product.name}"`);
  }, [imagePreview]);

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name || "",
        brand: editingProduct.brand || "",
        description: editingProduct.description || "",
        category: editingProduct.category || "Grocery Items",
        marketPrice: editingProduct.marketPrice?.toString() || "",
        discountPrice: editingProduct.discountPrice?.toString() || "",
        quantity: editingProduct.quantity?.toString() || "",
        unit: editingProduct.unit || "kg",
        stock: editingProduct.stock?.toString() || "1",
        expiryDate: editingProduct.expiryDate
          ? new Date(editingProduct.expiryDate).toISOString().split("T")[0]
          : "",
        barcode: editingProduct.barcode || "",
      });
      if (editingProduct.image) setImagePreview(editingProduct.image);
    }
  }, [editingProduct]);

  useEffect(() => {
    const handleClick = (e) => {
      if (!nameRef.current?.contains(e.target)) setShowNameSuggestions(false);
      if (!brandRef.current?.contains(e.target)) setShowBrandSuggestions(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const validateField = useCallback((name, value) => {
    switch (name) {
      case "name":
        return getProductNameError(value);
      case "marketPrice":
        return getPriceError(value, "Market Price");
      case "discountPrice":
        return getPriceError(value, "Discount Price");
      case "quantity":
        return getQuantityError(value);
      case "stock":
        return getStockError(value);
      case "expiryDate":
        return getExpiryDateError(value);
      case "description":
        return getDescriptionError(value);
      default:
        return null;
    }
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    setErrors(prev => {
      if (!prev[name]) return prev;
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  }, []);

  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  }, [validateField]);

  const pickName = useCallback((name) => {
    setFormData(prev => ({ ...prev, name }));
    setShowNameSuggestions(false);
    setTouched(prev => ({ ...prev, name: true }));
    setErrors(prev => ({ ...prev, name: getProductNameError(name) }));
  }, []);

  const pickBrand = useCallback((brand) => {
    setFormData(prev => ({ ...prev, brand }));
    setShowBrandSuggestions(false);
  }, []);

  const applyDiscount = useCallback((percent) => {
    setQuickDiscount(percent);
    setFormData(prev => {
      if (!prev.marketPrice) return prev;
      const marketPriceNum = parseFloat(prev.marketPrice);
      if (isNaN(marketPriceNum) || marketPriceNum <= 0) return prev;
      const discount = marketPriceNum * (1 - percent / 100);
      const discountStr = Math.round(discount).toString();
      return { ...prev, discountPrice: discountStr };
    });
    setTouched(prev => ({ ...prev, discountPrice: true }));
  }, []);

  const setQuantity = useCallback((qty) => {
    const qtyStr = qty.toString();
    setFormData(prev => ({ ...prev, quantity: qtyStr }));
    setTouched(prev => ({ ...prev, quantity: true }));
    setErrors(prev => ({ ...prev, quantity: getQuantityError(qtyStr) }));
  }, []);

  const changeStock = useCallback((delta) => {
    setFormData(prev => {
      const currentStock = parseInt(prev.stock) || 1;
      const newStock = Math.max(1, currentStock + delta);
      return { ...prev, stock: newStock.toString() };
    });
    setTouched(prev => ({ ...prev, stock: true }));
  }, []);

  const handleStockInput = useCallback((e) => {
    const value = e.target.value;
    if (value === "") {
      setFormData(prev => ({ ...prev, stock: "" }));
      return;
    }
    const num = parseInt(value);
    if (!isNaN(num) && num >= 1) {
      setFormData(prev => ({ ...prev, stock: value }));
    }
  }, []);

  const handleQuantityInput = useCallback((e) => {
    const value = e.target.value;
    if (value === "") {
      setFormData(prev => ({ ...prev, quantity: "" }));
      return;
    }
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      setFormData(prev => ({ ...prev, quantity: value }));
    }
  }, []);

  const setExpiry = useCallback((days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const dateStr = d.toISOString().split("T")[0];
    setFormData(prev => ({ ...prev, expiryDate: dateStr }));
    setTouched(prev => ({ ...prev, expiryDate: true }));
    setErrors(prev => ({ ...prev, expiryDate: getExpiryDateError(dateStr) }));
  }, []);

  const handleImage = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        toast.error("Only JPG, PNG, or WEBP images allowed");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image too large. Max 5MB allowed");
        return;
      }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();

    const allTouched = {
      name: true, marketPrice: true, discountPrice: true,
      quantity: true, stock: true, expiryDate: true
    };
    setTouched(allTouched);

    const newErrors = {
      name: getProductNameError(formData.name),
      marketPrice: getPriceError(formData.marketPrice, "Market Price"),
      discountPrice: getPriceError(formData.discountPrice, "Discount Price"),
      quantity: getQuantityError(formData.quantity),
      stock: getStockError(formData.stock),
      expiryDate: getExpiryDateError(formData.expiryDate),
      description: getDescriptionError(formData.description),
    };

    const mp = Number(formData.marketPrice);
    const dp = Number(formData.discountPrice);
    if (!isNaN(mp) && !isNaN(dp) && dp >= mp && mp > 0) {
      newErrors.discountPrice = "Discount price must be less than market price";
    }

    if (!UNITS.includes(formData.unit)) {
      newErrors.unit = `Invalid unit "${formData.unit}". Must be one of: ${UNITS.join(", ")}`;
    }

    setErrors(newErrors);

    const { isValid } = validateForm(newErrors);
    if (!isValid) {
      toast.error("Please fix the errors in the form");
      return;
    }

    if (!editingProduct && !image) {
      const errorMsg = "Product image is required. Please upload an image.";
      setImageError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    const data = new FormData();
    Object.keys(formData).forEach(k => data.append(k, formData[k]));
    if (image) data.append("image", image);

    dispatch(setFormOpen(false));
    dispatch(setEditingProduct(null));

    if (editingProduct) {
      const updatedProduct = {
        ...editingProduct,
        name: formData.name,
        brand: formData.brand || "",
        description: formData.description || "",
        category: formData.category,
        barcode: formData.barcode || "",
        marketPrice: Number(formData.marketPrice),
        discountPrice: Number(formData.discountPrice),
        quantity: Number(formData.quantity),
        unit: formData.unit,
        stock: Number(formData.stock),
        expiryDate: formData.expiryDate,
        ...(imagePreview ? { image: imagePreview } : {}),
      };
      dispatch(updateProduct(editingProduct._id, data, updatedProduct));
    } else {
      const tempProduct = {
        _id: "temp_" + Date.now(),
        name: formData.name,
        brand: formData.brand || "",
        description: formData.description || "",
        category: formData.category,
        barcode: formData.barcode || "",
        marketPrice: Number(formData.marketPrice),
        discountPrice: Number(formData.discountPrice),
        quantity: Number(formData.quantity),
        unit: formData.unit,
        stock: Number(formData.stock),
        expiryDate: formData.expiryDate,
        image: imagePreview || "",
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      dispatch(createProduct(data, tempProduct));
    }
  }, [formData, image, imagePreview, editingProduct, dispatch]);

  const handleClose = useCallback(() => {
    dispatch(setFormOpen(false));
    dispatch(setEditingProduct(null));
  }, [dispatch]);

  const names = PRODUCT_NAMES[formData.category] || [];
  const brands = BRANDS[formData.category] || [];

  return createPortal(
    <div className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-md flex items-center justify-center z-[9999] p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-2xl my-auto max-h-[90vh] flex flex-col shadow-2xl overflow-hidden backdrop-blur-2xl">

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-800/80 flex justify-between items-center bg-gray-50/80 dark:bg-gray-950/40 shrink-0">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
              <Tag size={17} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            {editingProduct ? "Edit Product" : "Post New Product"}
          </h2>
          <div className="flex items-center gap-2">
            {!editingProduct && (
              <button
                type="button"
                onClick={() => setShowBarcodeScanner(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm"
                title="Scan Barcode / QR to auto-fill details"
              >
                <Scan size={14} />
                <span className="hidden sm:inline">Scan Barcode</span>
                <span className="sm:hidden">Scan</span>
              </button>
            )}
            <button 
              onClick={handleClose} 
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Product Name */}
            <div className="sm:col-span-2 relative" ref={nameRef}>
              <FormInput
                label="Product Name"
                name="name"
                icon={Search}
                placeholder="Type or pick from list..."
                required
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.name}
                touched={touched.name}
                onFocus={() => setShowNameSuggestions(true)}
              />
              {showNameSuggestions && !editingProduct && (
                <div className="absolute z-20 w-full mt-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl max-h-40 overflow-y-auto">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 px-3.5 py-2 border-b border-gray-200 dark:border-gray-800/80 font-medium">Tap to select ↓</p>
                  {names.map(n => (
                    <button key={n} type="button" onClick={() => pickName(n)}
                      className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-gray-800 dark:text-gray-200 transition-colors">
                      {n}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Brand */}
            <div className="relative" ref={brandRef}>
              <FormInput
                label="Brand"
                name="brand"
                icon={Tag}
                placeholder="Type or pick..."
                value={formData.brand}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.brand}
                touched={touched.brand}
                onFocus={() => setShowBrandSuggestions(true)}
              />
              {showBrandSuggestions && !editingProduct && (
                <div className="absolute z-20 w-full mt-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl max-h-36 overflow-y-auto">
                  {brands.map(b => (
                    <button key={b} type="button" onClick={() => pickBrand(b)}
                      className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-gray-800 dark:text-gray-200 transition-colors">
                      {b}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Category <span className="text-emerald-600 dark:text-emerald-400">*</span></label>
              <select 
                name="category" 
                value={formData.category} 
                onChange={handleChange} 
                className="w-full bg-gray-50 dark:bg-gray-950/60 border border-gray-300 dark:border-gray-800 rounded-xl py-3 px-3.5 text-xs text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm dark:shadow-inner cursor-pointer"
              >
                {CATEGORIES.map(c => <option key={c} value={c} className="bg-white text-gray-900 dark:bg-gray-900 dark:text-white">{c}</option>)}
              </select>
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
              <textarea 
                name="description" 
                value={formData.description} 
                onChange={handleChange} 
                onBlur={handleBlur}
                rows={2} 
                className={`w-full bg-gray-50 dark:bg-gray-950/60 border rounded-xl p-3.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none transition-all shadow-sm dark:shadow-inner ${errors.description ? "border-red-500/80 focus:ring-2 focus:ring-red-500/20" : "border-gray-300 dark:border-gray-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"}`} 
                placeholder="About this product..."
              />
              {errors.description && <p className="text-[11px] text-red-500 dark:text-red-400 mt-1 font-medium">{errors.description}</p>}
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">{formData.description.length}/500 characters</p>
            </div>

            {/* Barcode / UPC (Optional) */}
            <div className="sm:col-span-2">
              <FormInput
                label="Barcode / GTIN / UPC (Optional)"
                name="barcode"
                icon={Scan}
                placeholder="Scan or enter 8-14 digit barcode"
                value={formData.barcode}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            </div>

            {/* Market Price */}
            <FormInput
              label="Market Price (₹)"
              name="marketPrice"
              type="number"
              placeholder="Original price"
              required
              min="0"
              step="0.01"
              value={formData.marketPrice}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.marketPrice}
              touched={touched.marketPrice}
            />

            {/* Discount Price */}
            <div>
              <FormInput
                label="Discount Price (₹)"
                name="discountPrice"
                type="number"
                placeholder="Selling price"
                required
                min="0"
                step="0.01"
                value={formData.discountPrice}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.discountPrice}
                touched={touched.discountPrice}
              />
              <div className="flex gap-2 mt-2">
                {[20, 30, 50].map(p => (
                  <button key={p} type="button" onClick={() => applyDiscount(p)}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${quickDiscount===p ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 shadow-inner' : 'bg-gray-100 dark:bg-gray-950/40 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:border-emerald-500/30 hover:text-gray-900 dark:hover:text-white'}`}>
                    {p}% off
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Quantity <span className="text-emerald-600 dark:text-emerald-400">*</span> <span className="text-gray-400 font-normal">(type or use buttons)</span>
              </label>
              <div className="flex items-center gap-2">
                <button 
                  type="button" 
                  onClick={() => {
                    const currentQty = parseFloat(formData.quantity) || 0;
                    if (currentQty > 0) {
                      const newQty = Math.max(0, currentQty - 1);
                      setQuantity(newQty);
                    }
                  }} 
                  className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-950/60 border border-gray-300 dark:border-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all shrink-0 cursor-pointer"
                >
                  <Minus size={14}/>
                </button>
                <input 
                  type="number" 
                  name="quantity" 
                  value={formData.quantity} 
                  onChange={handleQuantityInput}
                  onBlur={handleBlur}
                  required 
                  min="0" 
                  step="0.01"
                  placeholder="0.00"
                  className={`w-full bg-gray-50 dark:bg-gray-950/60 border rounded-xl py-3 text-xs text-gray-900 dark:text-white text-center placeholder-gray-400 dark:placeholder-gray-500 outline-none transition-all shadow-sm dark:shadow-inner ${errors.quantity ? "border-red-500/80 focus:ring-2 focus:ring-red-500/20" : "border-gray-300 dark:border-gray-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"}`}
                />
                <button 
                  type="button" 
                  onClick={() => {
                    const currentQty = parseFloat(formData.quantity) || 0;
                    setQuantity(currentQty + 1);
                  }} 
                  className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-950/60 border border-gray-300 dark:border-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all shrink-0 cursor-pointer"
                >
                  <Plus size={14}/>
                </button>
              </div>
              {errors.quantity && <p className="text-[11px] text-red-500 dark:text-red-400 mt-1 font-medium">{errors.quantity}</p>}

              <div className="flex gap-1.5 mt-2 flex-wrap">
                {[0.5, 1, 2, 5, 10].map(q => (
                  <button key={q} type="button" onClick={() => setQuantity(q)} 
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-950/40 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:border-emerald-500/30 hover:text-gray-900 dark:hover:text-white transition-all cursor-pointer">
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Unit */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Unit <span className="text-emerald-600 dark:text-emerald-400">*</span></label>
              <select name="unit" value={formData.unit} onChange={handleChange} className="w-full bg-gray-50 dark:bg-gray-950/60 border border-gray-300 dark:border-gray-800 rounded-xl py-3 px-3.5 text-xs text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm dark:shadow-inner cursor-pointer">
                {UNITS.map(u => <option key={u} value={u} className="bg-white text-gray-900 dark:bg-gray-900 dark:text-white">{u}</option>)}
              </select>
            </div>

            {/* Stock */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Stock <span className="text-emerald-600 dark:text-emerald-400">*</span> <span className="text-gray-400 font-normal">(type or use buttons)</span>
              </label>
              <div className="flex items-center gap-2">
                <button 
                  type="button" 
                  onClick={() => changeStock(-1)} 
                  className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-950/60 border border-gray-300 dark:border-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all shrink-0 cursor-pointer"
                >
                  <Minus size={14}/>
                </button>
                <input 
                  type="number" 
                  name="stock" 
                  value={formData.stock} 
                  onChange={handleStockInput}
                  onBlur={handleBlur}
                  required 
                  min="1" 
                  placeholder="1"
                  className={`w-full bg-gray-50 dark:bg-gray-950/60 border rounded-xl py-3 text-xs text-gray-900 dark:text-white text-center placeholder-gray-400 dark:placeholder-gray-500 outline-none transition-all shadow-sm dark:shadow-inner ${errors.stock ? "border-red-500/80 focus:ring-2 focus:ring-red-500/20" : "border-gray-300 dark:border-gray-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"}`}
                />
                <button 
                  type="button" 
                  onClick={() => changeStock(1)} 
                  className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-950/60 border border-gray-300 dark:border-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all shrink-0 cursor-pointer"
                >
                  <Plus size={14}/>
                </button>
              </div>
              {errors.stock && <p className="text-[11px] text-red-500 dark:text-red-400 mt-1 font-medium">{errors.stock}</p>}
            </div>

            {/* Expiry Date */}
            <div>
              <FormInput
                label="Expiry Date"
                name="expiryDate"
                type="date"
                required
                min={new Date().toISOString().split("T")[0]}
                value={formData.expiryDate}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.expiryDate}
                touched={touched.expiryDate}
              />
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {[{l:"+3 Days",d:3},{l:"+7 Days",d:7},{l:"+30 Days",d:30}].map(o => (
                  <button key={o.d} type="button" onClick={() => setExpiry(o.d)} 
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all cursor-pointer">
                    {o.l}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Image */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Product Image {!editingProduct && <span className="text-red-500 dark:text-red-400 font-bold">*</span>}
              </label>
              <div className="flex items-center gap-4">
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-20 h-20 object-cover rounded-xl border border-gray-200 dark:border-gray-800 shadow-md shrink-0"
                  />
                )}
                <label
                  className={`flex-1 flex items-center justify-center gap-2 p-4 bg-gray-50 dark:bg-gray-950/40 border border-dashed rounded-2xl cursor-pointer transition-all group ${
                    imageError
                      ? "border-red-500 bg-red-500/10 ring-2 ring-red-500/20"
                      : "border-gray-300 dark:border-gray-700 hover:border-emerald-500/50"
                  }`}
                >
                  <Upload
                    size={18}
                    className={
                      imageError
                        ? "text-red-500 dark:text-red-400"
                        : "text-gray-400 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors"
                    }
                  />
                  <span
                    className={`text-xs font-semibold ${
                      imageError
                        ? "text-red-500 dark:text-red-400 font-bold"
                        : "text-gray-700 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-white transition-colors"
                    }`}
                  >
                    {image ? "Change Image" : "Upload Product Image *"}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImage}
                    className="hidden"
                  />
                </label>
              </div>
              {imageError ? (
                <div className="flex items-center gap-2 mt-2 text-xs font-bold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/15 border border-red-300 dark:border-red-500/40 px-3.5 py-2.5 rounded-xl shadow-sm">
                  <AlertCircle size={16} className="shrink-0 text-red-500 dark:text-red-400" />
                  <span>{imageError}</span>
                </div>
              ) : (
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                  JPG, PNG, WEBP up to 15MB
                </p>
              )}
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-800/80 sticky bottom-0 bg-white/95 dark:bg-gray-900/90 backdrop-blur-md pb-1">
            <button 
              type="button" 
              onClick={handleClose} 
              className="flex-1 py-3 px-4 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold transition-all border border-gray-200 dark:border-gray-700/60 cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-lg shadow-emerald-600/20 border border-emerald-500/30 disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Saving..." : editingProduct ? "Update Product" : "Post Product"}
            </button>
          </div>
        </form>
      </div>

      <BarcodeScannerModal
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onProductFound={handleBarcodeFound}
      />
    </div>,
    document.body
  );
};

export default ProductForm;