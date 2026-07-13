import { Download, Upload, Plus, Search, MoreVertical, ChevronLeft, ChevronRight } from "lucide-react";
import { KPICard } from "../components/ui/KPICard";
import { StatusBadge } from "../components/ui/StatusBadge";
import { ShoppingBag, Clock, DollarSign, Users, Package, TrendingUp } from "lucide-react";
import { useState } from "react";

const kpiData = [
  {
    title: "Total Purchases",
    value: "856",
    trend: { value: "+10.2%", isPositive: true },
    icon: ShoppingBag,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
  },
  {
    title: "Pending Orders",
    value: "124",
    trend: { value: "-5.3%", isPositive: true },
    icon: Clock,
    iconColor: "text-orange-600",
    iconBg: "bg-orange-50",
  },
  {
    title: "Outstanding Payments",
    value: "$84,320",
    trend: { value: "+3.8%", isPositive: false },
    icon: DollarSign,
    iconColor: "text-red-600",
    iconBg: "bg-red-50",
  },
  {
    title: "Suppliers",
    value: "47",
    trend: { value: "+8.5%", isPositive: true },
    icon: Users,
    iconColor: "text-purple-600",
    iconBg: "bg-purple-50",
  },
  {
    title: "Inventory Cost",
    value: "$524,890",
    trend: { value: "+12.1%", isPositive: true },
    icon: Package,
    iconColor: "text-green-600",
    iconBg: "bg-green-50",
  },
  {
    title: "Monthly Procurement",
    value: "$156,430",
    trend: { value: "+15.7%", isPositive: true },
    icon: TrendingUp,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
  },
];

const purchaseData = [
  {
    id: 1,
    preordered: true,
    date: "2026-05-10",
    reference: "PUR-2026-000567",
    supplier: "AudioTech Suppliers Ltd.",
    status: "Received",
    grandTotal: "$12,450.00",
    paid: "$12,450.00",
    balance: "$0.00",
    paymentStatus: "Paid",
    notes: "Bulk order delivered",
  },
  {
    id: 2,
    preordered: false,
    date: "2026-05-09",
    reference: "PUR-2026-000568",
    supplier: "Hearing Solutions Inc.",
    status: "In Transit",
    grandTotal: "$8,920.00",
    paid: "$4,460.00",
    balance: "$4,460.00",
    paymentStatus: "Partial",
    notes: "Expected delivery: May 15",
  },
  {
    id: 3,
    preordered: true,
    date: "2026-05-08",
    reference: "PUR-2026-000569",
    supplier: "MedEquip Global",
    status: "Ordered",
    grandTotal: "$15,600.00",
    paid: "$0.00",
    balance: "$15,600.00",
    paymentStatus: "Pending",
    notes: "Processing order",
  },
  {
    id: 4,
    preordered: false,
    date: "2026-05-07",
    reference: "PUR-2026-000570",
    supplier: "AudioTech Suppliers Ltd.",
    status: "Cancelled",
    grandTotal: "$6,780.00",
    paid: "$0.00",
    balance: "$6,780.00",
    paymentStatus: "Pending",
    notes: "Supplier out of stock",
  },
  {
    id: 5,
    preordered: false,
    date: "2026-05-06",
    reference: "PUR-2026-000571",
    supplier: "Premium Acoustics Co.",
    status: "Received",
    grandTotal: "$9,340.00",
    paid: "$9,340.00",
    balance: "$0.00",
    paymentStatus: "Paid",
    notes: "Quality checked",
  },
];

function getStatusVariant(status: string): "success" | "warning" | "error" | "info" | "default" {
  switch (status.toLowerCase()) {
    case "received":
    case "paid":
      return "success";
    case "ordered":
    case "in transit":
    case "partial":
      return "warning";
    case "cancelled":
    case "pending":
      return "error";
    default:
      return "default";
  }
}

