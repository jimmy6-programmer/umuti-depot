"use client";

import React, { useState, useRef, useCallback } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
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
import {
  Check,
  X,
  FileText,
  Phone,
  Smartphone,
  Plus,
  Upload,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";

// Column name variants for flexible CSV parsing
const PHARMACY_NAME_VARIANTS = [
  "pharmacyName",
  "pharmacyname",
  "Pharmacy Name",
  "pharmacy",
  "Pharmacy",
  "name",
  "Name",
  "customer",
  "Customer",
];
const CONTACT_VARIANTS = [
  "contact",
  "Contact",
  "phone",
  "Phone",
  "telephone",
  "Telephone",
  "mobile",
  "Mobile",
  "pharmacyContact",
  "pharmacycontact",
  "Pharmacy Contact",
];
const ITEM_NAME_VARIANTS = [
  "itemName",
  "itemname",
  "Item Name",
  "item",
  "Item",
  "medicine",
  "Medicine",
  "product",
  "Product",
  "productName",
  "productname",
  "Product Name",
  "name",
  "Name",
];
const QTY_VARIANTS = [
  "quantity",
  "Quantity",
  "qty",
  "Qty",
  "amount",
  "Amount",
  "units",
  "Units",
];
const PRICE_VARIANTS = [
  "price",
  "Price",
  "unitPrice",
  "unitprice",
  "Unit Price",
  "unit_price",
  "sellingPrice",
  "Selling Price",
];

function getRowValue(row: Record<string, unknown>, variants: string[]): string {
  for (const v of variants) {
    if (
      row[v] !== undefined &&
      row[v] !== null &&
      String(row[v]).trim() !== ""
    ) {
      return String(row[v]).trim();
    }
  }
  return "";
}

function getRowNumber(
  row: Record<string, unknown>,
  variants: string[],
): number {
  const val = getRowValue(row, variants);
  if (!val) return 0;
  const num = parseFloat(val);
  return isNaN(num) ? 0 : num;
}

interface ParsedRequisitionItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

function parseRequisitionFile(
  rows: Record<string, unknown>[],
): {
  pharmacyName: string;
  pharmacyContact: string;
  items: ParsedRequisitionItem[];
} | null {
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  // Get all keys from first row to determine if file has headers
  const firstRow = rows[0];
  const keys = Object.keys(firstRow);
  
  // Check if first row looks like headers
  const hasHeaderRow = keys.some(key => {
    const val = firstRow[key];
    if (typeof val === 'number') return true;
    const strVal = String(val).trim().toLowerCase();
    return ['pharmacy', 'contact', 'phone', 'item', 'medicine', 'product', 'name', 'quantity', 'qty', 'price', 'amount'].includes(strVal);
  });

  // If no header row detected, treat first row as data
  const dataStartIndex = hasHeaderRow ? 1 : 0;

  // Find column indices by name matching
  const findColumnIndex = (variants: string[]): number => {
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i].toLowerCase().trim();
      if (variants.some(v => v.toLowerCase() === key)) {
        return i;
      }
    }
    return -1;
  };

  const pharmacyNameIdx = findColumnIndex(PHARMACY_NAME_VARIANTS);
  const contactIdx = findColumnIndex(CONTACT_VARIANTS);
  const itemNameIdx = findColumnIndex(ITEM_NAME_VARIANTS);
  const qtyIdx = findColumnIndex(QTY_VARIANTS);
  const priceIdx = findColumnIndex(PRICE_VARIANTS);

  // Helper to get value by index
  const getValueByIndex = (row: Record<string, unknown>, idx: number, fallbackIdx: number): string => {
    const actualIdx = idx >= 0 ? idx : fallbackIdx;
    if (actualIdx >= 0 && actualIdx < keys.length) {
      const key = keys[actualIdx];
      const val = row[key];
      if (val !== undefined && val !== null && String(val).trim() !== "") {
        return String(val).trim();
      }
    }
    return "";
  };

  const getNumberByIndex = (row: Record<string, unknown>, idx: number, fallbackIdx: number): number => {
    const val = getValueByIndex(row, idx, fallbackIdx);
    if (!val) return 0;
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  };

  // Get pharmacy info from first data row
  const firstDataRow = rows[dataStartIndex];
  if (!firstDataRow) return null;

  // Try to find pharmacy info in first row, or use defaults
  // Default positions: 0=pharmacy name, 1=contact, then items start from there
  const pharmacyName =
    getValueByIndex(firstDataRow, pharmacyNameIdx, 0) || "New Pharmacy";
  const pharmacyContact =
    getValueByIndex(firstDataRow, contactIdx, 1) || "+250 000 000 000";

  // Parse items from all rows
  // Default item columns: 0 or 2 = item name, 3 = qty, 4 or 2 = price
  const items: ParsedRequisitionItem[] = rows
    .slice(dataStartIndex)
    .filter((row) => {
      const name = getValueByIndex(row, itemNameIdx, 0);
      const qty = getNumberByIndex(row, qtyIdx, 1);
      const price = getNumberByIndex(row, priceIdx, 2);
      return name || qty || price;
    })
    .map((row) => ({
      name: getValueByIndex(row, itemNameIdx, 0) || "Unknown Item",
      quantity: getNumberByIndex(row, qtyIdx, 1),
      unitPrice: getNumberByIndex(row, priceIdx, 2),
    }))
    .filter(
      (item) =>
        item.name !== "Unknown Item" &&
        (item.quantity > 0 || item.unitPrice > 0),
    );

  if (items.length === 0) {
    return null;
  }

  return { pharmacyName, pharmacyContact, items };
}

