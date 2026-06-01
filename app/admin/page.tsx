'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query, doc, updateDoc } from 'firebase/firestore';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, ShoppingCart, TrendingUp, Award } from 'lucide-react';
import { PRODUCTS } from '@/lib/products';

interface Order {
  id: string;
  userId: string;
  items: { name: string; quantity: number; price: number; productId: string }[];
  total: number;
  status: string;
  createdAt: string;
  shipping?: { firstName: string; lastName: string; email: string };
}

const CATEGORY_COLORS: Record<string, string> = {
  Electronics: '#7C3AED',
  Fashion: '#10B981',
  Home: '#06B6D4',
  Books: '#F59E0B',
  Sports: '#EC4899',
};

const ORDER_STATUSES = ['confirmed', 'processing', 'shipped', 'delivered'];

export default function AdminDashboard() {
  const { userProfile, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);

  const updateOrderStatus = async (orderId: string, status: string) => {
    await updateDoc(doc(db, 'orders', orderId), { status });
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o));
  };

  useEffect(() => {
    if (!loading && userProfile && userProfile.role !== 'admin') {
      router.push('/');
    }
  }, [userProfile, loading, router]);

  useEffect(() => {
    if (userProfile?.role === 'admin') loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile]);

  const loadData = async () => {
    try {
      const [ordersSnap, usersSnap] = await Promise.all([
        getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'))),
        getDocs(collection(db, 'users')),
      ]);
      setOrders(ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Order)));
      setUserCount(usersSnap.size);
    } finally {
      setDataLoading(false);
    }
  };

  const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);

  // Revenue by month
  const revenueByMonth: Record<string, number> = {};
  orders.forEach((o) => {
    const month = new Date(o.createdAt).toLocaleString('default', { month: 'short' });
    revenueByMonth[month] = (revenueByMonth[month] || 0) + o.total;
  });
  const revenueData = Object.entries(revenueByMonth).map(([name, revenue]) => ({ name, revenue }));

  // Sales by category
  const categoryCount: Record<string, number> = {};
  orders.forEach((o) =>
    o.items?.forEach((item) => {
      const product = PRODUCTS.find((p) => p.id === item.productId);
      if (product) categoryCount[product.category] = (categoryCount[product.category] || 0) + item.quantity;
    }),
  );
  const categoryData = Object.entries(categoryCount).map(([name, value]) => ({
    name, value, color: CATEGORY_COLORS[name] || '#888',
  }));

  // Top products
  const productSales: Record<string, { name: string; sales: number; revenue: number }> = {};
  orders.forEach((o) =>
    o.items?.forEach((item) => {
      if (!productSales[item.name]) productSales[item.name] = { name: item.name, sales: 0, revenue: 0 };
      productSales[item.name].sales += item.quantity;
      productSales[item.name].revenue += item.price * item.quantity;
    }),
  );
  const topProducts = Object.values(productSales).sort((a, b) => b.sales - a.sales).slice(0, 5);

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-24">
          <div className="text-muted-foreground">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Live store overview</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-foreground">${totalRevenue.toFixed(0)}</p>
              </div>
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
                <p className="text-3xl font-bold text-foreground">{orders.length}</p>
              </div>
              <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-accent" />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Users</p>
                <p className="text-3xl font-bold text-foreground">{userCount}</p>
              </div>
              <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-secondary" />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Top Product</p>
                <p className="text-lg font-bold text-foreground truncate">{topProducts[0]?.name || '—'}</p>
              </div>
              <div className="w-12 h-12 bg-chart-1/20 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-chart-1" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">{topProducts[0]?.sales || 0} units sold</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Revenue by Month</h2>
            {revenueData.length === 0 ? (
              <p className="text-muted-foreground text-sm">No revenue data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
                  <XAxis dataKey="name" stroke="#A0AEC0" />
                  <YAxis stroke="#A0AEC0" />
                  <Tooltip contentStyle={{ backgroundColor: '#1A1F3A', border: '1px solid #2D3748', borderRadius: '8px', color: '#F5F5F5' }} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#7C3AED" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Sales by Category</h2>
            {categoryData.length === 0 ? (
              <p className="text-muted-foreground text-sm">No category data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value">
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1A1F3A', border: '1px solid #2D3748', borderRadius: '8px', color: '#F5F5F5' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Products & Recent Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Top Products</h2>
            {topProducts.length === 0 ? (
              <p className="text-muted-foreground text-sm">No sales data yet.</p>
            ) : (
              <div className="space-y-3">
                {topProducts.map((product, index) => (
                  <div key={product.name} className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center text-sm font-bold text-primary">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground truncate max-w-[160px]">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.sales} units</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-accent">${product.revenue.toFixed(0)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Recent Orders</h2>
            {orders.length === 0 ? (
              <p className="text-muted-foreground text-sm">No orders yet.</p>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
                    <div>
                      <p className="text-sm font-semibold text-foreground font-mono">{order.id.slice(0, 10)}...</p>
                      <p className="text-xs text-muted-foreground">
                        {order.shipping ? `${order.shipping.firstName} ${order.shipping.lastName}` : order.userId.slice(0, 8)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">${order.total?.toFixed(2)}</p>
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className="mt-1 text-xs bg-muted border border-border rounded px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
