import { useState } from "react";
import { useDispatch } from "react-redux";
import axiosInstance from "../api/axiosInstance";
import { verifyAndPlaceOrder } from "../redux/thunks/orderThunks";
import toast from "react-hot-toast";

const RazorpayButton = ({
  amount,
  productId,
  quantity,
  shippingAddress,
  onSuccess,
  validateShipping,
  offerId,
  isCart = false,
}) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    // 👇 STEP 1: Run frontend validation first
    if (validateShipping && !validateShipping()) {
      return; // Validation failed, toast already shown
    }

    // 👇 STEP 2: Validate amount
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      toast.error("Invalid payment amount");
      return;
    }

    // 👇 STEP 3: Validate shipping address (extra safety)
    if (
      !shippingAddress?.name ||
      !shippingAddress?.phone ||
      !shippingAddress?.street
    ) {
      toast.error("Please fill all shipping details");
      return;
    }

    // 👇 STEP 4: Check Razorpay script loaded
    if (typeof window === "undefined" || !window.Razorpay) {
      toast.error("Payment system not loaded. Please refresh the page.");
      return;
    }

    setLoading(true);

    try {
      // 👇 STEP 5: Create order on backend
      const { data: order } = await axiosInstance.post("/orders/create-order", {
        amount: numAmount,
        productId,
        quantity,
        offerId,
        isCart,
      });

      if (!order?.id) {
        throw new Error("Failed to create payment order");
      }

      // 👇 STEP 6: Open Razorpay checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "expireOff",
        description: isCart ? "Cart Items Purchase" : "Product Purchase",
        order_id: order.id,
        handler: async (response) => {
          try {
            // Verify payment on backend
            await dispatch(
              verifyAndPlaceOrder({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                productId,
                quantity,
                shippingAddress,
                offerId,
                isCart,
              }),
            );
            toast.success("Order placed successfully!");
            onSuccess();
          } catch {
            toast.error("Payment verification failed");
          }
        },
        prefill: {
          name: shippingAddress.name,
          email: shippingAddress.email || "",
          contact: shippingAddress.phone,
        },
        theme: { color: "#059669" },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", (response) => {
        toast.error(response.error?.description || "Payment failed");
        setLoading(false);
      });

      rzp.open();
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.message ||
        "Something went wrong";
      toast.error(msg);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className="btn-primary w-full py-3 text-lg disabled:opacity-50"
    >
      {loading ? "Processing..." : `Pay ₹${amount}`}
    </button>
  );
};

export default RazorpayButton;