export default function RequestsPage() {
  const { requisitions, acceptRequisition, rejectRequisition, addRequisition } =
    useStore();
  const [momoDialog, setMomoDialog] = useState<string | null>(null);
  const [momoCode, setMomoCode] = useState("");
  const [invoiceReq, setInvoiceReq] = useState<Requisition | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createFile, setCreateFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const createFileRef = useRef<HTMLInputElement>(null);

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

  const handleCreateRequisition = useCallback(() => {
    const file = createFile;
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    setCreating(true);
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "csv") {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const parsed = parseRequisitionFile(
              results.data as Record<string, unknown>[],
            );
            if (!parsed) {
              toast.error(
                "No valid items found in CSV. Please check the column headers.",
              );
              setCreating(false);
              return;
            }

            const totalAmount = parsed.items.reduce(
              (sum, item) => sum + item.quantity * item.unitPrice,
              0,
            );
            const newReq: Requisition = {
              id: `req-${Date.now()}`,
              pharmacyName: parsed.pharmacyName,
              pharmacyContact: parsed.pharmacyContact,
              requestDate: new Date().toISOString().split("T")[0],
              items: parsed.items,
              status: "pending",
              totalAmount,
            };

            addRequisition(newReq);

            toast.success(
              `Requisition created with ${parsed.items.length} items for ${parsed.pharmacyName}`,
            );
            setCreateDialogOpen(false);
            setCreateFile(null);
            if (createFileRef.current) createFileRef.current.value = "";
          } catch (err) {
            console.error("Parse error:", err);
            toast.error("Failed to parse CSV file");
          }
          setCreating(false);
        },
        error: (error) => {
          toast.error(`Failed to parse CSV: ${error.message}`);
          setCreating(false);
        },
      });
    } else if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const wb = XLSX.read(evt.target?.result, { type: "binary" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const data = XLSX.utils.sheet_to_json(ws);
          const parsed = parseRequisitionFile(
            data as Record<string, unknown>[],
          );

          if (!parsed) {
            toast.error(
              "No valid items found in Excel file. Please check the column headers.",
            );
            setCreating(false);
            return;
          }

          const totalAmount = parsed.items.reduce(
            (sum, item) => sum + item.quantity * item.unitPrice,
            0,
          );
          const newReq: Requisition = {
            id: `req-${Date.now()}`,
            pharmacyName: parsed.pharmacyName,
            pharmacyContact: parsed.pharmacyContact,
            requestDate: new Date().toISOString().split("T")[0],
            items: parsed.items,
            status: "pending",
            totalAmount,
          };

          addRequisition(newReq);

          toast.success(
            `Requisition created with ${parsed.items.length} items for ${parsed.pharmacyName}`,
          );
          setCreateDialogOpen(false);
          setCreateFile(null);
          if (createFileRef.current) createFileRef.current.value = "";
        } catch (error) {
          console.error("Excel parse error:", error);
          toast.error("Failed to parse Excel file");
        }
        setCreating(false);
      };
      reader.onerror = () => {
        toast.error("Failed to read file");
        setCreating(false);
      };
      reader.readAsBinaryString(file);
    } else {
      toast.error("Unsupported file type. Please upload .csv or .xlsx files.");
      setCreating(false);
    }
  }, [createFile, addRequisition]);

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
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground py-8"
                >
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
                  <TableCell className="text-muted-foreground">
                    {req.requestDate}
                  </TableCell>
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

      <div className="flex justify-end">
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Requisition
        </Button>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
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
      <Dialog
        open={!!momoDialog}
        onOpenChange={() => {
          setMomoDialog(null);
          setMomoCode("");
        }}
      >
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
            <Button
              variant="outline"
              onClick={() => {
                setMomoDialog(null);
                setMomoCode("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAccept}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
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
                  <p className="text-xs text-muted-foreground">
                    Kigali Central Depot
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-medium">
                    {invoiceReq.id}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {invoiceReq.requestDate}
                  </p>
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="text-sm font-medium">Bill To:</p>
                <p className="text-sm">{invoiceReq.pharmacyName}</p>
                <p className="text-xs text-muted-foreground">
                  {invoiceReq.pharmacyContact}
                </p>
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
                      <TableCell className="text-right">
                        {item.quantity}
                      </TableCell>
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

      {/* Create New Requisition Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Requisition</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Upload a CSV or Excel file with requisition details. The file should contain columns for item name, quantity, and price.
            </p>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <input
                ref={createFileRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setCreateFile(file);
                    toast.success(`${file.name} selected`);
                  }
                }}
              />
              {!createFile ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 rounded-full bg-muted">
                    <FileSpreadsheet className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Upload Requisition File</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Drag & drop or click to browse
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                      <span className="text-xs text-muted-foreground">CSV, Excel</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => createFileRef.current?.click()}
                  >
                    Browse Files
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 rounded-full bg-green-100">
                    <FileSpreadsheet className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-600">File Selected</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs truncate">
                      {createFile.name}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => createFileRef.current?.click()}
                      className="text-emerald-600 hover:text-emerald-700"
                    >
                      Change
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCreateFile(null);
                        if (createFileRef.current) createFileRef.current.value = "";
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              <p className="font-medium">Expected columns:</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                <li>Pharmacy Name / pharmacyName / name</li>
                <li>Contact / phone / telephone</li>
                <li>Item Name / medicine / product</li>
                <li>Quantity / qty / amount</li>
                <li>Price / unitPrice</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setCreateDialogOpen(false);
              setCreateFile(null);
              if (createFileRef.current) createFileRef.current.value = "";
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateRequisition} disabled={!createFile || creating}>
              {creating ? "Creating..." : "Create Requisition"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
