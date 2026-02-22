"use client";

import React, { useRef, useState, useCallback } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { useStore, InventoryItem } from "@/lib/store";
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
import { Upload, Pencil, Save, X, PercentCircle, Search } from "lucide-react";
import { toast } from "sonner";

// Column name variants for flexible CSV parsing
const NAME_VARIANTS = [
  "name",
  "Name",
  "product",
  "Product",
  "medicine",
  "Medicine",
  "medicineName",
  "MedicineName",
  "productName",
  "ProductName",
  "item",
  "Item",
  "description",
  "Description",
];
const CATEGORY_VARIANTS = [
  "category",
  "Category",
  "type",
  "Type",
  "group",
  "Group",
];
const PRICE_VARIANTS = [
  "unitPrice",
  "unitprice",
  "UnitPrice",
  "price",
  "Price",
  "unit_price",
  "Unit Price",
  "sellingPrice",
  "Selling Price",
];
const QTY_VARIANTS = [
  "quantity",
  "Quantity",
  "qty",
  "Qty",
  "stock",
  "Stock",
  "amount",
  "Amount",
  "available",
  "Available",
];
const UNIT_VARIANTS = [
  "unit",
  "Unit",
  "units",
  "Units",
  "packSize",
  "Pack Size",
  "pack_size",
];
const EXPIRY_VARIANTS = [
  "expiryDate",
  "expirydate",
  "ExpiryDate",
  "expiry",
  "Expiry",
  "expireDate",
  "expire",
  "Expiration Date",
  "expiration",
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

function parseRows(rows: Record<string, unknown>[]): InventoryItem[] {
  if (!Array.isArray(rows) || rows.length === 0) {
    return [];
  }

  // Get all keys from first row to determine if file has headers
  const firstRow = rows[0];
  const keys = Object.keys(firstRow);
  
  // Check if first row looks like headers (contains common header words)
  const hasHeaderRow = keys.some(key => {
    const val = firstRow[key];
    if (typeof val === 'number') return true;
    const strVal = String(val).trim().toLowerCase();
    return ['name', 'product', 'medicine', 'category', 'price', 'quantity', 'qty', 'unit', 'expiry', 'date', 'type', 'group', 'stock'].includes(strVal);
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

  const nameIdx = findColumnIndex(NAME_VARIANTS);
  const categoryIdx = findColumnIndex(CATEGORY_VARIANTS);
  const priceIdx = findColumnIndex(PRICE_VARIANTS);
  const qtyIdx = findColumnIndex(QTY_VARIANTS);
  const unitIdx = findColumnIndex(UNIT_VARIANTS);
  const expiryIdx = findColumnIndex(EXPIRY_VARIANTS);

  // Helper to get value by index with fallback to position-based mapping
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

  // Default column positions: 0=name, 1=category, 2=price, 3=qty, 4=unit, 5=expiry
  return rows
    .slice(dataStartIndex)
    .filter((row) => {
      if (!row || typeof row !== "object") return false;
      const name = getValueByIndex(row, nameIdx, 0);
      const price = getNumberByIndex(row, priceIdx, 2);
      const qty = getNumberByIndex(row, qtyIdx, 3);
      return name || price || qty;
    })
    .map((row, idx) => ({
      id: `imp-${Date.now()}-${idx}`,
      name: getValueByIndex(row, nameIdx, 0) || `Product ${idx + 1}`,
      category: getValueByIndex(row, categoryIdx, 1) || "General",
      unitPrice: getNumberByIndex(row, priceIdx, 2),
      quantity: getNumberByIndex(row, qtyIdx, 3),
      unit: getValueByIndex(row, unitIdx, 4) || "units",
      expiryDate: getValueByIndex(row, expiryIdx, 5),
    }));
}

export default function InventoryPage() {
  const { inventory, setInventory, updateInventoryItem, bulkUpdatePrices } =
    useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    unitPrice: number;
    quantity: number;
  }>({
    unitPrice: 0,
    quantity: 0,
  });
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkPercent, setBulkPercent] = useState("");
  const [search, setSearch] = useState("");

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const ext = file.name.split(".").pop()?.toLowerCase();

      if (ext === "csv") {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            try {
              const parsed = parseRows(
                results.data as Record<string, unknown>[],
              );
              if (parsed.length === 0) {
                const columns = results.meta.fields || [];
                toast.error(
                  `No items imported. Found columns: ${columns.join(", ")}. Expected: name/medicine, category, unitPrice, quantity, unit, expiryDate`,
                );
              } else {
                setInventory([...inventory, ...parsed]);
                toast.success(`Imported ${parsed.length} items from CSV`);
              }
            } catch (err) {
              console.error("Parse error:", err);
              toast.error("Failed to parse CSV file");
            }
          },
          error: (error) => {
            toast.error(`Failed to parse CSV: ${error.message}`);
          },
        });
      } else if (ext === "xlsx" || ext === "xls") {
        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            const wb = XLSX.read(evt.target?.result, { type: "binary" });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(ws);
            const parsed = parseRows(data as Record<string, unknown>[]);
            if (parsed.length === 0) {
              toast.error(
                "No items imported. Please check your Excel file has the correct column headers.",
              );
            } else {
              setInventory([...inventory, ...parsed]);
              toast.success(`Imported ${parsed.length} items from Excel`);
            }
          } catch (error) {
            console.error("Excel parse error:", error);
            toast.error(
              "Failed to parse Excel file. Please ensure it's a valid .xlsx or .xls file.",
            );
          }
        };
        reader.onerror = () => {
          toast.error("Failed to read file");
        };
        reader.readAsBinaryString(file);
      } else {
        toast.error(
          "Unsupported file type. Please upload .csv or .xlsx files.",
        );
      }

      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [inventory, setInventory],
  );

  const startEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditValues({ unitPrice: item.unitPrice, quantity: item.quantity });
  };

  const saveEdit = () => {
    if (editingId) {
      updateInventoryItem(editingId, editValues);
      setEditingId(null);
      toast.success("Item updated successfully");
    }
  };

  const handleBulkUpdate = () => {
    const pct = parseFloat(bulkPercent);
    if (isNaN(pct)) {
      toast.error("Please enter a valid percentage");
      return;
    }
    bulkUpdatePrices(pct);
    setBulkOpen(false);
    setBulkPercent("");
    toast.success(
      `All prices ${pct > 0 ? "increased" : "decreased"} by ${Math.abs(pct)}%`,
    );
  };

  const filtered = inventory.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Inventory Management
          </h1>
          <p className="text-muted-foreground">
            Manage your depot stock and pricing
          </p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Price List
          </Button>
          <Button onClick={() => setBulkOpen(true)}>
            <PercentCircle className="h-4 w-4 mr-2" />
            Bulk Update
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Products ({filtered.length})</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Unit Price (RWF)</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {editingId === item.id ? (
                        <Input
                          type="number"
                          value={editValues.unitPrice}
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              unitPrice: Number(e.target.value),
                            })
                          }
                          className="w-24 ml-auto text-right"
                        />
                      ) : (
                        item.unitPrice.toLocaleString()
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingId === item.id ? (
                        <Input
                          type="number"
                          value={editValues.quantity}
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              quantity: Number(e.target.value),
                            })
                          }
                          className="w-24 ml-auto text-right"
                        />
                      ) : (
                        <span
                          className={
                            item.quantity < 2000
                              ? "text-amber-600 font-medium"
                              : ""
                          }
                        >
                          {item.quantity.toLocaleString()}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.expiryDate}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingId === item.id ? (
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={saveEdit}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Update Dialog */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Price Update</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Adjust all product prices by a percentage. Use positive values to
              increase and negative values to decrease.
            </p>
            <div className="space-y-2">
              <Label htmlFor="percentage">Percentage (%)</Label>
              <Input
                id="percentage"
                type="number"
                placeholder="e.g. 5 or -10"
                value={bulkPercent}
                onChange={(e) => setBulkPercent(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkUpdate}>Apply Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
