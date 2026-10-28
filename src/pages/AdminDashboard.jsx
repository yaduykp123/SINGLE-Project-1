// src/pages/AdminDashboard.jsx
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axiosInstance from "../api/axiosInstance";
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Trash2,
  RefreshCw,
  Search,
  Shield,
  X,
  Ban,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import ProductImage from "../components/ProductImage";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // overview | users | products | orders
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setRefreshing(true);
    try {
      const [usersRes, productsRes, ordersRes] = await Promise.all([
        axiosInstance.get("/admin/users"),
        axiosInstance.get("/admin/products"),
        axiosInstance.get("/admin/orders"),
      ]);

      setStats({
        totalUsers: usersRes.data.length,
        totalProducts: productsRes.data.length,
        totalOrders: ordersRes.data.length,
        totalRevenue: ordersRes.data.reduce(
          (sum, o) => sum + (o.totalAmount || 0),
          0,
        ),
      });
      setUsers(usersRes.data);
      setProducts(productsRes.data);
      setOrders(ordersRes.data);
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;
    try {
      await axiosInstance.delete(`/admin/products/${id}`);
      toast.success("Product deleted");
      fetchDashboardData();
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  const handleUpdateOrderStatus = async (id, status) => {
    try {
      await axiosInstance.put(`/admin/orders/${id}/status`, { status });
      toast.success(`Order marked as ${status}`);
      fetchDashboardData();
    } catch (error) {
      toast.error("Failed to update order");
    }
  };

  const handleDeleteUser = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this user? This cannot be undone.",
      )
    )
      return;
    try {
      await axiosInstance.delete(`/admin/users/${id}`);
      toast.success("User deleted");
      fetchDashboardData();
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  const handleBlockUser = async (id) => {
    if (!window.confirm("Are you sure you want to block this user?")) return;
    try {
      await axiosInstance.put(`/admin/users/${id}/block`);
      toast.success("User blocked");
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to block user");
    }
  };

  const handleUnblockUser = async (id) => {
    try {
      await axiosInstance.put(`/admin/users/${id}/unblock`);
      toast.success("User unblocked");
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to unblock user");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredProducts = products.filter(
    (p) =>
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredOrders = orders.filter(
    (o) =>
      o.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.buyerName?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "bg-blue-500",
    },
    {
      label: "Total Products",
      value: stats.totalProducts,
      icon: Package,
      color: "bg-emerald-500",
    },
    {
      label: "Total Orders",
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: "bg-purple-500",
    },
    {
      label: "Total Revenue",
      value: `₹${stats.totalRevenue}`,
      icon: DollarSign,
      color: "bg-amber-500",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Shield size={28} className="text-slate-700 dark:text-emerald-400" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, i) => (
          <div key={i} className="card flex items-center gap-4">
            <div
              className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}
            >
              <stat.icon size={24} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 mb-6 overflow-x-auto scrollbar-none scroll-smooth">
        {[
          { id: "overview", label: "Overview" },
          { id: "users", label: `Users (${users.length})` },
          { id: "products", label: `Products (${products.length})` },
          { id: "orders", label: `Orders (${orders.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setSearchTerm("");
            }}
            className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === tab.id
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder={`Search ${activeTab}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field pl-10 w-full max-w-md"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Recent Users
            </h2>
            {users.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No users yet</p>
            ) : (
              <div className="space-y-3">
                {users.slice(0, 5).map((u) => (
                  <div
                    key={u._id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800/60"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {u.fullName}
                        </p>
                        {u.isAdmin && (
                          <span className="text-xs bg-slate-800 dark:bg-emerald-950 text-white dark:text-emerald-300 border dark:border-emerald-800 px-2 py-0.5 rounded-full">
                            Admin
                          </span>
                        )}
                        {u.isBlocked && (
                          <span className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full">
                            <Ban size={12} />
                            Blocked
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{u.email}</p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        u.accountType === "shop"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                      }`}
                    >
                      {u.accountType}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Orders */}
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Recent Orders
            </h2>
            {orders.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No orders yet</p>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 5).map((o) => (
                  <div
                    key={o._id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800/60"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {o.productName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">by {o.buyerName}</p>
                    </div>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      ₹{o.totalAmount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400">
                <th className="text-left py-3 px-2 font-medium">Name</th>
                <th className="text-left py-3 px-2 font-medium">Email</th>
                <th className="text-left py-3 px-2 font-medium">Type</th>
                <th className="text-left py-3 px-2 font-medium">Location</th>
                <th className="text-left py-3 px-2 font-medium">Joined</th>
                <th className="text-left py-3 px-2 font-medium">Status</th>
                <th className="text-left py-3 px-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr
                  key={u._id}
                  className="border-b border-gray-100 dark:border-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                >
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">{u.fullName}</span>
                      {u.isAdmin && (
                        <Shield size={14} className="text-slate-700 dark:text-emerald-400" />
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-gray-600 dark:text-gray-300">{u.email}</td>
                  <td className="py-3 px-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        u.accountType === "shop"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                      }`}
                    >
                      {u.accountType}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-gray-500 dark:text-gray-400">{u.city || "—"}</td>
                  <td className="py-3 px-2 text-gray-500 dark:text-gray-400">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-2">
                    {u.isBlocked ? (
                      <span className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full">
                        <Ban size={12} />
                        Blocked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        <CheckCircle size={12} />
                        Active
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      {!u.isAdmin && (
                        <button
                          onClick={() =>
                            u.isBlocked
                              ? handleUnblockUser(u._id)
                              : handleBlockUser(u._id)
                          }
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                            u.isBlocked
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300"
                              : "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-500/20 dark:text-red-300"
                          }`}
                        >
                          {u.isBlocked ? "Unblock" : "Block"}
                        </button>
                      )}

                      {!u.isAdmin && (
                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Delete user"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "products" && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400">
                <th className="text-left py-3 px-2 font-medium">Product</th>
                <th className="text-left py-3 px-2 font-medium">Seller</th>
                <th className="text-left py-3 px-2 font-medium">Price</th>
                <th className="text-left py-3 px-2 font-medium">Stock</th>
                <th className="text-left py-3 px-2 font-medium">Expires</th>
                <th className="text-left py-3 px-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr
                  key={p._id}
                  className="border-b border-gray-100 dark:border-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                >
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-800 shrink-0 overflow-hidden bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                        <ProductImage
                          src={p.image}
                          alt={p.name}
                          category={p.category}
                          className="w-full h-full object-cover"
                          iconSize={16}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{p.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{p.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-gray-600 dark:text-gray-300">
                    {p.ownerName || p.owner?.fullName}
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      ₹{p.discountPrice}
                    </span>
                    <span className="text-gray-400 line-through text-xs ml-1">
                      ₹{p.marketPrice}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-gray-900 dark:text-gray-200">{p.stock}</td>
                  <td className="py-3 px-2 text-gray-500 dark:text-gray-400">
                    {new Date(p.expiryDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-2">
                    <button
                      onClick={() => handleDeleteProduct(p._id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Delete product"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "orders" && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400">
                <th className="text-left py-3 px-2 font-medium">Order ID</th>
                <th className="text-left py-3 px-2 font-medium">Product</th>
                <th className="text-left py-3 px-2 font-medium">Buyer</th>
                <th className="text-left py-3 px-2 font-medium">Amount</th>
                <th className="text-left py-3 px-2 font-medium">Status</th>
                <th className="text-left py-3 px-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((o) => (
                <tr
                  key={o._id}
                  className="border-b border-gray-100 dark:border-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                >
                  <td className="py-3 px-2 font-mono text-xs text-gray-500 dark:text-gray-400">
                    ...{o.orderId?.slice(-8)}
                  </td>
                  <td className="py-3 px-2 font-medium text-gray-900 dark:text-white">{o.productName}</td>
                  <td className="py-3 px-2 text-gray-600 dark:text-gray-300">{o.buyerName}</td>
                  <td className="py-3 px-2 text-emerald-600 dark:text-emerald-400 font-medium">
                    ₹{o.totalAmount}
                  </td>
                  <td className="py-3 px-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        o.status === "pending"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                          : o.status === "delivered"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : o.status === "cancelled"
                              ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <select
                      value={o.status}
                      onChange={(e) =>
                        handleUpdateOrderStatus(o._id, e.target.value)
                      }
                      className="text-xs border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="pending" className="bg-white text-gray-900 dark:bg-gray-900 dark:text-white">Pending</option>
                      <option value="confirmed" className="bg-white text-gray-900 dark:bg-gray-900 dark:text-white">Confirmed</option>
                      <option value="shipped" className="bg-white text-gray-900 dark:bg-gray-900 dark:text-white">Shipped</option>
                      <option value="delivered" className="bg-white text-gray-900 dark:bg-gray-900 dark:text-white">Delivered</option>
                      <option value="cancelled" className="bg-white text-gray-900 dark:bg-gray-900 dark:text-white">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;