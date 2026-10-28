import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { fetchProductById } from "../redux/thunks/productThunks";
import { fetchCart } from "../redux/thunks/cartThunks";
import RazorpayButton from "../components/RazorpayButton";
import { useSearchParams } from "react-router-dom";
import axiosInstance from "../api/axiosInstance"; // if not already imported
import { MapPin, Phone, Mail, User, Home, ArrowLeft, Minus, Plus, AlertTriangle, Check, X, Leaf, ShieldCheck, Package, Truck, Navigation, Layers, Sparkles, Store } from "lucide-react";
import ProductImage from "../components/ProductImage";
import { getDeliveryTimeInfo } from "../utils/deliveryCalculator";
import { saveRecentlyViewedProduct } from "../utils/recentlyViewed";
import {
  getEmailError,
  getPhoneError,
  getPincodeError,
  getStreetError,
  getCityError,
  getStateError,
  validateForm,
} from "../utils/validation";
import toast from "react-hot-toast";

// MOVED OUTSIDE: AddressInput is now a standalone component with light/dark-mode styling
const AddressInput = ({
  name,
  type = "text",
  icon: Icon,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  touched,
  maxLength,
  inputMode,
}) => {
  const hasError = touched && error;
  const isValid = touched && !error && value;

  return (
    <div className="w-full">
      <div className="relative">
        {Icon && (
          <Icon
            size={16}
            className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
              hasError
                ? "text-red-500"
                : isValid
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-gray-400 dark:text-gray-500"
            }`}
          />
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          maxLength={maxLength}
          inputMode={inputMode}
          required
          className={`w-full bg-white dark:bg-gray-950/60 border rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none backdrop-blur-xl transition-all shadow-xs py-3 ${
            Icon ? "pl-10" : "pl-4"
          } pr-10 ${
            hasError
              ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              : isValid
                ? "border-emerald-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                : "border-gray-200 dark:border-gray-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          }`}
        />
        {touched && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            {hasError ? (
              <X size={15} className="text-red-500" />
            ) : (
              <Check size={15} className="text-emerald-600 dark:text-emerald-400" />
            )}
          </div>
        )}
      </div>
      {hasError && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1 font-medium">
          <X size={11} /> {error}
        </p>
      )}
    </div>
  );
};

const Checkout = () => {
  const { id } = useParams();
  const isCartMode = id === "cart";
  const isComboMode = id === "combo";
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { currentProduct, loading } = useSelector((state) => state.product);
  const { cart } = useSelector((state) => state.cart);
  const [quantity, setQuantity] = useState(1);

  const [searchParams] = useSearchParams();
  const offerId = searchParams.get("offerId");
  const comboId = searchParams.get("comboId");
  const [activeOffer, setActiveOffer] = useState(null);
  const [comboOffer, setComboOffer] = useState(null);
  const [comboLoading, setComboLoading] = useState(false);

  const isExpired = isComboMode
    ? Boolean(
        comboOffer?.expiresAt &&
          new Date(comboOffer.expiresAt) <= new Date()
      )
    : isCartMode
    ? cart?.items?.some((item) => {
        const prod =
          typeof item.product === "object" && item.product !== null
            ? item.product
            : {};
        return prod?.expiryDate && new Date(prod.expiryDate) <= new Date();
      })
    : Boolean(
        currentProduct?.expiryDate &&
          new Date(currentProduct.expiryDate) <= new Date()
      );

  useEffect(() => {
    if (isComboMode && comboId) {
      setComboLoading(true);
      axiosInstance
        .get(`/offers/${comboId}`)
        .then((res) => {
          if (res.data?.success && res.data.offer) {
            setComboOffer(res.data.offer);
          }
        })
        .catch(() => {
          toast.error("Unable to load combo package details");
        })
        .finally(() => {
          setComboLoading(false);
        });
    } else if (offerId && currentProduct && !isCartMode) {
      axiosInstance
        .get(`/offers/${offerId}`)
        .then((res) => {
          if (res.data?.success) setActiveOffer(res.data.offer);
        })
        .catch(() => setActiveOffer(null));
    }
  }, [offerId, currentProduct, isCartMode, isComboMode, comboId]);

  useEffect(() => {
    if (isCartMode) {
      dispatch(fetchCart());
    } else if (id && !isComboMode) {
      dispatch(fetchProductById(id));
    }
  }, [dispatch, id, isCartMode, isComboMode]);

  const [shippingAddress, setShippingAddress] = useState({
    name: "",
    phone: "",
    email: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isPrefilled, setIsPrefilled] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [saveToProfile, setSaveToProfile] = useState(false);
  const [addressLabel, setAddressLabel] = useState("Home");

  useEffect(() => {
    if (user) {
      axiosInstance
        .get("/users/addresses")
        .then((res) => {
          if (res.data?.success && Array.isArray(res.data.addresses)) {
            setSavedAddresses(res.data.addresses);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const selectSavedAddress = (addr) => {
    setShippingAddress((prev) => ({
      ...prev,
      street: addr.street || "",
      city: addr.city || "",
      state: addr.state || "",
      pincode: addr.pincode || "",
    }));
    setTouched((prev) => ({
      ...prev,
      street: true,
      city: true,
      state: true,
      pincode: true,
    }));
    toast.success(`Selected "${addr.label}" address`);
  };

  useEffect(() => {
    if (isCartMode) {
      dispatch(fetchCart());
    } else if (id) {
      dispatch(fetchProductById(id));
    }
  }, [dispatch, id, isCartMode]);

  //  Save product to Recently Viewed
  useEffect(() => {
    if (currentProduct && currentProduct._id) {
      saveRecentlyViewedProduct(currentProduct);
    }
  }, [currentProduct]);

  useEffect(() => {
    if (user && !isPrefilled) {
      let savedAddress = null;
      try {
        const raw = localStorage.getItem("savedShippingAddress");
        if (raw) savedAddress = JSON.parse(raw);
      } catch (err) {
        savedAddress = null;
      }

      const prefilled = {
        name: savedAddress?.name || user.fullName || "",
        phone: savedAddress?.phone || user.phone || "",
        email: savedAddress?.email || user.email || "",
        street: savedAddress?.street || user.street || user.address || "",
        city: savedAddress?.city || user.city || "",
        state: savedAddress?.state || user.state || "",
        pincode: savedAddress?.pincode || user.pincode || "",
      };
      setShippingAddress(prefilled);
      setIsPrefilled(true);
    }
  }, [user, isPrefilled]);

  const validateField = useCallback((name, value) => {
    switch (name) {
      case "name":
        return !value
          ? "Full name is required"
          : value.length < 2
            ? "Name too short"
            : null;
      case "email":
        return getEmailError(value);
      case "phone":
        return getPhoneError(value);
      case "street":
        return getStreetError(value);
      case "city":
        return getCityError(value);
      case "state":
        return getStateError(value);
      case "pincode":
        return getPincodeError(value);
      default:
        return null;
    }
  }, []);

  const handleAddressChange = useCallback((e) => {
    const { name, value } = e.target;
    let processedValue = value;

    if (name === "phone") {
      let clean = value.replace(/[^\d+]/g, "");
      if (clean.indexOf("+") > 0) {
        clean = clean.replace(/\+/g, "");
      }
      const maxLimit = clean.startsWith("+91") ? 13 : 10;
      processedValue = clean.slice(0, maxLimit);
    } else if (name === "pincode") {
      processedValue = value.replace(/\D/g, "").slice(0, 6);
    }

    setShippingAddress((prev) => {
      const updated = { ...prev, [name]: processedValue };
      try {
        localStorage.setItem("savedShippingAddress", JSON.stringify(updated));
      } catch (err) {}
      return updated;
    });

    setErrors((prev) => {
      if (!prev[name]) return prev;
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  }, []);

  const handleBlur = useCallback(
    (e) => {
      const { name, value } = e.target;
      setTouched((prev) => ({ ...prev, [name]: true }));
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    },
    [validateField],
  );

  const handleQuantityChange = useCallback(
    (delta) => {
      setQuantity((prev) => {
        const newQty = prev + delta;
        if (newQty >= 1 && newQty <= (currentProduct?.stock || 1)) {
          return newQty;
        }
        return prev;
      });
    },
    [currentProduct?.stock],
  );

  const handleOrderSuccess = useCallback((confirmedOrder) => {
    // Non-blocking background address save
    if (saveToProfile && shippingAddress.street && shippingAddress.city && shippingAddress.pincode) {
      axiosInstance.post("/users/addresses", {
        label: addressLabel,
        street: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.state,
        pincode: shippingAddress.pincode,
        isDefault: savedAddresses.length === 0,
      }).catch(() => {});
    }

    const targetOrderId = confirmedOrder?._id || confirmedOrder?.orderId;
    if (targetOrderId) {
      navigate(`/orders?orderId=${targetOrderId}`);
    } else {
      navigate("/orders");
    }
  }, [navigate, saveToProfile, shippingAddress, addressLabel, savedAddresses.length]);

  const isShippingValid = useCallback(() => {
    const allTouched = {
      name: true,
      email: true,
      phone: true,
      street: true,
      city: true,
      state: true,
      pincode: true,
    };
    setTouched(allTouched);

    const newErrors = {
      name: validateField("name", shippingAddress.name),
      email: validateField("email", shippingAddress.email),
      phone: validateField("phone", shippingAddress.phone),
      street: validateField("street", shippingAddress.street),
      city: validateField("city", shippingAddress.city),
      state: validateField("state", shippingAddress.state),
      pincode: validateField("pincode", shippingAddress.pincode),
    };
    setErrors(newErrors);

    const { isValid } = validateForm(newErrors);
    if (!isValid) {
      toast.error("Please fill all shipping details correctly");
    }
    return isValid;
  }, [shippingAddress, validateField]);

  if (isComboMode && (comboLoading || !comboOffer)) {
    return (
      <div className="min-h-screen bg-[#f8faf9] dark:bg-[#0b0f19] flex items-center justify-center transition-colors duration-200">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!isCartMode && !isComboMode && (loading || !currentProduct)) {
    return (
      <div className="min-h-screen bg-[#f8faf9] dark:bg-[#0b0f19] flex items-center justify-center transition-colors duration-200">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  if (isCartMode && (!cart || !cart.items || cart.items.length === 0)) {
    return (
      <div className="min-h-screen bg-[#f8faf9] text-gray-900 dark:bg-[#0b0f19] dark:text-gray-100 flex items-center justify-center p-4 transition-colors duration-200">
        <div className="bg-white border border-gray-200 dark:bg-gray-900/60 dark:border-gray-800/80 backdrop-blur-xl text-center py-16 px-8 rounded-2xl shadow-sm dark:shadow-xl max-w-md w-full">
          <Package size={40} className="text-emerald-600 dark:text-emerald-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Your Cart is Empty</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Add items to your cart before proceeding to checkout.</p>
          <button
            onClick={() => navigate("/products")}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  const getComboOriginalPrice = () => {
    if (!comboOffer?.products) return 0;
    return comboOffer.products.reduce(
      (sum, p) => sum + (p.marketPrice || p.discountPrice || 0),
      0
    );
  };

  const getComboUnitPrice = () => {
    if (!comboOffer?.products) return 0;
    const baseTotal = comboOffer.products.reduce(
      (sum, p) => sum + (p.discountPrice || p.marketPrice || 0),
      0
    );
    return Math.max(
      1,
      Math.round(baseTotal * (1 - comboOffer.discountPercentage / 100))
    );
  };

  const getUnitPrice = () => {
    if (!currentProduct) return 0;
    if (
      activeOffer &&
      activeOffer.products.some(
        (p) => p._id === currentProduct._id || p === currentProduct._id,
      )
    ) {
      const base = currentProduct.discountPrice || currentProduct.marketPrice;
      return Math.max(
        1,
        Math.round(base * (1 - activeOffer.discountPercentage / 100)),
      );
    }
    return currentProduct.discountPrice;
  };

  const unitPrice = getUnitPrice();
  const totalAmount = isComboMode
    ? getComboUnitPrice() * quantity
    : isCartMode
    ? (cart?.totalAmount || 0)
    : unitPrice * quantity;
  const discountPercent = currentProduct
    ? Math.round(((currentProduct.marketPrice - unitPrice) / currentProduct.marketPrice) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-[#f8faf9] text-gray-900 dark:bg-[#0b0f19] dark:text-gray-100 p-4 md:p-8 relative overflow-hidden selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      <div className="max-w-6xl mx-auto relative z-10">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-700 dark:hover:text-emerald-400 mb-6 transition-colors font-medium cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Details or Cart Items */}
          <div>
            {isComboMode ? (
              <div className="bg-white border border-gray-200/90 shadow-sm dark:bg-gray-900/60 dark:border-gray-800/80 backdrop-blur-xl rounded-2xl p-6 dark:shadow-xl space-y-5">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-50 text-purple-800 border border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30 mb-2">
                      <Layers size={13} />
                      <span>Combo Pack • Bundle Offer</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                      {comboOffer?.title}
                    </h1>
                    <p className="text-xs text-gray-400 mt-1">
                      {comboOffer?.description}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-2xl font-black text-emerald-400">
                      ₹{getComboUnitPrice()}
                    </span>
                    <span className="block text-xs text-gray-500 line-through">
                      ₹{getComboOriginalPrice()}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs uppercase font-bold text-gray-400 tracking-wider">
                      Included Products ({comboOffer?.products?.length || 0})
                    </h3>
                    <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                      {comboOffer?.discountPercentage}% Package Savings
                    </span>
                  </div>
                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                    {(comboOffer?.products || []).map((p) => {
                      const base = p.discountPrice || p.marketPrice || 0;
                      const discounted = Math.max(
                        1,
                        Math.round(base * (1 - comboOffer.discountPercentage / 100))
                      );
                      return (
                        <div
                          key={p._id}
                          className="flex items-center gap-3.5 p-3 bg-gray-950/50 border border-gray-800/80 rounded-xl"
                        >
                          <div className="w-14 h-14 rounded-lg border border-gray-800 shrink-0 overflow-hidden bg-gray-950 flex items-center justify-center">
                            <ProductImage
                              src={p.image}
                              alt={p.name}
                              category={p.category}
                              className="w-full h-full object-cover"
                              iconSize={18}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-white text-sm truncate">
                              {p.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                              <span>{p.category}</span>
                              {p.unit && <span>• 1 {p.unit}</span>}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-bold text-emerald-400 text-sm">
                              ₹{discounted}
                            </span>
                            <span className="block text-[11px] text-gray-500 line-through">
                              ₹{base}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-3.5 pt-4 border-t border-gray-100 dark:border-gray-800/80">
                  <div className="w-10 h-10 bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
                    <Store size={18} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                      {comboOffer?.shopOwner?.fullName || "Verified Merchant"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {comboOffer?.city || "Local Verified Store"}
                    </p>
                  </div>
                </div>
              </div>
            ) : isCartMode ? (
              <div className="bg-white border border-gray-200/90 shadow-sm dark:bg-gray-900/60 dark:border-gray-800/80 backdrop-blur-xl rounded-2xl p-6 dark:shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                      <Package size={20} className="text-emerald-600 dark:text-emerald-400" />
                      Cart Order ({cart?.items?.length || 0} items)
                    </h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Review items in your collection</p>
                  </div>
                  <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400">₹{cart?.totalAmount || 0}</span>
                </div>

                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1 custom-scrollbar">
                  {(cart?.items || []).map((item) => (
                    <div key={item._id} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-950/40 border border-gray-200 dark:border-gray-800/80 rounded-xl">
                      <div className="w-14 h-14 rounded-lg border border-gray-200 dark:border-gray-800 shrink-0 overflow-hidden bg-white dark:bg-gray-900 flex items-center justify-center">
                        <ProductImage
                          src={item.product?.image}
                          alt={item.product?.name}
                          category={item.product?.category}
                          className="w-full h-full object-cover"
                          iconSize={18}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{item.product?.name}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Qty: <span className="text-gray-900 dark:text-white font-semibold">{item.quantity}</span> × ₹{item.unitPrice}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">₹{item.totalPrice}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200/90 shadow-sm dark:bg-gray-900/60 dark:border-gray-800/80 backdrop-blur-xl rounded-2xl p-6 dark:shadow-xl">
                <div className="relative w-full h-64 bg-gray-50 dark:bg-gray-950/80 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800/60 flex items-center justify-center p-4 mb-6">
                <ProductImage
                  src={currentProduct.image}
                  alt={currentProduct.name}
                  category={currentProduct.category}
                  className="w-full h-full object-contain"
                />

                {discountPercent > 0 && (
                  <div className="absolute top-3 left-3 bg-emerald-600 text-white border border-emerald-500 text-xs font-bold px-3 py-1 rounded-full shadow-sm backdrop-blur-md">
                    {discountPercent}% OFF
                  </div>
                )}
              </div>

              <div className="flex items-start justify-between mb-3">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                    {currentProduct.name}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {currentProduct.brand}
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                {currentProduct.description}
              </p>

              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
                  ₹{currentProduct.discountPrice}
                </span>
                <span className="text-base text-gray-400 dark:text-gray-500 line-through">
                  ₹{currentProduct.marketPrice}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-6">
                <div className="bg-gray-50 dark:bg-gray-950/40 border border-gray-200 dark:border-gray-800/80 p-3.5 rounded-xl">
                  <span className="text-xs text-gray-500 block mb-0.5">
                    Category
                  </span>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {currentProduct.category}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-950/40 border border-gray-200 dark:border-gray-800/80 p-3.5 rounded-xl">
                  <span className="text-xs text-gray-500 block mb-0.5">
                    Available
                  </span>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {currentProduct.stock} in stock
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-950/40 border border-gray-200 dark:border-gray-800/80 p-3.5 rounded-xl">
                  <span className="text-xs text-gray-500 block mb-0.5">
                    Quantity
                  </span>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {currentProduct.quantity} {currentProduct.unit}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-950/40 border border-gray-200 dark:border-gray-800/80 p-3.5 rounded-xl">
                  <span className="text-xs text-gray-500 block mb-0.5">
                    Expires
                  </span>
                  <p
                    className={`font-semibold ${isExpired ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white"}`}
                  >
                    {new Date(currentProduct.expiryDate).toLocaleDateString()}
                    {isExpired && " (Expired)"}
                  </p>
                </div>
              </div>

              {/* 🚚 DELIVERY TIME TRACKING ESTIMATE */}
              {(() => {
                const storeLat = currentProduct.location?.coordinates?.[1] || 0;
                const storeLon = currentProduct.location?.coordinates?.[0] || 0;
                const deliveryInfo = getDeliveryTimeInfo(
                  user?.latitude || 0,
                  user?.longitude || 0,
                  storeLat,
                  storeLon,
                );
                return (
                  <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs backdrop-blur-md">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                      <Truck size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <p>{deliveryInfo.badgeText}</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-normal mt-0.5">
                          Estimated Delivery: {deliveryInfo.formattedTime}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 font-semibold bg-white dark:bg-gray-900/60 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800 self-start sm:self-auto shrink-0 shadow-2xs">
                      <Navigation size={12} className="text-emerald-600 dark:text-emerald-400" />
                      <span>
                        {deliveryInfo.distanceKm !== null ? `${deliveryInfo.distanceKm} km away` : "Distance unavailable"}
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center gap-3.5 pt-4 border-t border-gray-100 dark:border-gray-800/80">
                <div className="w-10 h-10 bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
                  <User size={18} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">
                    {currentProduct.ownerName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {currentProduct.ownerType}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

          {/* Checkout Form */}
          <div>
            <div className="bg-white border border-gray-200/90 shadow-sm dark:bg-gray-900/60 dark:border-gray-800/80 backdrop-blur-xl rounded-2xl p-6 dark:shadow-xl sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
                Checkout
              </h2>

              {isExpired ? (
                <div className="bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-500/20 rounded-xl p-6 mb-6 text-center backdrop-blur-xl">
                  <AlertTriangle
                    size={40}
                    className="text-red-500 dark:text-red-400 mx-auto mb-3"
                  />
                  <h3 className="text-lg font-bold text-red-800 dark:text-red-300 mb-2">
                    {isCartMode ? "Cart Contains Expired Items" : "Product Expired"}
                  </h3>
                  <p className="text-sm text-red-600 dark:text-red-400/90 mb-5">
                    {isCartMode
                      ? "One or more products in your cart have reached or passed their expiration date and cannot be purchased."
                      : "This product has expired and is no longer available for purchase."}
                  </p>
                  <button
                    onClick={() => navigate(isCartMode ? "/cart" : "/products")}
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-red-600/20 cursor-pointer"
                  >
                    {isCartMode ? "Return to Cart" : "Browse Other Products"}
                  </button>
                </div>
              ) : (
                <>
                  {!isCartMode && currentProduct && (
                    <div className="mb-6 bg-gray-50 dark:bg-gray-950/40 border border-gray-200 dark:border-gray-800/80 p-4 rounded-xl">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-2.5">
                        Quantity
                      </label>
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => handleQuantityChange(-1)}
                          disabled={quantity <= 1}
                          className="w-10 h-10 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="text-xl font-bold w-12 text-center text-gray-900 dark:text-white">
                          {quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(1)}
                          disabled={quantity >= (currentProduct?.stock || 1)}
                          className="w-10 h-10 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4 mb-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                      <Home size={16} className="text-emerald-600 dark:text-emerald-400" />
                      Shipping Address
                    </h3>

                    {/* Saved Addresses Quick Selection */}
                    {savedAddresses.length > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-950/60 border border-gray-200 dark:border-gray-800/80 rounded-xl p-3">
                        <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 block mb-2">
                          1-Click Saved Addresses:
                        </span>
                        <div className="flex items-center gap-2 flex-wrap">
                          {savedAddresses.map((addr) => (
                            <button
                              key={addr._id}
                              type="button"
                              onClick={() => selectSavedAddress(addr)}
                              className="px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-gray-900 hover:bg-emerald-50 dark:hover:bg-emerald-600/20 text-gray-700 dark:text-gray-300 hover:text-emerald-700 dark:hover:text-emerald-300 border border-gray-200 dark:border-gray-700/60 hover:border-emerald-300 dark:hover:border-emerald-500/40 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                            >
                              <Home size={12} className="text-emerald-600 dark:text-emerald-400" />
                              <span className="font-semibold">{addr.label}</span>
                              <span className="text-[10px] text-gray-500 dark:text-gray-400">({addr.city})</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {user && (
                      <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-3 flex items-center gap-2.5 backdrop-blur-xl">
                        <MapPin
                          size={14}
                          className="text-emerald-600 dark:text-emerald-400 shrink-0"
                        />
                        <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                          Some fields pre-filled from your profile. Please
                          complete the rest.
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="col-span-1 sm:col-span-2">
                        <AddressInput
                          name="name"
                          icon={User}
                          placeholder="Full Name"
                          value={shippingAddress.name}
                          onChange={handleAddressChange}
                          onBlur={handleBlur}
                          error={errors.name}
                          touched={touched.name}
                        />
                      </div>
                      <AddressInput
                        name="phone"
                        type="tel"
                        inputMode="numeric"
                        maxLength={shippingAddress.phone?.startsWith("+") ? 13 : 10}
                        icon={Phone}
                        placeholder="Phone Number (10 digits)"
                        value={shippingAddress.phone}
                        onChange={handleAddressChange}
                        onBlur={handleBlur}
                        error={errors.phone}
                        touched={touched.phone}
                      />
                      <AddressInput
                        name="email"
                        type="email"
                        icon={Mail}
                        placeholder="Email Address"
                        value={shippingAddress.email}
                        onChange={handleAddressChange}
                        onBlur={handleBlur}
                        error={errors.email}
                        touched={touched.email}
                      />
                      <div className="col-span-1 sm:col-span-2">
                        <AddressInput
                          name="street"
                          icon={MapPin}
                          placeholder="Street Address"
                          value={shippingAddress.street}
                          onChange={handleAddressChange}
                          onBlur={handleBlur}
                          error={errors.street}
                          touched={touched.street}
                        />
                      </div>
                      <AddressInput
                        name="city"
                        placeholder="City"
                        value={shippingAddress.city}
                        onChange={handleAddressChange}
                        onBlur={handleBlur}
                        error={errors.city}
                        touched={touched.city}
                      />
                      <AddressInput
                        name="state"
                        placeholder="State"
                        value={shippingAddress.state}
                        onChange={handleAddressChange}
                        onBlur={handleBlur}
                        error={errors.state}
                        touched={touched.state}
                      />
                      <div className="col-span-2">
                        <AddressInput
                          name="pincode"
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="Pincode (6 digits)"
                          value={shippingAddress.pincode}
                          onChange={handleAddressChange}
                          onBlur={handleBlur}
                          error={errors.pincode}
                          touched={touched.pincode}
                        />
                      </div>

                      {/* Save address to profile option */}
                      <div className="col-span-2 pt-2 border-t border-gray-100 dark:border-gray-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 dark:text-gray-300 select-none">
                          <input
                            type="checkbox"
                            checked={saveToProfile}
                            onChange={(e) => setSaveToProfile(e.target.checked)}
                            className="w-4 h-4 rounded text-emerald-600 bg-white dark:bg-gray-950 border-gray-300 dark:border-gray-700 focus:ring-emerald-500 cursor-pointer"
                          />
                          <span>Save address to profile for future orders</span>
                        </label>
                        {saveToProfile && (
                          <div className="flex items-center gap-1.5 self-end sm:self-auto">
                            <span className="text-[10px] text-gray-500">Label:</span>
                            {["Home", "Work", "Other"].map((lbl) => (
                              <button
                                key={lbl}
                                type="button"
                                onClick={() => setAddressLabel(lbl)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                  addressLabel === lbl
                                    ? "bg-emerald-50 border border-emerald-300 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/40"
                                    : "bg-gray-100 text-gray-600 hover:text-gray-900 dark:bg-gray-800 dark:text-gray-400 dark:hover:text-white"
                                }`}
                              >
                                {lbl}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-950/40 border border-gray-200 dark:border-gray-800/80 rounded-xl p-4 mb-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">
                      Order Summary
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-600 dark:text-gray-400">
                        <span>{isComboMode ? "Package Quantity" : isCartMode ? "Total Items" : "Quantity"}</span>
                        <span className="text-gray-900 dark:text-white font-semibold">
                          {isComboMode
                            ? `${quantity} Combo Pack (${comboOffer?.products?.length || 0} items)`
                            : isCartMode
                            ? (cart?.itemCount || 0)
                            : `${quantity} item(s)`}
                        </span>
                      </div>
                      {isComboMode && (
                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                          <span>Bundle Savings</span>
                          <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                            ₹{(getComboOriginalPrice() - getComboUnitPrice()) * quantity} ({comboOffer?.discountPercentage}% OFF)
                          </span>
                        </div>
                      )}
                      {!isCartMode && !isComboMode && currentProduct && (
                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                          <span>You Save</span>
                          <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                            ₹{(currentProduct.marketPrice - unitPrice) * quantity}
                          </span>
                        </div>
                      )}
                      <div className="border-t border-gray-200 dark:border-gray-800/80 pt-2 flex justify-between font-bold text-base">
                        <span className="text-gray-900 dark:text-white">Total Amount</span>
                        <span className="text-emerald-700 dark:text-emerald-400 text-lg">
                          ₹{totalAmount}
                        </span>
                      </div>
                    </div>
                  </div>

                  <RazorpayButton
                    amount={totalAmount}
                    productId={isCartMode || isComboMode ? undefined : currentProduct?._id}
                    quantity={isCartMode ? undefined : quantity}
                    shippingAddress={shippingAddress}
                    onSuccess={handleOrderSuccess}
                    validateShipping={isShippingValid}
                    offerId={isComboMode ? comboId : isCartMode ? undefined : offerId}
                    isCart={isCartMode}
                    isCombo={isComboMode}
                    comboId={isComboMode ? comboId : undefined}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
