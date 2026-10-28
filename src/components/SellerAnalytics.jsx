import { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Percent,
  Leaf,
  AlertTriangle,
  Award,
  Sparkles,
  Calendar,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";

const SellerAnalytics = () => {
  const [timeRange, setTimeRange] = useState("30d");
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const fetchAnalytics = async (range) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/analytics/seller-dashboard?timeRange=${range}`);
      if (res.data?.success) {
        setAnalytics(res.data.data);
      }
    } catch (error) {
      console.error("Failed to load seller analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(timeRange);
  }, [timeRange]);

  const summary = analytics?.summary || {
    totalRevenue: 0,
    totalOrders: 0,
    deliveredOrders: 0,
    averageOrderValue: 0,
    sellThroughRate: 0,
    activeListings: 0,
    expiredBatches: 0,
    expiringSoonCount: 0,
  };

  const impact = analytics?.impact || {
    wasteAvoidedKg: 0,
    mealsRescued: 0,
    co2AvoidedKg: 0,
  };

  const salesTrend = analytics?.salesTrend || [];
  const topProducts = analytics?.topProducts || [];
  const unsoldForecast = analytics?.unsoldStockForecast || [];

  // Helper for SVG chart
  const maxRevenue = Math.max(...salesTrend.map((d) => d.revenue), 100);
  const chartHeight = 160;
  const chartWidth = 600;
  const paddingX = 40;
  const paddingY = 20;

  const points = salesTrend.map((item, index) => {
    const x =
      salesTrend.length > 1
        ? paddingX + (index / (salesTrend.length - 1)) * (chartWidth - paddingX * 2)
        : chartWidth / 2;
    const y =
      chartHeight -
      paddingY -
      (item.revenue / maxRevenue) * (chartHeight - paddingY * 2);
    return { ...item, x, y };
  });

  const pathD =
    points.length > 1
      ? points.reduce(
          (acc, p, idx) =>
            idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`,
          ""
        )
      : "";

  const areaD =
    points.length > 1
      ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${
          points[0].x
        } ${chartHeight - paddingY} Z`
      : "";

  return (
    <div className="space-y-6 mb-8">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/80 backdrop-blur-xl p-5 rounded-2xl shadow-sm dark:shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <TrendingUp size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              Performance Intelligence & Analytics
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                Live
              </span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Measured revenue, inventory sell-through rate, and environmental impact
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-950/70 p-1.5 rounded-xl border border-gray-200 dark:border-gray-800 self-stretch sm:self-auto justify-between sm:justify-start">
          {[
            { id: "7d", label: "7 Days" },
            { id: "30d", label: "30 Days" },
            { id: "90d", label: "90 Days" },
            { id: "all", label: "All Time" },
          ].map((range) => (
            <button
              key={range.id}
              onClick={() => setTimeRange(range.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                timeRange === range.id
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-gray-800/50"
              }`}
            >
              {range.label}
            </button>
          ))}
          <button
            onClick={() => fetchAnalytics(timeRange)}
            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors ml-1 cursor-pointer"
            title="Refresh analytics"
          >
            <RefreshCw size={13} className={loading ? "animate-spin text-emerald-600 dark:text-emerald-400" : ""} />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Revenue */}
        <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900/90 dark:to-gray-900/40 border border-gray-200 dark:border-gray-800/80 p-5 rounded-2xl shadow-sm dark:shadow-xl backdrop-blur-xl relative overflow-hidden group hover:border-gray-300 dark:hover:border-gray-700/80 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Total Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <DollarSign size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            ₹{summary.totalRevenue.toLocaleString("en-IN")}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{summary.deliveredOrders}</span>
            <span>delivered orders</span>
          </div>
        </div>

        {/* Metric 2: Average Order Value */}
        <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900/90 dark:to-gray-900/40 border border-gray-200 dark:border-gray-800/80 p-5 rounded-2xl shadow-sm dark:shadow-xl backdrop-blur-xl relative overflow-hidden group hover:border-gray-300 dark:hover:border-gray-700/80 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Avg Order Value
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 dark:text-blue-400">
              <ShoppingCart size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            ₹{summary.averageOrderValue.toFixed(0)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span>Across</span>
            <span className="text-blue-600 dark:text-blue-400 font-semibold">{summary.totalOrders}</span>
            <span>total orders</span>
          </div>
        </div>

        {/* Metric 3: Sell-Through Rate */}
        <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900/90 dark:to-gray-900/40 border border-gray-200 dark:border-gray-800/80 p-5 rounded-2xl shadow-sm dark:shadow-xl backdrop-blur-xl relative overflow-hidden group hover:border-gray-300 dark:hover:border-gray-700/80 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Sell-Through Rate
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 dark:text-purple-400">
              <Percent size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {summary.sellThroughRate}%
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="text-purple-600 dark:text-purple-400 font-semibold">{summary.activeListings}</span>
            <span>active catalogue listings</span>
          </div>
        </div>

        {/* Metric 4: Expiry Alerts */}
        <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900/90 dark:to-gray-900/40 border border-gray-200 dark:border-gray-800/80 p-5 rounded-2xl shadow-sm dark:shadow-xl backdrop-blur-xl relative overflow-hidden group hover:border-gray-300 dark:hover:border-gray-700/80 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Stock Expiry Risk
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 dark:text-amber-400">
              <AlertTriangle size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {summary.expiringSoonCount}
            <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-1.5">batches soon</span>
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="text-red-500 dark:text-red-400 font-semibold">{summary.expiredBatches}</span>
            <span>discarded/expired batches</span>
          </div>
        </div>
      </div>

      {/* Sustainability Impact Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-white to-emerald-50/50 dark:from-emerald-950/40 dark:via-gray-900/80 dark:to-emerald-950/30 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-5 shadow-sm dark:shadow-xl backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Leaf size={24} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Food Waste Rescued Through Your Shop
              <Sparkles size={14} className="text-emerald-600 dark:text-emerald-400" />
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
              Verified metric computed from fulfilled discounted inventory batches
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 sm:gap-10 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-800 pt-4 md:pt-0 md:pl-8 w-full md:w-auto">
          <div>
            <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {impact.wasteAvoidedKg} <span className="text-xs font-medium text-gray-500 dark:text-gray-300">kg</span>
            </p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Food Rescued</p>
          </div>
          <div>
            <p className="text-xl font-extrabold text-teal-600 dark:text-teal-400">
              {impact.mealsRescued}
            </p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Meals Equivalent</p>
          </div>
          <div>
            <p className="text-xl font-extrabold text-sky-600 dark:text-sky-400">
              {impact.co2AvoidedKg} <span className="text-xs font-medium text-gray-500 dark:text-gray-300">kg</span>
            </p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">CO₂ Prevented</p>
          </div>
        </div>
      </div>

      {/* Grid: Sales Trend Chart & Top Products Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/80 rounded-2xl p-5 shadow-sm dark:shadow-xl backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Revenue & Daily Sales Trend
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Day-by-day revenue velocity</p>
            </div>
            {hoveredPoint && (
              <div className="text-right">
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  ₹{hoveredPoint.revenue} ({hoveredPoint.orders} orders)
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">{hoveredPoint.date}</p>
              </div>
            )}
          </div>

          {/* SVG Trend Line */}
          {salesTrend.length > 0 ? (
            <div className="relative w-full overflow-hidden">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-44 overflow-visible"
              >
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Guide Lines */}
                <line
                  x1={paddingX}
                  y1={paddingY}
                  x2={chartWidth - paddingX}
                  y2={paddingY}
                  stroke="currentColor"
                  className="text-gray-200 dark:text-gray-800"
                  strokeDasharray="4 4"
                />
                <line
                  x1={paddingX}
                  y1={chartHeight / 2}
                  x2={chartWidth - paddingX}
                  y2={chartHeight / 2}
                  stroke="currentColor"
                  className="text-gray-200 dark:text-gray-800"
                  strokeDasharray="4 4"
                />
                <line
                  x1={paddingX}
                  y1={chartHeight - paddingY}
                  x2={chartWidth - paddingX}
                  y2={chartHeight - paddingY}
                  stroke="currentColor"
                  className="text-gray-300 dark:text-gray-700"
                />

                {/* Area under curve */}
                {areaD && <path d={areaD} fill="url(#revenueGradient)" />}

                {/* Main line */}
                {pathD && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Interactive Points */}
                {points.map((pt, i) => (
                  <g key={i}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="4"
                      className="fill-emerald-500 stroke-white dark:stroke-gray-900 stroke-2 cursor-pointer transition-all hover:r-6"
                      onMouseEnter={() => setHoveredPoint(pt)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  </g>
                ))}
              </svg>
              <div className="flex justify-between text-[10px] text-gray-500 mt-2 px-6">
                <span>{salesTrend[0]?.date}</span>
                <span>{salesTrend[Math.floor(salesTrend.length / 2)]?.date}</span>
                <span>{salesTrend[salesTrend.length - 1]?.date}</span>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-gray-400">
              No sales data recorded in this period yet.
            </div>
          )}
        </div>

        {/* Top Products Leaderboard */}
        <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/80 rounded-2xl p-5 shadow-sm dark:shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Award size={16} className="text-amber-500 dark:text-amber-400" />
              Top Products
            </h3>
            <span className="text-[11px] text-gray-500 dark:text-gray-400">By units sold</span>
          </div>

          {topProducts.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-12">
              No product sales in this timeframe.
            </p>
          ) : (
            <div className="space-y-3">
              {topProducts.slice(0, 5).map((prod, idx) => (
                <div
                  key={prod.productId || idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-950/40 border border-gray-200 dark:border-gray-800/60 hover:border-gray-300 dark:hover:border-gray-700/80 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                        idx === 0
                          ? "bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30"
                          : idx === 1
                          ? "bg-gray-400/20 text-gray-700 dark:text-gray-300 border border-gray-400/30"
                          : idx === 2
                          ? "bg-amber-700/20 text-amber-700 dark:text-amber-500 border border-amber-700/30"
                          : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-gray-900 dark:text-white truncate max-w-[130px]">
                        {prod.name}
                      </p>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">{prod.category}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">₹{prod.revenue}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">{prod.unitsSold} units</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Unsold Stock Forecasting / Risk Engine */}
      {unsoldForecast.length > 0 && (
        <div className="bg-white dark:bg-gradient-to-br dark:from-gray-900/90 dark:to-gray-900/60 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-5 shadow-sm dark:shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 dark:text-amber-400">
                <AlertTriangle size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Predictive Unsold Stock Alerts
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Products projected to expire before selling out based on current sales velocity
                </p>
              </div>
            </div>
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 font-semibold">
              Action Recommended
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {unsoldForecast.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-950/60 border border-gray-200 dark:border-gray-800/80 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{item.product}</p>
                    <span
                      className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        item.risk === "HIGH"
                          ? "bg-red-500/20 text-red-600 dark:text-red-300 border border-red-500/30"
                          : "bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      {item.risk} Risk
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Category: {item.category}</p>
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-800 text-[11px]">
                    <div>
                      <span className="text-gray-400 dark:text-gray-500 block text-[10px]">Stock Left</span>
                      <span className="text-gray-900 dark:text-white font-medium">{item.currentStock} units</span>
                    </div>
                    <div>
                      <span className="text-gray-400 dark:text-gray-500 block text-[10px]">Days to Expiry</span>
                      <span className="text-amber-600 dark:text-amber-400 font-medium">
                        {item.estimatedDaysUntilExpiry} days
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-red-500 dark:text-red-300 font-medium">
                    ~{item.projectedUnsold} units at risk
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                    Apply Discount <ArrowUpRight size={10} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerAnalytics;
