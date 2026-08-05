import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { fetchProductById } from "../redux/thunks/productThunks";
import { fetchCart } from "../redux/thunks/cartThunks";
import RazorpayButton from "../components/RazorpayButton";
import { useSearchParams } from "react-router-dom";
import axiosInstance from "../api/axiosInstance"; // if not already imported
import { MapPin, Phone, Mail, User, Home, ArrowLeft, Minus, Plus, AlertTriangle, Check, X, Leaf, ShieldCheck, Package, Truck, Navigation,} from "lucide-react";
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

// MOVED OUTSIDE: AddressInput is now a standalone component with dark-mode styling
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
                ? "text-red-400"
                : isValid
                  ? "text-emerald-400"
                  : "text-gray-500"
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
          required
          className={`w-full bg-gray-950/60 border rounded-xl text-sm text-white placeholder-gray-500 outline-none backdrop-blur-xl transition-all shadow-inner py-3 ${
            Icon ? "pl-10" : "pl-4"
          } pr-10 ${
            hasError
              ? "border-red-500/80 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              : isValid
                ? "border-emerald-500/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                : "border-gray-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          }`}
        />
        {touched && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            {hasError ? (
              <X size={15} className="text-red-400" />
            ) : (
              <Check size={15} className="text-emerald-400" />
            )}
          </div>
        )}
      </div>
      {hasError && (
        <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1 font-medium">
          <X size={11} /> {error}
        </p>
      )}
    </div>
  );
};

