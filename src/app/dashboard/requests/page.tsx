"use client";

import React, { useState } from "react";
import { useStore, Requisition } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, FileText, Phone, Smartphone } from "lucide-react";
import { toast } from "sonner";

export default function RequestsPage() {
  const { requisitions, acceptRequisition, rejectRequisition } = useStore();
  const [momoDialog, setMomoDialog] = useState<string | null>(null);
  const [momoCode, setMomoCode] = useState("");
  const [invoiceReq, setInvoiceReq] = useState<Requisition | null>(null);

  const pending = requisitions.filter((r) => r.status === "pending");
  const accepted = requisitions.filter((r) => r.status === "accepted");
  const rejected = requisitions.filter((r) => r.status === "rejected");

  const handleAccept = () => {
    if (!momoDialog || !momoCode.trim()) {
      toast.error("Please enter a MoMo payment code");
      return;
    }
    acceptRequisition(momoDialog, momoCode.trim());
    setMomoDialog(null);
    setMomoCode("");
    toast.success("Request accepted with MoMo code");
  };

  const handleReject = (id: string) => {
    rejectRequisition(id);
    toast.success("Request rejected");
  };

  function ReqTable({
    reqs,
    showActions,
  }: {
    reqs: Requisition[];
    showActions: boolean;
  }) {
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Pharmacy</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="text-right">Total (RWF)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reqs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No requests found
                </TableCell>
              </TableRow>
            ) : (
              reqs.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-mono text-xs">{req.id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{req.pharmacyName}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {req.pharmacyContact}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{req.requestDate}</TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      {req.items.map((item, idx) => (
                        <p key={idx} className="text-xs">
                          {item.name} x{item.quantity}
                        </p>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {req.totalAmount.toLocaleString()}
                  </TableCell>
                  <TableCell>
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
                    {req.momoCode && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Smartphone className="h-3 w-3" />
                        {req.momoCode}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {showActions && req.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            onClick={() => setMomoDialog(req.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleReject(req.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {req.status === "accepted" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setInvoiceReq(req)}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Invoice
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Incoming Requests</h1>
        <p className="text-muted-foreground">
          Manage requisitions from pharmacies
        </p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="accepted">
            Accepted ({accepted.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({rejected.length})
          </TabsTrigger>
          <TabsTrigger value="all">All ({requisitions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <ReqTable reqs={pending} showActions={true} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accepted" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <ReqTable reqs={accepted} showActions={false} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <ReqTable reqs={rejected} showActions={false} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <ReqTable reqs={requisitions} showActions={true} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MoMo Code Dialog */}
      <Dialog open={!!momoDialog} onOpenChange={() => { setMomoDialog(null); setMomoCode(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Request & Provide MoMo Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Enter the MTN MoMo payment code for this transaction.
            </p>
            <div className="space-y-2">
              <Label htmlFor="momoCode">MoMo Payment Code</Label>
              <Input
                id="momoCode"
                placeholder="e.g. MP-2026-XXXX"
                value={momoCode}
                onChange={(e) => setMomoCode(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setMomoDialog(null); setMomoCode(""); }}>
              Cancel
            </Button>
            <Button onClick={handleAccept} className="bg-emerald-600 hover:bg-emerald-700">
              Accept & Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Dialog */}
      <Dialog open={!!invoiceReq} onOpenChange={() => setInvoiceReq(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Invoice</DialogTitle>
          </DialogHeader>
          {invoiceReq && (
            <div className="space-y-4 py-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">Umuti Depot</h3>
                  <p className="text-xs text-muted-foreground">Kigali Central Depot</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-medium">{invoiceReq.id}</p>
                  <p className="text-xs text-muted-foreground">{invoiceReq.requestDate}</p>
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="text-sm font-medium">Bill To:</p>
                <p className="text-sm">{invoiceReq.pharmacyName}</p>
                <p className="text-xs text-muted-foreground">{invoiceReq.pharmacyContact}</p>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoiceReq.items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {item.unitPrice.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {(item.quantity * item.unitPrice).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-between items-center border-t pt-3">
                <div>
                  <p className="text-xs text-muted-foreground">MoMo Code</p>
                  <p className="font-mono text-sm">{invoiceReq.momoCode}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total Amount</p>
                  <p className="text-xl font-bold">
                    {invoiceReq.totalAmount.toLocaleString()} RWF
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setInvoiceReq(null)}>
              Close
            </Button>
            <Button
              onClick={() => {
                window.print();
                toast.success("Invoice sent to print");
              }}
            >
              <FileText className="h-4 w-4 mr-1" />
              Print Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