export function PurchaseManagement() {
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  const toggleRow = (id: number) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    setSelectedRows(prev =>
      prev.length === purchaseData.length ? [] : purchaseData.map(row => row.id)
    );
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <span>Home</span>
          <span>/</span>
          <span>Purchases</span>
          <span>/</span>
          <span className="text-gray-900">List Purchases</span>
        </div>
        <h1 className="text-xl font-semibold text-gray-900">Purchases (All Warehouses)</h1>
        <p className="text-sm text-gray-600 mt-1">
          Please use the table below to navigate or filter the results. You can download the table as excel and pdf.
        </p>
      </div>

      <div className="bg-white rounded border border-gray-200 p-4 mb-4">
        <div className="grid grid-cols-5 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Purchase Status</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm">
              <option>All Statuses</option>
              <option>Ordered</option>
              <option>Received</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Warehouses</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm">
              <option>All Warehouses</option>
            </select>
          </div>
          <div className="flex items-end">
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm">
              Search
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Show</span>
            <select className="px-3 py-1.5 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm">
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <span className="text-sm text-gray-600">records</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search..."
                className="pl-9 pr-3 py-1.5 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm w-64"
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-blue-500 text-white">
              <tr>
                <th className="px-3 py-2 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRows.length === purchaseData.length}
                    onChange={toggleAll}
                    className="rounded border-white/30 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium">Date</th>
                <th className="px-3 py-2 text-left text-xs font-medium">Reference No</th>
                <th className="px-3 py-2 text-left text-xs font-medium">Supplier</th>
                <th className="px-3 py-2 text-left text-xs font-medium">Purchase Status</th>
                <th className="px-3 py-2 text-left text-xs font-medium">Grand Total</th>
                <th className="px-3 py-2 text-left text-xs font-medium">Paid</th>
                <th className="px-3 py-2 text-left text-xs font-medium">Balance</th>
                <th className="px-3 py-2 text-left text-xs font-medium">Payment Status</th>
                <th className="px-3 py-2 text-left text-xs font-medium">Note</th>
                <th className="px-3 py-2 text-left text-xs font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {purchaseData.map((purchase, index) => (
                <tr key={purchase.id} className={`hover:bg-gray-100 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(purchase.id)}
                      onChange={() => toggleRow(purchase.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-900">{purchase.date}</td>
                  <td className="px-3 py-3 text-xs font-medium text-blue-600">{purchase.reference}</td>
                  <td className="px-3 py-3 text-xs text-gray-900">{purchase.supplier}</td>
                  <td className="px-3 py-3">
                    <StatusBadge status={purchase.status} variant={getStatusVariant(purchase.status)} />
                  </td>
                  <td className="px-3 py-3 text-xs font-medium text-gray-900">{purchase.grandTotal}</td>
                  <td className="px-3 py-3 text-xs text-gray-900">{purchase.paid}</td>
                  <td className="px-3 py-3 text-xs text-gray-900">{purchase.balance}</td>
                  <td className="px-3 py-3">
                    <StatusBadge status={purchase.paymentStatus} variant={getStatusVariant(purchase.paymentStatus)} />
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-600">{purchase.notes}</td>
                  <td className="px-3 py-3">
                    <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                      <MoreVertical size={16} className="text-gray-600" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="text-sm text-gray-600">
            Showing <span className="font-medium">1</span> to <span className="font-medium">5</span> of{" "}
            <span className="font-medium">856</span> results
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 border border-gray-200 rounded hover:bg-white transition-colors disabled:opacity-50 text-sm">
              <ChevronLeft size={16} />
            </button>
            <button className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm">1</button>
            <button className="px-3 py-1.5 border border-gray-200 rounded hover:bg-white transition-colors text-sm">2</button>
            <button className="px-3 py-1.5 border border-gray-200 rounded hover:bg-white transition-colors text-sm">3</button>
            <button className="px-3 py-1.5 border border-gray-200 rounded hover:bg-white transition-colors text-sm">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
