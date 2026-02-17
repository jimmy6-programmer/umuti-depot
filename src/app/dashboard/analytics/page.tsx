"use client";

import { useStore, getTopMedicines, getRevenueData } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const COLORS = [
  "#059669", "#10b981", "#34d399", "#6ee7b7",
  "#a7f3d0", "#047857", "#065f46", "#064e3b",
];

export default function AnalyticsPage() {
  const { requisitions } = useStore();
  const topMeds = getTopMedicines(requisitions);
  const revenueData = getRevenueData();

  const totalRevenue = revenueData.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = requisitions.length;
  const avgOrderValue = requisitions.length
    ? Math.round(
        requisitions.reduce((s, r) => s + r.totalAmount, 0) / requisitions.length
      )
    : 0;

  const monthlySales = [
    { month: "Sep", orders: 18, value: 1850000 },
    { month: "Oct", orders: 22, value: 2100000 },
    { month: "Nov", orders: 20, value: 1950000 },
    { month: "Dec", orders: 28, value: 2450000 },
    { month: "Jan", orders: 25, value: 2300000 },
    { month: "Feb", orders: 31, value: 2680000 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Sales performance and insights</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue (6 mo)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {(totalRevenue / 1000000).toFixed(1)}M RWF
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {monthlySales.reduce((s, d) => s + d.orders, 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Order Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{avgOrderValue.toLocaleString()} RWF</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Last 6 months revenue in RWF</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis
                    fontSize={12}
                    tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      `${value.toLocaleString()} RWF`,
                      "Revenue",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#059669"
                    strokeWidth={2}
                    dot={{ fill: "#059669", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Sales */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Sales</CardTitle>
            <CardDescription>Orders per month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlySales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip
                    formatter={(value: number) => [`${value} orders`, "Orders"]}
                  />
                  <Bar dataKey="orders" radius={[4, 4, 0, 0]}>
                    {monthlySales.map((_, i) => (
                      <Cell key={i} fill={i === monthlySales.length - 1 ? "#059669" : "#a7f3d0"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Medicines */}
      <Card>
        <CardHeader>
          <CardTitle>Most Requested Medicines</CardTitle>
          <CardDescription>Based on all requisitions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topMeds} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" fontSize={12} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={160}
                  fontSize={12}
                  tick={{ fill: "#374151" }}
                />
                <Tooltip
                  formatter={(value: number) => [
                    `${value.toLocaleString()} units`,
                    "Quantity",
                  ]}
                />
                <Bar dataKey="quantity" radius={[0, 4, 4, 0]}>
                  {topMeds.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
