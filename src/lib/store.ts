import { create } from "zustand";

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unitPrice: number;
  quantity: number;
  unit: string;
  expiryDate: string;
}

export interface Requisition {
  id: string;
  pharmacyName: string;
  pharmacyContact: string;
  requestDate: string;
  items: { name: string; quantity: number; unitPrice: number }[];
  status: "pending" | "accepted" | "rejected";
  momoCode?: string;
  totalAmount: number;
}

export interface LicenseDoc {
  id: string;
  name: string;
  uploadDate: string;
  type: string;
}

interface StoreState {
  inventory: InventoryItem[];
  requisitions: Requisition[];
  licenses: LicenseDoc[];
  setInventory: (items: InventoryItem[]) => void;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  bulkUpdatePrices: (percentage: number) => void;
  acceptRequisition: (id: string, momoCode: string) => void;
  rejectRequisition: (id: string) => void;
  addLicense: (doc: LicenseDoc) => void;
}

const DEMO_INVENTORY: InventoryItem[] = [
  { id: "inv-1", name: "Amoxicillin 500mg", category: "Antibiotics", unitPrice: 1200, quantity: 5000, unit: "capsules", expiryDate: "2027-06-15" },
  { id: "inv-2", name: "Paracetamol 500mg", category: "Analgesics", unitPrice: 300, quantity: 15000, unit: "tablets", expiryDate: "2027-12-01" },
  { id: "inv-3", name: "Metformin 850mg", category: "Antidiabetics", unitPrice: 800, quantity: 3000, unit: "tablets", expiryDate: "2027-03-20" },
  { id: "inv-4", name: "Ibuprofen 400mg", category: "Analgesics", unitPrice: 450, quantity: 8000, unit: "tablets", expiryDate: "2027-09-10" },
  { id: "inv-5", name: "Omeprazole 20mg", category: "Gastrointestinal", unitPrice: 950, quantity: 2500, unit: "capsules", expiryDate: "2026-11-30" },
  { id: "inv-6", name: "Azithromycin 250mg", category: "Antibiotics", unitPrice: 2500, quantity: 1200, unit: "tablets", expiryDate: "2027-08-15" },
  { id: "inv-7", name: "Ciprofloxacin 500mg", category: "Antibiotics", unitPrice: 1800, quantity: 2000, unit: "tablets", expiryDate: "2027-04-22" },
  { id: "inv-8", name: "Diclofenac 50mg", category: "Analgesics", unitPrice: 500, quantity: 6000, unit: "tablets", expiryDate: "2027-07-18" },
  { id: "inv-9", name: "Amlodipine 5mg", category: "Cardiovascular", unitPrice: 700, quantity: 4000, unit: "tablets", expiryDate: "2027-10-05" },
  { id: "inv-10", name: "Cetirizine 10mg", category: "Antihistamines", unitPrice: 350, quantity: 7000, unit: "tablets", expiryDate: "2027-05-12" },
];

const DEMO_REQUISITIONS: Requisition[] = [
  {
    id: "req-001", pharmacyName: "Pharmacie de la Paix", pharmacyContact: "+250 788 123 456",
    requestDate: "2026-02-15", totalAmount: 156000,
    items: [
      { name: "Amoxicillin 500mg", quantity: 100, unitPrice: 1200 },
      { name: "Paracetamol 500mg", quantity: 120, unitPrice: 300 },
    ],
    status: "pending",
  },
  {
    id: "req-002", pharmacyName: "Green Cross Pharmacy", pharmacyContact: "+250 788 234 567",
    requestDate: "2026-02-14", totalAmount: 240000,
    items: [
      { name: "Metformin 850mg", quantity: 200, unitPrice: 800 },
      { name: "Amlodipine 5mg", quantity: 100, unitPrice: 700 },
      { name: "Omeprazole 20mg", quantity: 10, unitPrice: 950 },
    ],
    status: "pending",
  },
  {
    id: "req-003", pharmacyName: "Pharmacy Vita", pharmacyContact: "+250 788 345 678",
    requestDate: "2026-02-13", totalAmount: 62500,
    items: [
      { name: "Azithromycin 250mg", quantity: 25, unitPrice: 2500 },
    ],
    status: "accepted", momoCode: "MP-2026-7821",
  },
  {
    id: "req-004", pharmacyName: "MedPlus Kigali", pharmacyContact: "+250 788 456 789",
    requestDate: "2026-02-12", totalAmount: 90000,
    items: [
      { name: "Ciprofloxacin 500mg", quantity: 50, unitPrice: 1800 },
    ],
    status: "rejected",
  },
  {
    id: "req-005", pharmacyName: "Ubuzima Pharmacy", pharmacyContact: "+250 788 567 890",
    requestDate: "2026-02-16", totalAmount: 315000,
    items: [
      { name: "Paracetamol 500mg", quantity: 500, unitPrice: 300 },
      { name: "Ibuprofen 400mg", quantity: 200, unitPrice: 450 },
      { name: "Diclofenac 50mg", quantity: 100, unitPrice: 500 },
    ],
    status: "pending",
  },
];

export const useStore = create<StoreState>((set) => ({
  inventory: DEMO_INVENTORY,
  requisitions: DEMO_REQUISITIONS,
  licenses: [
    { id: "lic-1", name: "Pharmacy Operating License 2026.pdf", uploadDate: "2026-01-05", type: "Operating License" },
    { id: "lic-2", name: "FDA Import Permit.pdf", uploadDate: "2025-11-20", type: "Import Permit" },
  ],
  setInventory: (items) => set({ inventory: items }),
  updateInventoryItem: (id, updates) =>
    set((state) => ({
      inventory: state.inventory.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    })),
  bulkUpdatePrices: (percentage) =>
    set((state) => ({
      inventory: state.inventory.map((item) => ({
        ...item,
        unitPrice: Math.round(item.unitPrice * (1 + percentage / 100)),
      })),
    })),
  acceptRequisition: (id, momoCode) =>
    set((state) => ({
      requisitions: state.requisitions.map((req) =>
        req.id === id ? { ...req, status: "accepted" as const, momoCode } : req
      ),
    })),
  rejectRequisition: (id) =>
    set((state) => ({
      requisitions: state.requisitions.map((req) =>
        req.id === id ? { ...req, status: "rejected" as const } : req
      ),
    })),
  addLicense: (doc) =>
    set((state) => ({ licenses: [...state.licenses, doc] })),
}));

// Analytics helpers
export function getMonthlySalesData(requisitions: Requisition[]) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  // Simulated monthly data for demo
  return months.map((month, i) => ({
    month,
    sales: Math.floor(Math.random() * 500000 + 200000) * (i < 2 ? 1 : 0.8),
    orders: Math.floor(Math.random() * 30 + 10),
  }));
}

export function getTopMedicines(requisitions: Requisition[]) {
  const map = new Map<string, number>();
  requisitions.forEach((req) => {
    req.items.forEach((item) => {
      map.set(item.name, (map.get(item.name) || 0) + item.quantity);
    });
  });
  return Array.from(map.entries())
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 8);
}

export function getRevenueData() {
  return [
    { month: "Sep", revenue: 1850000 },
    { month: "Oct", revenue: 2100000 },
    { month: "Nov", revenue: 1950000 },
    { month: "Dec", revenue: 2450000 },
    { month: "Jan", revenue: 2300000 },
    { month: "Feb", revenue: 2680000 },
  ];
}
