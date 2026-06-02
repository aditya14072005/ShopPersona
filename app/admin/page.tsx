'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import {
  collection, onSnapshot, query, getDocs, where,
  doc, updateDoc, addDoc, deleteDoc, setDoc, orderBy,
} from 'firebase/firestore';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  Users, ShoppingCart, TrendingUp, LayoutDashboard, Package, RefreshCw,
  CreditCard, ChevronDown, ChevronUp, Search, Plus, Pencil, Trash2, X,
  BarChart2, Warehouse, MessageSquare, CalendarDays,
} from 'lucide-react';
import { useRef } from 'react';
import { PRODUCTS as STATIC_PRODUCTS } from '@/lib/products';
import type { Product } from '@/lib/products';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Order {
  id: string;
  userId: string;
  items: { name: string; quantity: number; price: number; productId: string }[];
  total: number;
  status: string;
  createdAt: string;
  stripeSessionId?: string;
  shipping?: { firstName: string; lastName: string; email: string };
}
interface ReturnRequest {
  id: string; orderId: string; userId: string; itemName: string;
  reason: string; type: string; status: string; createdAt: string;
}
interface UserRecord {
  uid: string; email: string; name: string; role: string; createdAt: string;
}
interface SupportTicket {
  id: string; orderId: string; userId: string; status: string; createdAt: string; updatedAt?: string;
}
interface SupportMessage { id: string; sender: 'user' | 'admin'; text: string; createdAt: string; }

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  Electronics: '#7C3AED', Fashion: '#10B981', Home: '#06B6D4',
  Books: '#F59E0B', Sports: '#EC4899',
};

const TABS = [
  { key: 'overview',   label: 'Overview',   icon: LayoutDashboard },
  { key: 'analytics',  label: 'Analytics',  icon: BarChart2 },
  { key: 'orders',     label: 'Orders',     icon: ShoppingCart },
  { key: 'returns',    label: 'Returns',    icon: RefreshCw },
  { key: 'support',    label: 'Support',    icon: MessageSquare },
  { key: 'payments',   label: 'Payments',   icon: CreditCard },
  { key: 'users',      label: 'Users',      icon: Users },
  { key: 'products',   label: 'Products',   icon: Package },
  { key: 'inventory',  label: 'Inventory',  icon: Warehouse },
] as const;

type Tab = typeof TABS[number]['key'];

// ─── Analytics Tab ───────────────────────────────────────────────────────────
const TOOLTIP_STYLE = { backgroundColor: '#1A1F3A', border: '1px solid #2D3748', borderRadius: '8px', color: '#F5F5F5' };

