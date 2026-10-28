import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchMyListings } from "../redux/thunks/productThunks";
import { fetchReceivedOrders } from "../redux/thunks/orderThunks";
import { setFormOpen } from "../redux/slices/productSlice";
import ProductForm from "../components/ProductForm";
import InventoryManagement from "../components/InventoryManagement";
import SellerAnalytics from "../components/SellerAnalytics";
import { Package, ShoppingCart, TrendingUp, AlertCircle, Plus, DollarSign, Leaf, Ban,} from "lucide-react";

const Dashboard = () => {
  const dispatch = useDispatch();
  const { myListings, formOpen } = useSelector((state) => state.product);
  const { receivedOrders } = useSelector((state) => state.order);

  useEffect(() => {
    dispatch(fetchMyListings());
    dispatch(fetchReceivedOrders());
  }, [dispatch]);

  const totalListings = myListings.length;
  const activeListings = myListings.filter((p) => p.isActive).length;
  const totalOrders = receivedOrders.length;
  const totalRevenue = receivedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingOrders = receivedOrders.filter((o) => o.status === "pending").length;

  const expiringSoon = myListings.filter((p) => {
    const days = Math.ceil((new Date(p.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= 3 && p.isActive;
  });

  const stats = [
    { label: "Total Listings", value: totalListings, icon: Package, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
    { label: "Active Listings", value: activeListings, icon: TrendingUp, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    { label: "Total Orders", value: totalOrders, icon: ShoppingCart, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
    { label: "Revenue", value: `₹${totalRevenue}`, icon: DollarSign, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  ];

  return (
    <div className="min-h-screen bg-[#f8faf9] dark:bg-[#0b0f19] text-gray-900 dark:text-gray-100 p-4 md:p-8 relative overflow-hidden selection:bg-emerald-500 selection:text-white transition-colors">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3 backdrop-blur-md shadow-xs">
              <img 
                src="/Images/fresh-produce-clock.png" 
                alt="Shop Management" 
                className="w-4 h-4 object-contain" 
              />
              <span>Shop Management Console</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Shop Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Overview of your shop performance and inventory</p>
          </div>
          <button
            onClick={() => dispatch(setFormOpen(true))}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 px-6 rounded-xl transition-all shadow-lg shadow-emerald-600/20 border border-emerald-400/25 cursor-pointer"
          >
            <Plus size={18} />
            <span>Add Product</span>
          </button>
        </div>

        {formOpen && <ProductForm />}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/80 backdrop-blur-xl p-6 rounded-2xl flex items-center gap-4 shadow-sm dark:shadow-xl">
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${stat.color}`}>
                <stat.icon size={22} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{stat.value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Alerts */}
        {pendingOrders > 0 && (
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 mb-6 flex items-center gap-3 backdrop-blur-md shadow-sm">
            <AlertCircle size={20} className="text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-amber-900 dark:text-amber-200 text-sm">
              You have <span className="font-bold text-amber-700 dark:text-amber-300">{pendingOrders}</span> pending order
              {pendingOrders > 1 ? "s" : ""} to confirm
            </p>
          </div>
        )}

        {expiringSoon.length > 0 && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl p-4 mb-6 flex items-center gap-3 backdrop-blur-md shadow-sm">
            <AlertCircle size={20} className="text-red-500 dark:text-red-400 shrink-0" />
            <p className="text-red-900 dark:text-red-200 text-sm">
              <span className="font-bold text-red-600 dark:text-red-300">{expiringSoon.length}</span> product
              {expiringSoon.length > 1 ? "s" : ""} expiring soon. Check reminders!
            </p>
          </div>
        )}

        {/* Seller Performance Intelligence & Analytics */}
        <SellerAnalytics />

        {/* Smart Expiry & Batch Inventory Management */}
        <div className="mb-8">
          <InventoryManagement />
        </div>

        {/* Recent Orders */}
        <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-sm dark:shadow-xl">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 tracking-tight">Recent Orders</h2>
          {receivedOrders.length === 0 ? (
            <p className="text-gray-400 text-center py-12 text-sm">No orders received yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400">
                    <th className="text-left py-3.5 px-4 font-semibold">Product</th>
                    <th className="text-left py-3.5 px-4 font-semibold">Buyer</th>
                    <th className="text-left py-3.5 px-4 font-semibold">Amount</th>
                    <th className="text-left py-3.5 px-4 font-semibold">Status</th>
                    <th className="text-left py-3.5 px-4 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                  {receivedOrders.slice(0, 5).map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="py-4 px-4 font-medium text-gray-900 dark:text-gray-200">{order.productName}</td>
                      <td className="py-4 px-4 text-gray-600 dark:text-gray-300">{order.buyerName}</td>
                      <td className="py-4 px-4 text-emerald-600 dark:text-emerald-400 font-semibold">₹{order.totalAmount}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold capitalize border ${
                            order.status === "pending"
                              ? "bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20"
                              : order.status === "delivered"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : order.status === "cancelled"
                              ? "bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/20"
                              : "bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/20"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-500 dark:text-gray-400 text-xs">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;