"use client";

import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, ClipboardList, TrendingUp, AlertCircle } from "lucide-react";

export default function DashboardPage() {
  const { inventory, requisitions } = useStore();
  const { user } = useAuth();

  const totalItems = inventory.reduce((sum, i) => sum + i.quantity, 0);
  const totalValue = inventory.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const pendingRequests = requisitions.filter((r) => r.status === "pending").length;
  const acceptedRequests = requisitions.filter((r) => r.status === "accepted").length;
  const lowStock = inventory.filter((i) => i.quantity < 2000);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.name}. Here&apos;s your depot overview.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Stock Items
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {inventory.length} products in catalog
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inventory Value
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(totalValue / 1000000).toFixed(1)}M RWF
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total stock value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Requests
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {acceptedRequests} accepted this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Low Stock Alerts
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{lowStock.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Items below 2,000 units</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {requisitions.slice(0, 4).map((req) => (
                <div key={req.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{req.pharmacyName}</p>
                    <p className="text-xs text-muted-foreground">
                      {req.items.length} items &middot; {req.requestDate}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {req.totalAmount.toLocaleString()} RWF
                    </span>
                    <Badge
                      variant={
                        req.status === "accepted"
                          ? "default"
                          : req.status === "rejected"
                          ? "destructive"
                          : "secondary"
                      }
                      className={
                        req.status === "accepted"
                          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                          : ""
                      }
                    >
                      {req.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock */}
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStock.length === 0 ? (
                <p className="text-sm text-muted-foreground">All items are well stocked.</p>
              ) : (
                lowStock.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    </div>
                    <Badge variant="outline" className="text-amber-600 border-amber-300">
                      {item.quantity.toLocaleString()} {item.unit}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