const Checkout = () => {
  const { id } = useParams();
  const isCartMode = id === "cart";
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { currentProduct, loading } = useSelector((state) => state.product);
  const { cart } = useSelector((state) => state.cart);
  const [quantity, setQuantity] = useState(1);

  const [searchParams] = useSearchParams();
  const offerId = searchParams.get("offerId");
  const [activeOffer, setActiveOffer] = useState(null);

  useEffect(() => {
    if (offerId && currentProduct && !isCartMode) {
      axiosInstance
        .get(`/offers/${offerId}`)
        .then((res) => {
          if (res.data?.success) setActiveOffer(res.data.offer);
        })
        .catch(() => setActiveOffer(null));
    }
  }, [offerId, currentProduct, isCartMode]);

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
    setShippingAddress((prev) => {
      const updated = { ...prev, [name]: value };
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

  const handleOrderSuccess = useCallback(() => {
    navigate("/orders");
  }, [navigate]);

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

  const isExpired = currentProduct
    ? new Date(currentProduct.expiryDate) <= new Date()
    : false;

  if (!isCartMode && (loading || !currentProduct)) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  if (isCartMode && (!cart || !cart.items || cart.items.length === 0)) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-gray-100 flex items-center justify-center p-4">
        <div className="bg-gray-900/60 border border-gray-800/80 backdrop-blur-xl text-center py-16 px-8 rounded-2xl shadow-xl max-w-md w-full">
          <Package size={40} className="text-emerald-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Your Cart is Empty</h2>
          <p className="text-sm text-gray-400 mb-6">Add items to your cart before proceeding to checkout.</p>
          <button
            onClick={() => navigate("/products")}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-600/20"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

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
  const totalAmount = isCartMode ? (cart?.totalAmount || 0) : unitPrice * quantity;
  const discountPercent = currentProduct
    ? Math.round(((currentProduct.marketPrice - unitPrice) / currentProduct.marketPrice) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 p-4 md:p-8 relative overflow-hidden selection:bg-emerald-500 selection:text-white">
      {/* Background Glow Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-600/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-emerald-400 mb-6 transition-colors font-medium cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Details or Cart Items */}
          <div>
            {isCartMode ? (
              <div className="bg-gray-900/60 border border-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                  <div>
                    <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                      <Package size={20} className="text-emerald-400" />
                      Cart Order ({cart?.items?.length || 0} items)
                    </h1>
                    <p className="text-xs text-gray-400 mt-0.5">Review items in your collection</p>
                  </div>
                  <span className="text-xl font-bold text-emerald-400">₹{cart?.totalAmount || 0}</span>
                </div>

                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1 custom-scrollbar">
                  {(cart?.items || []).map((item) => (
                    <div key={item._id} className="flex items-center gap-4 p-3 bg-gray-950/40 border border-gray-800/80 rounded-xl">
                      <img
                        src={item.product?.image || "https://via.placeholder.com/80?text=No+Image"}
                        alt={item.product?.name}
                        className="w-14 h-14 object-cover rounded-lg border border-gray-800 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-white text-sm truncate">{item.product?.name}</h4>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Qty: <span className="text-white font-semibold">{item.quantity}</span> × ₹{item.unitPrice}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-400 text-sm">₹{item.totalPrice}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-gray-900/60 border border-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl">
                <div className="relative w-full h-64 bg-gray-950/80 rounded-xl overflow-hidden border border-gray-800/60 flex items-center justify-center p-4 mb-6">
                <img
                  src={
                    currentProduct.image ||
                    "https://via.placeholder.com/500x300?text=No+Image"
                  }
                  alt={currentProduct.name}
                  className="w-full h-full object-contain"
                />

                {discountPercent > 0 && (
                  <div className="absolute top-3 left-3 bg-emerald-500/90 text-white border border-emerald-400/30 text-xs font-bold px-3 py-1 rounded-full shadow-lg backdrop-blur-md">
                    {discountPercent}% OFF
                  </div>
                )}
              </div>

              <div className="flex items-start justify-between mb-3">
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    {currentProduct.name}
                  </h1>
                  <p className="text-sm text-gray-400">
                    {currentProduct.brand}
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-300 mb-6 leading-relaxed">
                {currentProduct.description}
              </p>

              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-3xl font-bold text-emerald-400">
                  ₹{currentProduct.discountPrice}
                </span>
                <span className="text-base text-gray-500 line-through">
                  ₹{currentProduct.marketPrice}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-6">
                <div className="bg-gray-950/40 border border-gray-800/80 p-3.5 rounded-xl">
                  <span className="text-xs text-gray-500 block mb-0.5">
                    Category
                  </span>
                  <p className="font-semibold text-white">
                    {currentProduct.category}
                  </p>
                </div>
                <div className="bg-gray-950/40 border border-gray-800/80 p-3.5 rounded-xl">
                  <span className="text-xs text-gray-500 block mb-0.5">
                    Available
                  </span>
                  <p className="font-semibold text-white">
                    {currentProduct.stock} in stock
                  </p>
                </div>
                <div className="bg-gray-950/40 border border-gray-800/80 p-3.5 rounded-xl">
                  <span className="text-xs text-gray-500 block mb-0.5">
                    Quantity
                  </span>
                  <p className="font-semibold text-white">
                    {currentProduct.quantity} {currentProduct.unit}
                  </p>
                </div>
                <div className="bg-gray-950/40 border border-gray-800/80 p-3.5 rounded-xl">
                  <span className="text-xs text-gray-500 block mb-0.5">
                    Expires
                  </span>
                  <p
                    className={`font-semibold ${isExpired ? "text-red-400" : "text-white"}`}
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
                  <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs backdrop-blur-md">
                    <div className="flex items-center gap-2 text-emerald-300 font-bold">
                      <Truck size={18} className="text-emerald-400" />
                      <div>
                        <p>{deliveryInfo.badgeText}</p>
                        <p className="text-[11px] text-gray-400 font-normal mt-0.5">
                          Estimated Delivery: {deliveryInfo.formattedTime}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400 font-semibold bg-gray-900/60 px-3 py-1.5 rounded-lg border border-gray-800">
                      <Navigation size={12} className="text-emerald-400" />
                      <span>{deliveryInfo.distanceKm} km away</span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center gap-3.5 pt-4 border-t border-gray-800/80">
                <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
                  <User size={18} className="text-emerald-400" />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">
                    {currentProduct.ownerName}
                  </p>
                  <p className="text-xs text-gray-400 capitalize">
                    {currentProduct.ownerType}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

          {/* Checkout Form */}
          <div>
            <div className="bg-gray-900/60 border border-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl sticky top-8">
              <h2 className="text-xl font-bold text-white mb-6 tracking-tight">
                Checkout
              </h2>

              {isExpired ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 mb-6 text-center backdrop-blur-xl">
                  <AlertTriangle
                    size={40}
                    className="text-red-400 mx-auto mb-3"
                  />
                  <h3 className="text-lg font-bold text-red-300 mb-2">
                    Product Expired
                  </h3>
                  <p className="text-sm text-red-400/90 mb-5">
                    This product has expired and is no longer available for
                    purchase.
                  </p>
                  <button
                    onClick={() => navigate("/products")}
                    className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-red-600/20"
                  >
                    Browse Other Products
                  </button>
                </div>
              ) : (
                <>
                  {!isCartMode && currentProduct && (
                    <div className="mb-6 bg-gray-950/40 border border-gray-800/80 p-4 rounded-xl">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2.5">
                        Quantity
                      </label>
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => handleQuantityChange(-1)}
                          disabled={quantity <= 1}
                          className="w-10 h-10 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-300 hover:border-gray-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="text-xl font-bold w-12 text-center text-white">
                          {quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(1)}
                          disabled={quantity >= (currentProduct?.stock || 1)}
                          className="w-10 h-10 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-300 hover:border-gray-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4 mb-6">
                    <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                      <Home size={16} className="text-emerald-400" />
                      Shipping Address
                    </h3>

                    {user && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-2.5 backdrop-blur-xl">
                        <MapPin
                          size={14}
                          className="text-emerald-400 shrink-0"
                        />
                        <p className="text-xs text-emerald-300 font-medium">
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
                        icon={Phone}
                        placeholder="Phone Number"
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
                          placeholder="Pincode (6 digits)"
                          value={shippingAddress.pincode}
                          onChange={handleAddressChange}
                          onBlur={handleBlur}
                          error={errors.pincode}
                          touched={touched.pincode}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-950/40 border border-gray-800/80 rounded-xl p-4 mb-6">
                    <h3 className="font-semibold text-white text-sm mb-3">
                      Order Summary
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-400">
                        <span>{isCartMode ? "Total Items" : "Quantity"}</span>
                        <span className="text-white font-semibold">
                          {isCartMode ? (cart?.itemCount || 0) : `${quantity} item(s)`}
                        </span>
                      </div>
                      {!isCartMode && currentProduct && (
                        <div className="flex justify-between text-gray-400">
                          <span>You Save</span>
                          <span className="text-emerald-400 font-medium">
                            ₹{(currentProduct.marketPrice - unitPrice) * quantity}
                          </span>
                        </div>
                      )}
                      <div className="border-t border-gray-800/80 pt-2 flex justify-between font-bold text-base">
                        <span className="text-white">Total Amount</span>
                        <span className="text-emerald-400 text-lg">
                          ₹{totalAmount}
                        </span>
                      </div>
                    </div>
                  </div>

                  <RazorpayButton
                    amount={totalAmount}
                    productId={isCartMode ? undefined : currentProduct?._id}
                    quantity={isCartMode ? undefined : quantity}
                    shippingAddress={shippingAddress}
                    onSuccess={handleOrderSuccess}
                    validateShipping={isShippingValid}
                    offerId={isCartMode ? undefined : offerId}
                    isCart={isCartMode}
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