function AnalyticsTab({ orders, returns, userCount }: { orders: Order[]; returns: ReturnRequest[]; userCount: number }) {
  // Revenue + order count by day (last 30 days)
  const last30: Record<string, { revenue: number; orders: number; aov: number }> = {};
  const now = Date.now();
  orders.forEach((o) => {
    const d = new Date(o.createdAt);
    if (now - d.getTime() > 30 * 86400_000) return;
    const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!last30[key]) last30[key] = { revenue: 0, orders: 0, aov: 0 };
    last30[key].revenue += o.total || 0;
    last30[key].orders  += 1;
  });
  const trendData = Object.entries(last30).map(([date, v]) => ({
    date, revenue: +v.revenue.toFixed(2), orders: v.orders, aov: v.orders ? +(v.revenue / v.orders).toFixed(2) : 0,
  }));

  // Customer growth by month
  const growthByMonth: Record<string, number> = {};
  orders.forEach((o) => {
    const m = new Date(o.createdAt).toLocaleString('default', { month: 'short', year: '2-digit' });
    growthByMonth[m] = (growthByMonth[m] || 0) + 1;
  });
  const growthData = Object.entries(growthByMonth).map(([month, orders]) => ({ month, orders }));

  // Return rate by month
  const returnsByMonth: Record<string, number> = {};
  const ordersByMonth: Record<string, number> = {};
  orders.forEach((o) => {
    const m = new Date(o.createdAt).toLocaleString('default', { month: 'short' });
    ordersByMonth[m] = (ordersByMonth[m] || 0) + 1;
  });
  returns.forEach((r) => {
    const m = new Date(r.createdAt).toLocaleString('default', { month: 'short' });
    returnsByMonth[m] = (returnsByMonth[m] || 0) + 1;
  });
  const returnRateData = Object.keys(ordersByMonth).map((m) => ({
    month: m,
    rate: +((returnsByMonth[m] || 0) / ordersByMonth[m] * 100).toFixed(1),
  }));

  // Category revenue breakdown
  const catRevenue: Record<string, number> = {};
  orders.forEach((o) => o.items?.forEach((item) => {
    const p = STATIC_PRODUCTS.find((x) => x.id === item.productId);
    if (p) catRevenue[p.category] = (catRevenue[p.category] || 0) + item.price * item.quantity;
  }));
  const catData = Object.entries(catRevenue).map(([name, revenue]) => ({ name, revenue, color: CATEGORY_COLORS[name] || '#888' }));

  const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  const avgOrderValue = orders.length ? totalRevenue / orders.length : 0;
  const returnRate = orders.length ? (returns.length / orders.length * 100) : 0;
  const deliveredRate = orders.length ? (orders.filter(o => o.status === 'delivered').length / orders.length * 100) : 0;

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Avg Order Value', value: `$${avgOrderValue.toFixed(2)}`, color: 'text-primary' },
          { label: 'Return Rate',     value: `${returnRate.toFixed(1)}%`,     color: 'text-yellow-400' },
          { label: 'Delivery Rate',   value: `${deliveredRate.toFixed(1)}%`,  color: 'text-green-400' },
          { label: 'Total Customers', value: userCount,                        color: 'text-accent' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Revenue trend */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-bold text-foreground mb-4">Revenue & Orders — Last 30 Days</h2>
        {trendData.length === 0 ? <p className="text-muted-foreground text-sm">No data yet.</p> : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
              <XAxis dataKey="date" stroke="#A0AEC0" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" stroke="#A0AEC0" />
              <YAxis yAxisId="right" orientation="right" stroke="#A0AEC0" />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend />
              <Line yAxisId="left"  type="monotone" dataKey="revenue" stroke="#7C3AED" strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="orders"  stroke="#10B981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AOV trend */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Average Order Value Trend</h2>
          {trendData.length === 0 ? <p className="text-muted-foreground text-sm">No data yet.</p> : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
                <XAxis dataKey="date" stroke="#A0AEC0" tick={{ fontSize: 10 }} />
                <YAxis stroke="#A0AEC0" />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="aov" stroke="#F59E0B" strokeWidth={2} dot={false} name="AOV ($)" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Return rate */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Return Rate by Month (%)</h2>
          {returnRateData.length === 0 ? <p className="text-muted-foreground text-sm">No data yet.</p> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={returnRateData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
                <XAxis dataKey="month" stroke="#A0AEC0" />
                <YAxis stroke="#A0AEC0" unit="%" />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="rate" fill="#EC4899" radius={[4, 4, 0, 0]} name="Return Rate %" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Orders per month growth */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Order Volume by Month</h2>
          {growthData.length === 0 ? <p className="text-muted-foreground text-sm">No data yet.</p> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
                <XAxis dataKey="month" stroke="#A0AEC0" />
                <YAxis stroke="#A0AEC0" />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="orders" fill="#06B6D4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Revenue by category */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Revenue by Category</h2>
          {catData.length === 0 ? <p className="text-muted-foreground text-sm">No data yet.</p> : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={catData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
                  <XAxis type="number" stroke="#A0AEC0" />
                  <YAxis type="category" dataKey="name" stroke="#A0AEC0" width={75} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number | string | undefined) => [`$${Number(v ?? 0).toFixed(0)}`, 'Revenue']} />
                  <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                    {catData.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────────────────
function OverviewTab({ orders, returns, userCount }: { orders: Order[]; returns: ReturnRequest[]; userCount: number }) {
  const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);

  const revenueByMonth: Record<string, number> = {};
  orders.forEach((o) => {
    const month = new Date(o.createdAt).toLocaleString('default', { month: 'short' });
    revenueByMonth[month] = (revenueByMonth[month] || 0) + o.total;
  });
  const revenueData = Object.entries(revenueByMonth).map(([name, revenue]) => ({ name, revenue }));

  const categoryCount: Record<string, number> = {};
  orders.forEach((o) =>
    o.items?.forEach((item) => {
      const product = STATIC_PRODUCTS.find((p) => p.id === item.productId);
      if (product) categoryCount[product.category] = (categoryCount[product.category] || 0) + item.quantity;
    }),
  );
  const categoryData = Object.entries(categoryCount).map(([name, value]) => ({
    name, value, color: CATEGORY_COLORS[name] || '#888',
  }));

  const productSales: Record<string, { name: string; sales: number; revenue: number }> = {};
  orders.forEach((o) =>
    o.items?.forEach((item) => {
      if (!productSales[item.name]) productSales[item.name] = { name: item.name, sales: 0, revenue: 0 };
      productSales[item.name].sales += item.quantity;
      productSales[item.name].revenue += item.price * item.quantity;
    }),
  );
  const topProducts = Object.values(productSales).sort((a, b) => b.sales - a.sales).slice(0, 5);

  // Order status breakdown
  const statusCount: Record<string, number> = {};
  orders.forEach((o) => { statusCount[o.status] = (statusCount[o.status] || 0) + 1; });
  const statusData = Object.entries(statusCount).map(([name, value]) => ({ name, value }));

  // Recent activity (last 5 orders + last 5 returns merged)
  const activity = [
    ...orders.slice(0, 5).map((o) => ({ type: 'order', id: o.id, label: `New order $${o.total?.toFixed(2)}`, time: o.createdAt, color: 'bg-blue-500' })),
    ...returns.slice(0, 5).map((r) => ({ type: 'return', id: r.id, label: `Return request: ${r.itemName}`, time: r.createdAt, color: 'bg-yellow-500' })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8);

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Revenue',   value: `$${totalRevenue.toFixed(0)}`, icon: TrendingUp,  color: 'bg-primary/20 text-primary' },
          { label: 'Total Orders',    value: orders.length,                  icon: ShoppingCart, color: 'bg-accent/20 text-accent' },
          { label: 'Total Users',     value: userCount,                      icon: Users,        color: 'bg-secondary/20 text-secondary' },
          { label: 'Pending Returns', value: returns.filter(r => r.status === 'pending').length, icon: RefreshCw, color: 'bg-yellow-500/20 text-yellow-400',
            sub: `${returns.length} total requests` },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{label}</p>
                <p className="text-2xl font-bold text-foreground truncate max-w-[140px]">{value}</p>
                {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
              </div>
              <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Revenue by Month</h2>
          {revenueData.length === 0 ? <p className="text-muted-foreground text-sm">No data yet.</p> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
                <XAxis dataKey="name" stroke="#A0AEC0" />
                <YAxis stroke="#A0AEC0" />
                <Tooltip contentStyle={{ backgroundColor: '#1A1F3A', border: '1px solid #2D3748', borderRadius: '8px', color: '#F5F5F5' }} />
                <Bar dataKey="revenue" fill="#7C3AED" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Sales by Category</h2>
          {categoryData.length === 0 ? <p className="text-muted-foreground text-sm">No data yet.</p> : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value">
                    {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1A1F3A', border: '1px solid #2D3748', borderRadius: '8px', color: '#F5F5F5' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-2">
                {categoryData.map((c) => (
                  <span key={c.name} className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />{c.name}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order status breakdown */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Orders by Status</h2>
          {statusData.length === 0 ? <p className="text-muted-foreground text-sm">No data yet.</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={statusData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
                <XAxis type="number" stroke="#A0AEC0" />
                <YAxis type="category" dataKey="name" stroke="#A0AEC0" width={80} />
                <Tooltip contentStyle={{ backgroundColor: '#1A1F3A', border: '1px solid #2D3748', borderRadius: '8px', color: '#F5F5F5' }} />
                <Bar dataKey="value" fill="#10B981" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent activity */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Recent Activity</h2>
          {activity.length === 0 ? <p className="text-muted-foreground text-sm">No activity yet.</p> : (
            <div className="space-y-3">
              {activity.map((a) => (
                <div key={a.id + a.type} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${a.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{a.label}</p>
                    <p className="text-xs text-muted-foreground">{new Date(a.time).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-bold text-foreground mb-4">Top Products</h2>
        {topProducts.length === 0 ? <p className="text-muted-foreground text-sm">No sales yet.</p> : (
          <div className="divide-y divide-border">
            {topProducts.map((product, i) => (
              <div key={product.name} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-primary/20 rounded-md flex items-center justify-center text-xs font-bold text-primary">{i + 1}</div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.sales} units</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-accent">${product.revenue.toFixed(0)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  confirmed:              'bg-blue-500/20 text-blue-400',
  processing:             'bg-yellow-500/20 text-yellow-400',
  shipped:                'bg-purple-500/20 text-purple-400',
  delivered:              'bg-green-500/20 text-green-400',
  cancelled:              'bg-red-500/20 text-red-400',
  cancellation_requested: 'bg-orange-500/20 text-orange-400',
  cancellation_rejected:  'bg-yellow-500/20 text-yellow-400',
};

const ORDER_STATUSES = ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

// ─── Orders Tab ───────────────────────────────────────────────────────────────
function OrdersTab({ orders }: { orders: Order[] }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const filtered = orders.filter((o) => {
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    const term = search.toLowerCase();
    const matchSearch =
      !term ||
      o.id.toLowerCase().includes(term) ||
      o.shipping?.email?.toLowerCase().includes(term) ||
      `${o.shipping?.firstName} ${o.shipping?.lastName}`.toLowerCase().includes(term);
    return matchStatus && matchSearch;
  });

  const updateStatus = async (orderId: string, status: string) => {
    setUpdating(orderId);
    await updateDoc(doc(db, 'orders', orderId), { status });
    setUpdating(null);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, name or email…"
            className="w-full pl-9 pr-4 py-2 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-muted border border-border text-sm text-foreground px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Statuses</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <span className="text-sm text-muted-foreground">{filtered.length} order{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="hidden md:grid grid-cols-[1fr_1.5fr_1fr_1fr_1.5fr_40px] gap-4 px-5 py-3 border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          <span>Order ID</span><span>Customer</span><span>Date</span><span>Total</span><span>Status</span><span />
        </div>

        {filtered.length === 0 ? (
          <p className="text-muted-foreground text-sm p-6">No orders found.</p>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((order) => (
              <div key={order.id}>
                {/* Row */}
                <div className="grid grid-cols-2 md:grid-cols-[1fr_1.5fr_1fr_1fr_1.5fr_40px] gap-4 px-5 py-4 items-center hover:bg-muted/30 transition-colors">
                  <p className="text-xs font-mono text-foreground truncate">{order.id.slice(0, 12)}…</p>

                  <div className="hidden md:block">
                    <p className="text-sm text-foreground font-medium">
                      {order.shipping ? `${order.shipping.firstName} ${order.shipping.lastName}` : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">{order.shipping?.email || order.userId.slice(0, 10)}</p>
                  </div>

                  <p className="text-sm text-muted-foreground hidden md:block">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>

                  <p className="text-sm font-bold text-accent">${order.total?.toFixed(2)}</p>

                  {/* Status selector */}
                  <div className="col-span-2 md:col-span-1">
                    {order.status === 'cancellation_requested' ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-orange-500/20 text-orange-400">Cancel Requested</span>
                        <button
                          disabled={updating === order.id}
                          onClick={() => updateStatus(order.id, 'cancelled')}
                          className="text-xs font-semibold px-2 py-1 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/40 transition-colors disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          disabled={updating === order.id}
                          onClick={() => updateStatus(order.id, 'cancellation_rejected')}
                          className="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/40 transition-colors disabled:opacity-50"
                        >
                          Reject
                        </button>
                        {updating === order.id && <span className="text-xs text-muted-foreground">Saving…</span>}
                      </div>
                    ) : (
                      <>
                        <select
                          value={order.status}
                          disabled={updating === order.id}
                          onChange={(e) => updateStatus(order.id, e.target.value)}
                          className={`text-xs font-semibold px-2 py-1 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer ${
                            STATUS_COLORS[order.status] || 'bg-muted text-foreground'
                          }`}
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                          ))}
                        </select>
                        {updating === order.id && <span className="text-xs text-muted-foreground ml-2">Saving…</span>}
                      </>
                    )}
                  </div>

                  {/* Expand toggle */}
                  <button
                    onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {expanded === order.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Expanded details */}
                {expanded === order.id && (
                  <div className="px-5 pb-5 bg-muted/20 border-t border-border space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-3">Order Items</p>
                    <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
                      {order.items?.map((item, i) => (
                        <div key={i} className="flex justify-between items-center px-4 py-2.5 bg-card">
                          <div>
                            <p className="text-sm font-medium text-foreground">{item.name}</p>
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                          <p className="text-sm font-semibold text-foreground">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Order Total</p>
                        <p className="font-bold text-accent">${order.total?.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Placed On</p>
                        <p className="text-foreground">{new Date(order.createdAt).toLocaleString()}</p>
                      </div>
                      {order.stripeSessionId && (
                        <div>
                          <p className="text-xs text-muted-foreground">Stripe Session</p>
                          <p className="font-mono text-xs text-foreground truncate">{order.stripeSessionId}</p>
                        </div>
                      )}
                      {order.shipping && (
                        <div className="col-span-2 md:col-span-3">
                          <p className="text-xs text-muted-foreground mb-1">Shipping Address</p>
                          <p className="text-foreground text-sm">
                            {order.shipping.firstName} {order.shipping.lastName} — {order.shipping.email}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Support Tab ───────────────────────────────────────────────────────────
function SupportTab() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'support_tickets'), (snap) => {
      setTickets(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as SupportTicket))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      );
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!selected) return;
    const unsub = onSnapshot(
      query(collection(db, 'support_tickets', selected.id, 'messages'), orderBy('createdAt', 'asc')),
      (snap) => setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as SupportMessage))),
    );
    return unsub;
  }, [selected?.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleReply = async () => {
    if (!reply.trim() || !selected) return;
    setSending(true);
    await addDoc(collection(db, 'support_tickets', selected.id, 'messages'), {
      sender: 'admin', text: reply.trim(), createdAt: new Date().toISOString(),
    });
    await updateDoc(doc(db, 'support_tickets', selected.id), { status: 'replied', updatedAt: new Date().toISOString() });
    setReply('');
    setSending(false);
  };

  const closeTicket = async (id: string) => {
    await updateDoc(doc(db, 'support_tickets', id), { status: 'closed' });
    if (selected?.id === id) setSelected(null);
  };

  const TICKET_COLORS: Record<string, string> = {
    open:    'bg-blue-500/20 text-blue-400',
    replied: 'bg-green-500/20 text-green-400',
    closed:  'bg-muted text-muted-foreground',
  };

  return (
    <div className="flex gap-4 h-[600px]">
      {/* Ticket list */}
      <div className="w-72 flex-shrink-0 bg-card border border-border rounded-lg overflow-y-auto">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tickets ({tickets.length})</p>
        </div>
        {tickets.length === 0 && <p className="text-sm text-muted-foreground p-4">No support tickets yet.</p>}
        {tickets.map((t) => (
          <button key={t.id} onClick={() => setSelected(t)}
            className={`w-full text-left px-4 py-3 border-b border-border hover:bg-muted/40 transition-colors ${
              selected?.id === t.id ? 'bg-primary/10 border-l-2 border-l-primary' : ''
            }`}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-mono text-foreground truncate max-w-[120px]">{t.orderId.slice(0, 12)}…</p>
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${TICKET_COLORS[t.status] || 'bg-muted text-muted-foreground'}`}>
                {t.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</p>
          </button>
        ))}
      </div>

      {/* Chat panel */}
      {selected ? (
        <div className="flex-1 bg-card border border-border rounded-lg flex flex-col">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <div>
              <p className="text-sm font-semibold text-foreground">Order: <span className="font-mono">{selected.orderId.slice(0, 16)}…</span></p>
              <p className="text-xs text-muted-foreground">User: {selected.userId.slice(0, 16)}…</p>
            </div>
            <button onClick={() => closeTicket(selected.id)}
              className="text-xs px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors">
              Close Ticket
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {messages.length === 0 && <p className="text-xs text-muted-foreground text-center pt-6">No messages yet.</p>}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${
                  m.sender === 'admin' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted text-foreground rounded-bl-none'
                }`}>
                  {m.sender === 'user' && <p className="text-xs font-semibold mb-0.5 text-primary">User</p>}
                  <p>{m.text}</p>
                  <p className="text-xs opacity-60 mt-0.5 text-right">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="px-4 py-3 border-t border-border flex gap-2">
            <input value={reply} onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
              placeholder="Reply to user…"
              className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            <button onClick={handleReply} disabled={sending || !reply.trim()}
              className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">Send</button>
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-card border border-border rounded-lg flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Select a ticket to view the conversation</p>
        </div>
      )}
    </div>
  );
}

// ─── Returns Tab ─────────────────────────────────────────────────────────────
interface AdminReturnRequest extends ReturnRequest {
  userId: string; details?: string; adminNote?: string; exchangeDate?: string; pickupDate?: string; hasUnread?: boolean;
}

const RETURN_STATUS_META: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'Pending',           cls: 'bg-yellow-500/20 text-yellow-400' },
  approved:  { label: 'Approved',          cls: 'bg-green-500/20 text-green-400' },
  rejected:  { label: 'Rejected',          cls: 'bg-red-500/20 text-red-400' },
  pickup:    { label: 'Pickup Scheduled',  cls: 'bg-blue-500/20 text-blue-400' },
  completed: { label: 'Completed',         cls: 'bg-accent/20 text-accent' },
};

interface AdminReturnMsg { id: string; sender: 'user' | 'admin'; text: string; createdAt: string; }

function AdminReturnChat({ returnId }: { returnId: string }) {
  const [messages, setMessages] = useState<AdminReturnMsg[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'returns', returnId, 'messages'), orderBy('createdAt', 'asc')),
      (snap) => setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AdminReturnMsg))),
    );
    return unsub;
  }, [returnId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!reply.trim()) return;
    setSending(true);
    await addDoc(collection(db, 'returns', returnId, 'messages'), {
      sender: 'admin', text: reply.trim(), createdAt: new Date().toISOString(),
    });
    await updateDoc(doc(db, 'returns', returnId), { hasUnread: false });
    setReply('');
    setSending(false);
  };

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Messages</p>
      <div className="bg-muted/30 rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
        {messages.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">No messages yet.</p>}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-3 py-1.5 rounded-xl text-xs ${
              m.sender === 'admin'
                ? 'bg-primary text-primary-foreground rounded-br-none'
                : 'bg-card border border-border text-foreground rounded-bl-none'
            }`}>
              {m.sender === 'user' && <p className="font-semibold text-primary mb-0.5">User</p>}
              <p>{m.text}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2">
        <input value={reply} onChange={(e) => setReply(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); send(); } }}
          placeholder="Reply to user…"
          className="flex-1 px-3 py-1.5 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
        <button onClick={send} disabled={sending || !reply.trim()}
          className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50">Send</button>
      </div>
    </div>
  );
}

function ReturnsTab({ returns: rawReturns }: { returns: ReturnRequest[] }) {
  const returns = rawReturns as AdminReturnRequest[];
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState<Record<string, string>>({});
  const [dateInput, setDateInput] = useState<Record<string, string>>({});
  const [pickupInput, setPickupInput] = useState<Record<string, string>>({});

  const filtered = returns.filter((r) => {
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchType   = typeFilter   === 'all' || r.type   === typeFilter;
    return matchStatus && matchType;
  });

  const act = async (id: string, updates: Record<string, string>) => {
    setUpdating(id);
    await updateDoc(doc(db, 'returns', id), updates);
    setUpdating(null);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-muted border border-border text-sm text-foreground px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="all">All Statuses</option>
          {['pending', 'approved', 'rejected', 'pickup', 'completed'].map((s) => (
            <option key={s} value={s}>{RETURN_STATUS_META[s]?.label || s}</option>
          ))}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-muted border border-border text-sm text-foreground px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="all">All Types</option>
          <option value="return">Return</option>
          <option value="exchange">Exchange</option>
        </select>
        <span className="text-sm text-muted-foreground">{filtered.length} request{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm p-4">No requests found.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const meta = RETURN_STATUS_META[r.status] || { label: r.status, cls: 'bg-muted text-muted-foreground' };
            const isOpen = expanded === r.id;
            return (
              <div key={r.id} className="bg-card border border-border rounded-xl overflow-hidden">
                {/* Row header */}
                <button onClick={() => setExpanded(isOpen ? null : r.id)}
                  className="w-full text-left px-5 py-4 hover:bg-muted/30 transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <RefreshCw className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{r.itemName}</p>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                            r.type === 'exchange' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                          }`}>{r.type}</span>
                          {r.hasUnread && <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" title="Unread message" />}
                        </div>
                        <p className="text-xs text-muted-foreground">{r.reason} · {r.userId.slice(0, 14)}…</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground hidden sm:block">{new Date(r.createdAt).toLocaleDateString()}</p>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${meta.cls}`}>{meta.label}</span>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>
                </button>

                {/* Expanded panel */}
                {isOpen && (
                  <div className="border-t border-border px-5 pb-5 space-y-4">
                    {/* Details */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-3 text-sm">
                      <div><p className="text-xs text-muted-foreground">Order ID</p><p className="font-mono text-xs text-foreground">{r.orderId.slice(0, 16)}…</p></div>
                      <div><p className="text-xs text-muted-foreground">User ID</p><p className="font-mono text-xs text-foreground">{r.userId.slice(0, 16)}…</p></div>
                      <div><p className="text-xs text-muted-foreground">Submitted</p><p className="text-foreground">{new Date(r.createdAt).toLocaleString()}</p></div>
                      {r.details && <div className="col-span-2 md:col-span-3"><p className="text-xs text-muted-foreground">User details</p><p className="text-foreground">{r.details}</p></div>}
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</p>

                      {/* Approve / Reject */}
                      {(r.status === 'pending') && (
                        <div className="flex flex-wrap gap-2 items-end">
                          <div className="flex-1 min-w-[180px]">
                            <label className="text-xs text-muted-foreground">Admin note (optional)</label>
                            <input value={noteInput[r.id] || ''} onChange={(e) => setNoteInput((p) => ({ ...p, [r.id]: e.target.value }))}
                              placeholder="Reason or instructions…"
                              className="w-full mt-1 px-3 py-1.5 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                          </div>
                          <button disabled={updating === r.id}
                            onClick={() => act(r.id, { status: 'approved', adminNote: noteInput[r.id] || '' })}
                            className="px-3 py-2 text-xs font-semibold rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/40 disabled:opacity-50 transition-colors">
                            Approve
                          </button>
                          <button disabled={updating === r.id}
                            onClick={() => act(r.id, { status: 'rejected', adminNote: noteInput[r.id] || '' })}
                            className="px-3 py-2 text-xs font-semibold rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/40 disabled:opacity-50 transition-colors">
                            Reject
                          </button>
                        </div>
                      )}

                      {/* Schedule pickup date (for returns) */}
                      {(r.status === 'approved' || r.status === 'pickup') && r.type === 'return' && (
                        <div className="flex flex-wrap gap-2 items-end">
                          <div>
                            <label className="text-xs text-muted-foreground">Pickup Date</label>
                            <input type="date" value={pickupInput[r.id] || r.pickupDate?.slice(0, 10) || ''}
                              onChange={(e) => setPickupInput((p) => ({ ...p, [r.id]: e.target.value }))}
                              className="mt-1 px-3 py-1.5 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                          </div>
                          <button disabled={updating === r.id || !pickupInput[r.id]}
                            onClick={() => act(r.id, { status: 'pickup', pickupDate: pickupInput[r.id] })}
                            className="px-3 py-2 text-xs font-semibold rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/40 disabled:opacity-50 transition-colors">
                            Set Pickup
                          </button>
                          <button disabled={updating === r.id}
                            onClick={() => act(r.id, { status: 'completed' })}
                            className="px-3 py-2 text-xs font-semibold rounded-lg bg-accent/20 text-accent hover:bg-accent/40 disabled:opacity-50 transition-colors">
                            Mark Completed
                          </button>
                        </div>
                      )}

                      {/* Schedule exchange date */}
                      {(r.status === 'approved' || r.status === 'pickup') && r.type === 'exchange' && (
                        <div className="flex flex-wrap gap-2 items-end">
                          <div>
                            <label className="text-xs text-muted-foreground">Exchange Date</label>
                            <input type="date" value={dateInput[r.id] || r.exchangeDate?.slice(0, 10) || ''}
                              onChange={(e) => setDateInput((p) => ({ ...p, [r.id]: e.target.value }))}
                              className="mt-1 px-3 py-1.5 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                          </div>
                          <button disabled={updating === r.id || !dateInput[r.id]}
                            onClick={() => act(r.id, { status: 'pickup', exchangeDate: dateInput[r.id] })}
                            className="px-3 py-2 text-xs font-semibold rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/40 disabled:opacity-50 transition-colors">
                            Schedule Exchange
                          </button>
                          <button disabled={updating === r.id}
                            onClick={() => act(r.id, { status: 'completed' })}
                            className="px-3 py-2 text-xs font-semibold rounded-lg bg-accent/20 text-accent hover:bg-accent/40 disabled:opacity-50 transition-colors">
                            Mark Completed
                          </button>
                        </div>
                      )}

                      {/* Update note on approved/pickup */}
                      {(r.status === 'approved' || r.status === 'pickup') && (
                        <div className="flex gap-2 items-end">
                          <div className="flex-1">
                            <label className="text-xs text-muted-foreground">Update note for user</label>
                            <input value={noteInput[r.id] !== undefined ? noteInput[r.id] : (r.adminNote || '')}
                              onChange={(e) => setNoteInput((p) => ({ ...p, [r.id]: e.target.value }))}
                              placeholder="Instructions, refund info, etc."
                              className="w-full mt-1 px-3 py-1.5 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                          </div>
                          <button disabled={updating === r.id}
                            onClick={() => act(r.id, { adminNote: noteInput[r.id] || '' })}
                            className="px-3 py-2 text-xs font-semibold rounded-lg bg-muted text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors">
                            Save Note
                          </button>
                        </div>
                      )}

                      {r.status === 'completed' && (
                        <span className="text-xs font-semibold text-accent">✓ This request is completed.</span>
                      )}
                    </div>

                    {/* Chat */}
                    <AdminReturnChat returnId={r.id} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Payments Tab ────────────────────────────────────────────────────────────
function PaymentsTab({ orders }: { orders: Order[] }) {
  const [search, setSearch] = useState('');

  // Only orders that have a Stripe session are real payments; COD orders won't have one
  const payments = orders.filter((o) =>
    !search ||
    o.id.toLowerCase().includes(search.toLowerCase()) ||
    o.stripeSessionId?.toLowerCase().includes(search.toLowerCase()) ||
    o.shipping?.email?.toLowerCase().includes(search.toLowerCase())
  );

  const stripeTotal  = orders.filter((o) => o.stripeSessionId).reduce((s, o) => s + (o.total || 0), 0);
  const codTotal     = orders.filter((o) => !o.stripeSessionId).reduce((s, o) => s + (o.total || 0), 0);
  const stripeCount  = orders.filter((o) => o.stripeSessionId).length;
  const codCount     = orders.filter((o) => !o.stripeSessionId).length;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Stripe Payments', value: stripeCount, sub: `$${stripeTotal.toFixed(2)} total`, color: 'bg-purple-500/20 text-purple-400' },
          { label: 'Cash on Delivery', value: codCount,   sub: `$${codTotal.toFixed(2)} total`,   color: 'bg-yellow-500/20 text-yellow-400' },
          { label: 'Total Collected',  value: orders.length, sub: `$${(stripeTotal + codTotal).toFixed(2)}`, color: 'bg-green-500/20 text-green-400' },
          { label: 'Avg Order Value',  value: orders.length ? `$${((stripeTotal + codTotal) / orders.length).toFixed(2)}` : '—', sub: 'per order', color: 'bg-blue-500/20 text-blue-400' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{sub}</p>
            <div className={`mt-2 h-1 rounded-full ${color.split(' ')[0]}`} />
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order ID, session or email…"
          className="w-full pl-9 pr-4 py-2 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="hidden md:grid grid-cols-[1fr_1.5fr_1fr_1.2fr_1.5fr_1fr] gap-4 px-5 py-3 border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          <span>Order ID</span><span>Customer</span><span>Date</span><span>Amount</span><span>Stripe Session</span><span>Method</span>
        </div>

        {payments.length === 0 ? (
          <p className="text-muted-foreground text-sm p-6">No payments found.</p>
        ) : (
          <div className="divide-y divide-border">
            {payments.map((o) => (
              <div key={o.id} className="grid grid-cols-2 md:grid-cols-[1fr_1.5fr_1fr_1.2fr_1.5fr_1fr] gap-4 px-5 py-4 items-center hover:bg-muted/30 transition-colors">
                <p className="text-xs font-mono text-foreground truncate">{o.id.slice(0, 12)}…</p>

                <div className="hidden md:block">
                  <p className="text-sm font-medium text-foreground">
                    {o.shipping ? `${o.shipping.firstName} ${o.shipping.lastName}` : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">{o.shipping?.email || o.userId.slice(0, 10)}</p>
                </div>

                <p className="text-sm text-muted-foreground hidden md:block">
                  {new Date(o.createdAt).toLocaleDateString()}
                </p>

                <p className="text-sm font-bold text-accent">${o.total?.toFixed(2)}</p>

                <p className="text-xs font-mono text-muted-foreground hidden md:block truncate">
                  {o.stripeSessionId ? o.stripeSessionId.slice(0, 20) + '…' : '—'}
                </p>

                <span className={`text-xs font-semibold px-2 py-1 rounded-full w-fit ${
                  o.stripeSessionId
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {o.stripeSessionId ? 'Stripe' : 'COD'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Users Tab ───────────────────────────────────────────────────────────────
function UsersTab({ users }: { users: UserRecord[] }) {
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  const filtered = users.filter((u) => {
    const term = search.toLowerCase();
    return !term || u.name?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term) || u.uid?.toLowerCase().includes(term);
  });

  const toggleRole = async (uid: string, currentRole: string) => {
    setUpdating(uid);
    await updateDoc(doc(db, 'users', uid), { role: currentRole === 'admin' ? 'user' : 'admin' });
    setUpdating(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or UID…"
            className="w-full pl-9 pr-4 py-2 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <span className="text-sm text-muted-foreground">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="hidden md:grid grid-cols-[2fr_2fr_1.5fr_1fr_1.4fr] gap-4 px-5 py-3 border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          <span>Name</span><span>Email</span><span>UID</span><span>Joined</span><span>Role</span>
        </div>

        {filtered.length === 0 ? (
          <p className="text-muted-foreground text-sm p-6">No users found.</p>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((u) => (
              <div key={u.uid} className="grid grid-cols-2 md:grid-cols-[2fr_2fr_1.5fr_1fr_1.4fr] gap-4 px-5 py-4 items-center hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                    {u.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">{u.name || '—'}</p>
                </div>

                <p className="text-sm text-muted-foreground hidden md:block truncate">{u.email}</p>

                <p className="text-xs font-mono text-muted-foreground hidden md:block truncate">{u.uid?.slice(0, 12)}…</p>

                <p className="text-sm text-muted-foreground hidden md:block">
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                </p>

                <div className="col-span-2 md:col-span-1 flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    u.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>
                    {u.role}
                  </span>
                  <button
                    disabled={updating === u.uid}
                    onClick={() => toggleRole(u.uid, u.role)}
                    className="text-xs px-2 py-1 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary transition-colors disabled:opacity-50"
                  >
                    {updating === u.uid ? 'Saving…' : u.role === 'admin' ? '→ user' : '→ admin'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Products Tab (Full CRUD) ─────────────────────────────────────────────────
const EMPTY_FORM = { name: '', price: '', basePrice: '', stock: '', category: 'Electronics', image: '', description: '', rating: '4.5' };
type ProductForm = typeof EMPTY_FORM;

function ProductModal({ initial, onSave, onClose }: {
  initial?: ProductForm & { id?: string };
  onSave: (data: ProductForm, id?: string) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ProductForm>(initial ?? EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof ProductForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name || !form.price || !form.stock) return;
    setSaving(true);
    await onSave(form, initial?.id);
    setSaving(false);
    onClose();
  };

  const inp = 'w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl w-full max-w-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">{initial?.id ? 'Edit Product' : 'Add Product'}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground hover:text-foreground" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className="text-xs text-muted-foreground">Name</label><input className={inp} value={form.name} onChange={(e) => set('name', e.target.value)} /></div>
          <div><label className="text-xs text-muted-foreground">Price ($)</label><input type="number" className={inp} value={form.price} onChange={(e) => set('price', e.target.value)} /></div>
          <div><label className="text-xs text-muted-foreground">Base Price ($)</label><input type="number" className={inp} value={form.basePrice} onChange={(e) => set('basePrice', e.target.value)} /></div>
          <div><label className="text-xs text-muted-foreground">Stock</label><input type="number" className={inp} value={form.stock} onChange={(e) => set('stock', e.target.value)} /></div>
          <div><label className="text-xs text-muted-foreground">Rating (0–5)</label><input type="number" step="0.1" min="0" max="5" className={inp} value={form.rating} onChange={(e) => set('rating', e.target.value)} /></div>
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground">Category</label>
            <select className={inp} value={form.category} onChange={(e) => set('category', e.target.value)}>
              {['Electronics','Fashion','Home','Books','Sports'].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="col-span-2"><label className="text-xs text-muted-foreground">Image URL</label><input className={inp} value={form.image} onChange={(e) => set('image', e.target.value)} /></div>
          <div className="col-span-2"><label className="text-xs text-muted-foreground">Description</label><textarea rows={2} className={inp} value={form.description} onChange={(e) => set('description', e.target.value)} /></div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:text-foreground">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductsTab({ orders }: { orders: Order[] }) {
  const [products, setProducts] = useState<(Product & { firestoreId?: string })[]>(STATIC_PRODUCTS);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [modal, setModal] = useState<null | 'add' | (Product & { firestoreId?: string })>(null);
  const [deleteTarget, setDeleteTarget] = useState<null | (Product & { firestoreId?: string })>(null);
  const [editingStock, setEditingStock] = useState<null | string>(null);
  const [stockVal, setStockVal] = useState('');

  // Live-sync Firestore products on top of static list
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'products'), (snap) => {
      if (snap.empty) return;
      const fsDocs = snap.docs.map((d) => ({ ...d.data(), firestoreId: d.id } as Product & { firestoreId: string }));
      setProducts((prev) => {
        const merged = [...prev];
        fsDocs.forEach((fp) => {
          const idx = merged.findIndex((p) => p.id === fp.id || p.firestoreId === fp.firestoreId);
          if (idx >= 0) merged[idx] = fp; else merged.push(fp);
        });
        return merged;
      });
    });
    return unsub;
  }, []);

  const salesMap: Record<string, { sales: number; revenue: number }> = {};
  orders.forEach((o) => o.items?.forEach((item) => {
    if (!salesMap[item.productId]) salesMap[item.productId] = { sales: 0, revenue: 0 };
    salesMap[item.productId].sales += item.quantity;
    salesMap[item.productId].revenue += item.price * item.quantity;
  }));

  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category)))];
  const filtered = products.filter((p) => {
    const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
    const term = search.toLowerCase();
    return matchCat && (!term || p.name.toLowerCase().includes(term));
  });

  const handleSave = async (form: ProductForm, id?: string) => {
    const data = {
      name: form.name, category: form.category, image: form.image,
      description: form.description,
      price: +form.price, basePrice: +(form.basePrice || form.price),
      stock: +form.stock, rating: +form.rating,
    };
    if (id) {
      await updateDoc(doc(db, 'products', id), data);
    } else {
      const newId = `p_${Date.now()}`;
      await addDoc(collection(db, 'products'), { ...data, id: newId });
    }
  };

  const handleDelete = async (p: Product & { firestoreId?: string }) => {
    if (p.firestoreId) await deleteDoc(doc(db, 'products', p.firestoreId));
    setProducts((prev) => prev.filter((x) => x.id !== p.id));
    setDeleteTarget(null);
  };

  const saveStock = async (p: Product & { firestoreId?: string }) => {
    const newStock = parseInt(stockVal);
    if (isNaN(newStock)) return setEditingStock(null);
    if (p.firestoreId) {
      await updateDoc(doc(db, 'products', p.firestoreId), { stock: newStock });
    } else {
      await updateDoc(doc(db, 'inventory', p.id), { stock: newStock });
    }
    setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, stock: newStock } : x));
    setEditingStock(null);
  };

  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 5).length;
  const outOfStock = products.filter((p) => p.stock === 0).length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Products', value: products.length,                              color: 'bg-blue-500/20' },
          { label: 'Units in Stock', value: products.reduce((s, p) => s + p.stock, 0),    color: 'bg-green-500/20' },
          { label: 'Low Stock (≤5)', value: lowStock,                                      color: 'bg-yellow-500/20' },
          { label: 'Out of Stock',   value: outOfStock,                                    color: 'bg-red-500/20' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <div className={`mt-2 h-1 rounded-full ${color}`} />
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…"
            className="w-full pl-9 pr-4 py-2 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-muted border border-border text-sm text-foreground px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
          {categories.map((c) => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
        </select>
        <span className="text-sm text-muted-foreground flex-1">{filtered.length} product{filtered.length !== 1 ? 's' : ''}</span>
        <button onClick={() => setModal('add')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1.2fr_80px] gap-4 px-5 py-3 border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          <span>Product</span><span>Category</span><span>Price</span><span>Stock</span><span>Sold</span><span>Revenue</span><span>Actions</span>
        </div>
        {filtered.length === 0 ? <p className="text-muted-foreground text-sm p-6">No products found.</p> : (
          <div className="divide-y divide-border">
            {filtered.map((p) => {
              const stats = salesMap[p.id] || { sales: 0, revenue: 0 };
              const stockColor = p.stock === 0 ? 'text-red-400' : p.stock <= 5 ? 'text-yellow-400' : 'text-green-400';
              return (
                <div key={p.id} className="grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_1.2fr_80px] gap-4 px-5 py-4 items-center hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">★ {p.rating}</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground w-fit hidden md:block">{p.category}</span>
                  <p className="text-sm text-foreground hidden md:block">${p.price}</p>

                  {/* Inline stock edit */}
                  <div className="hidden md:flex items-center gap-1">
                    {editingStock === p.id ? (
                      <>
                        <input autoFocus type="number" value={stockVal} onChange={(e) => setStockVal(e.target.value)}
                          className="w-16 px-2 py-1 bg-muted border border-primary rounded text-sm text-foreground focus:outline-none"
                          onKeyDown={(e) => { if (e.key === 'Enter') saveStock(p); if (e.key === 'Escape') setEditingStock(null); }} />
                        <button onClick={() => saveStock(p)} className="text-green-400 hover:text-green-300"><Pencil className="w-3 h-3" /></button>
                        <button onClick={() => setEditingStock(null)} className="text-muted-foreground hover:text-foreground"><X className="w-3 h-3" /></button>
                      </>
                    ) : (
                      <button onClick={() => { setEditingStock(p.id); setStockVal(String(p.stock)); }}
                        className={`text-sm font-semibold ${stockColor} hover:underline`}>
                        {p.stock}{p.stock === 0 ? ' ✕' : p.stock <= 5 ? ' ⚠' : ''}
                      </button>
                    )}
                  </div>

                  <p className="text-sm text-foreground">{stats.sales}</p>
                  <p className="text-sm font-bold text-accent">${stats.revenue.toFixed(0)}</p>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button onClick={() => setModal(p)} className="p-1.5 rounded-lg bg-muted hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteTarget(p)} className="p-1.5 rounded-lg bg-muted hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      {modal && modal !== 'add' && (
        <ProductModal
          initial={{ name: modal.name, price: String(modal.price), basePrice: String(modal.basePrice), stock: String(modal.stock),
            category: modal.category, image: modal.image, description: modal.description, rating: String(modal.rating), id: modal.firestoreId }}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'add' && <ProductModal onSave={handleSave} onClose={() => setModal(null)} />}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-lg font-bold text-foreground">Delete Product?</h3>
            <p className="text-sm text-muted-foreground">This will remove <span className="font-semibold text-foreground">{deleteTarget.name}</span> from Firestore. Static catalogue products will reappear on refresh.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:text-foreground">Cancel</button>
              <button onClick={() => handleDelete(deleteTarget)} className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Inventory Tab ───────────────────────────────────────────────────────────
const RESTOCK_TO = 20;

function InventoryTab() {
  const [items, setItems] = useState<(Product & { firestoreId?: string })[]>(STATIC_PRODUCTS);
  const [saving, setSaving] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
  const [search, setSearch] = useState('');

  // Merge Firestore inventory overrides
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'inventory'), (snap) => {
      const stored: Record<string, number> = {};
      snap.docs.forEach((d) => { stored[d.id] = (d.data() as { stock: number }).stock; });
      setItems(STATIC_PRODUCTS.map((p) => ({ ...p, stock: stored[p.id] ?? p.stock })));
    });
    return unsub;
  }, []);

  const updateStock = async (id: string, newStock: number) => {
    setSaving(id);
    await setDoc(doc(db, 'inventory', id), { stock: newStock }, { merge: true });
    setItems((prev) => prev.map((p) => p.id === id ? { ...p, stock: newStock } : p));
    setSaving(null);
  };

  const restockAll = async () => {
    const targets = items.filter((p) => p.stock <= 5);
    for (const p of targets) await updateStock(p.id, RESTOCK_TO);
  };

  const applyOverride = async (p: Product) => {
    const val = parseInt(overrides[p.id] ?? '');
    if (isNaN(val) || val < 0) return;
    await updateStock(p.id, val);
    setOverrides((o) => { const n = { ...o }; delete n[p.id]; return n; });
  };

  const displayed = items.filter((p) => {
    const matchFilter = filter === 'all' || (filter === 'low' && p.stock > 0 && p.stock <= 5) || (filter === 'out' && p.stock === 0);
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const outCount  = items.filter((p) => p.stock === 0).length;
  const lowCount  = items.filter((p) => p.stock > 0 && p.stock <= 5).length;
  const okCount   = items.filter((p) => p.stock > 5).length;
  const totalUnits = items.reduce((s, p) => s + p.stock, 0);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Units',   value: totalUnits, color: 'bg-blue-500/20 text-blue-400' },
          { label: 'In Stock',      value: okCount,    color: 'bg-green-500/20 text-green-400' },
          { label: 'Low Stock ≤5',  value: lowCount,   color: 'bg-yellow-500/20 text-yellow-400' },
          { label: 'Out of Stock',  value: outCount,   color: 'bg-red-500/20 text-red-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color.split(' ')[1]}`}>{value}</p>
            <div className={`mt-2 h-1 rounded-full ${color.split(' ')[0]}`} />
          </div>
        ))}
      </div>

      {/* Alerts banner */}
      {(outCount > 0 || lowCount > 0) && (
        <div className="flex items-center justify-between bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-3">
          <p className="text-sm text-yellow-400 font-medium">
            ⚠ {outCount} out-of-stock · {lowCount} low-stock product{lowCount !== 1 ? 's' : ''} need attention
          </p>
          <button
            onClick={restockAll}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors"
          >
            Restock all low/out → {RESTOCK_TO}
          </button>
        </div>
      )}

      {/* Stock bar chart */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-bold text-foreground mb-4">Stock Levels</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={items.map((p) => ({ name: p.name.split(' ').slice(0, 2).join(' '), stock: p.stock, fill: p.stock === 0 ? '#EF4444' : p.stock <= 5 ? '#F59E0B' : '#10B981' }))} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
            <XAxis type="number" stroke="#A0AEC0" />
            <YAxis type="category" dataKey="name" stroke="#A0AEC0" width={130} tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="stock" radius={[0, 4, 4, 0]}>
              {items.map((p, i) => (
                <Cell key={i} fill={p.stock === 0 ? '#EF4444' : p.stock <= 5 ? '#F59E0B' : '#10B981'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…"
            className="w-full pl-9 pr-4 py-2 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        {(['all', 'low', 'out'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
              filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}>
            {f === 'all' ? 'All' : f === 'low' ? '⚠ Low Stock' : '✕ Out of Stock'}
          </button>
        ))}
        <span className="text-sm text-muted-foreground">{displayed.length} item{displayed.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_160px] gap-4 px-5 py-3 border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          <span>Product</span><span>Category</span><span>Current Stock</span><span>Status</span><span>Set Stock</span>
        </div>
        {displayed.length === 0 ? <p className="text-muted-foreground text-sm p-6">No items match.</p> : (
          <div className="divide-y divide-border">
            {displayed.map((p) => {
              const status = p.stock === 0 ? { label: 'Out of Stock', cls: 'bg-red-500/20 text-red-400' }
                : p.stock <= 5 ? { label: 'Low Stock', cls: 'bg-yellow-500/20 text-yellow-400' }
                : { label: 'In Stock', cls: 'bg-green-500/20 text-green-400' };
              const stockColor = p.stock === 0 ? 'text-red-400' : p.stock <= 5 ? 'text-yellow-400' : 'text-green-400';
              return (
                <div key={p.id} className="grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr_160px] gap-4 px-5 py-4 items-center hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <img src={p.image} alt={p.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                    <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground w-fit hidden md:block">{p.category}</span>
                  <p className={`text-lg font-bold hidden md:block ${stockColor}`}>{p.stock}</p>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full w-fit hidden md:block ${status.cls}`}>{status.label}</span>

                  {/* Set stock input + quick restock */}
                  <div className="col-span-2 md:col-span-1 flex items-center gap-2">
                    <input
                      type="number" min="0"
                      placeholder={String(p.stock)}
                      value={overrides[p.id] ?? ''}
                      onChange={(e) => setOverrides((o) => ({ ...o, [p.id]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Enter') applyOverride(p); }}
                      className="w-20 px-2 py-1.5 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      disabled={saving === p.id || overrides[p.id] === undefined || overrides[p.id] === ''}
                      onClick={() => applyOverride(p)}
                      className="px-2 py-1.5 text-xs font-semibold rounded-lg bg-primary/20 text-primary hover:bg-primary/30 disabled:opacity-40 transition-colors"
                    >
                      {saving === p.id ? '…' : 'Set'}
                    </button>
                    {p.stock <= 5 && (
                      <button
                        disabled={saving === p.id}
                        onClick={() => updateStock(p.id, RESTOCK_TO)}
                        className="px-2 py-1.5 text-xs font-semibold rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 disabled:opacity-40 transition-colors"
                      >
                        +{RESTOCK_TO}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { userProfile, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Auth guard
  useEffect(() => {
    if (!loading && userProfile && userProfile.role !== 'admin') router.push('/');
  }, [userProfile, loading, router]);

  // One-time cleanup: remove admin's cart, wishlist, and orders from Firestore
  useEffect(() => {
    if (!userProfile?.uid || userProfile.role !== 'admin') return;
    const uid = userProfile.uid;
    (async () => {
      // Delete cart and wishlist docs
      await Promise.all([
        deleteDoc(doc(db, 'carts', uid)),
        deleteDoc(doc(db, 'wishlists', uid)),
      ]).catch(() => {});
      // Delete any orders placed by this admin
      const snap = await getDocs(query(collection(db, 'orders'), where('userId', '==', uid)));
      await Promise.all(snap.docs.map((d) => deleteDoc(d.ref))).catch(() => {});
    })();
  }, [userProfile?.uid]);

  // Live subscriptions
  useEffect(() => {
    if (userProfile?.role !== 'admin') return;

    const unsubs = [
      onSnapshot(query(collection(db, 'orders')), (snap) => {
        setOrders(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() } as Order))
            .filter((o) => o.userId !== userProfile.uid)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        );
        setDataLoading(false);
      }),
      onSnapshot(query(collection(db, 'returns')), (snap) => {
        setReturns(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() } as ReturnRequest))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        );
      }),
      onSnapshot(query(collection(db, 'users')), (snap) => {
        setUsers(snap.docs.map((d) => ({ ...d.data() } as UserRecord)));
      }),
    ];

    return () => unsubs.forEach((u) => u());
  }, [userProfile]);

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-24">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Live store management</p>
        </div>

        {/* Tab bar */}
        <div className="mb-8">
          {/* Mobile / tablet: grid of icon+label buttons */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 lg:hidden mb-2">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex flex-col items-center gap-1 px-2 py-3 rounded-xl text-xs font-semibold transition-colors border ${
                  tab === key
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </div>
          {/* Desktop: horizontal tab strip */}
          <div className="hidden lg:flex gap-1 border-b border-border">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px ${
                  tab === key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        {tab === 'overview'   && <OverviewTab orders={orders} returns={returns} userCount={users.length} />}
        {tab === 'analytics'  && <AnalyticsTab orders={orders} returns={returns} userCount={users.length} />}
        {tab === 'orders'     && <OrdersTab orders={orders} />}
        {tab === 'returns'    && <ReturnsTab returns={returns} />}
        {tab === 'support'    && <SupportTab />}
        {tab === 'payments'   && <PaymentsTab orders={orders} />}
        {tab === 'users'      && <UsersTab users={users} />}
        {tab === 'products'   && <ProductsTab orders={orders} />}
        {tab === 'inventory'  && <InventoryTab />}
      </div>
    </div>
  );
}
