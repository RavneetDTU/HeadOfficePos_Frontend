import { useState } from "react";
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  MapPin,
  User,
} from "lucide-react";

interface Warehouse {
  id: number;
  name: string;
  code: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  manager: string;
  status: "Active" | "Inactive";
}

const initialWarehouses: Warehouse[] = [
  {
    id: 1,
    name: "HEAD OFFICE",
    code: "HO-001",
    address: "Shop 45A, Hillcrest East Port",
    city: "Durban",
    phone: "031 912 0021",
    email: "headoffice@hearingaidlab.co.za",
    manager: "Joshua Blatter",
    status: "Active",
  },
  {
    id: 2,
    name: "BRANCH 1 — BLUFF",
    code: "BR-001",
    address: "14 Carnation Road",
    city: "Bluff, Durban",
    phone: "031 467 8900",
    email: "bluff@hearingaidlab.co.za",
    manager: "Emily Davis",
    status: "Active",
  },
  {
    id: 3,
    name: "BRANCH 2 — HILLCREST",
    code: "BR-002",
    address: "Shop AHA, Hillcrest East Mall",
    city: "Hillcrest",
    phone: "031 765 4321",
    email: "hillcrest@hearingaidlab.co.za",
    manager: "Robert Lee",
    status: "Inactive",
  },
];

const emptyForm: Omit<Warehouse, "id"> = {
  name: "",
  code: "",
  address: "",
  city: "",
  phone: "",
  email: "",
  manager: "",
  status: "Active",
};

export function WarehouseSettings() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>(initialWarehouses);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Omit<Warehouse, "id">>(emptyForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const filtered = warehouses.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.city.toLowerCase().includes(search.toLowerCase()) ||
      w.manager.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (w: Warehouse) => {
    const { id, ...rest } = w;
    setForm(rest);
    setEditingId(id);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name || !form.code) return;
    if (editingId !== null) {
      setWarehouses((prev) =>
        prev.map((w) => (w.id === editingId ? { ...form, id: editingId } : w))
      );
    } else {
      const newId = Math.max(...warehouses.map((w) => w.id), 0) + 1;
      setWarehouses((prev) => [...prev, { ...form, id: newId }]);
    }
    setShowModal(false);
  };

  const handleDelete = () => {
    if (deleteId !== null) {
      setWarehouses((prev) => prev.filter((w) => w.id !== deleteId));
      setDeleteId(null);
    }
  };

  const activeCount = warehouses.filter((w) => w.status === "Active").length;

  return (
    <div className="p-4 bg-white min-h-screen">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
        <span>Home</span>
        <span>/</span>
        <span>Settings</span>
        <span>/</span>
        <span className="text-gray-900 font-medium">Warehouses</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Warehouse Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage your warehouse locations, contacts and status
          </p>
        </div>
        <button
          id="add-warehouse-btn"
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
        >
          <Plus size={16} /> Add Warehouse
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <Building2 size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Warehouses</p>
            <p className="text-2xl font-bold text-gray-900">{warehouses.length}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
            <CheckCircle size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Active</p>
            <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
            <XCircle size={20} className="text-red-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Inactive</p>
            <p className="text-2xl font-bold text-gray-900">{warehouses.length - activeCount}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">All Warehouses</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input
              type="text"
              placeholder="Search warehouses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-60"
            />
          </div>
        </div>

        <table className="w-full">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-medium">#</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium">Warehouse</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium">Code</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium">Location</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium">Contact</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium">Manager</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium">Status</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((w, i) => (
              <tr key={w.id} className={`hover:bg-gray-50 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                <td className="px-4 py-3 text-xs text-gray-500">{i + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-blue-50 rounded-md flex items-center justify-center flex-shrink-0">
                      <Building2 size={14} className="text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">{w.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">{w.code}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-start gap-1">
                    <MapPin size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-900">{w.address}</p>
                      <p className="text-xs text-gray-500">{w.city}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1 text-xs text-gray-700">
                      <Phone size={11} className="text-gray-400" /> {w.phone}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Mail size={11} className="text-gray-400" /> {w.email}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-xs font-semibold">
                      {w.manager.charAt(0)}
                    </div>
                    <span className="text-xs text-gray-700">{w.manager}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      w.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${w.status === "Active" ? "bg-green-500" : "bg-red-400"}`} />
                    {w.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(w)}
                      className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteId(w.id)}
                      className="p-1.5 rounded hover:bg-red-50 text-red-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">
                  No warehouses found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  {editingId !== null ? "Edit Warehouse" : "Add New Warehouse"}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">Fill in the details below</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Warehouse Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. HEAD OFFICE"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Warehouse Code *</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="e.g. HO-001"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Street address"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="City"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as "Active" | "Inactive" })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="031 000 0000"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="branch@company.co.za"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Manager</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={form.manager}
                    onChange={(e) => setForm({ ...form, manager: e.target.value })}
                    placeholder="Manager name"
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-gray-100">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                id="save-warehouse-btn"
                onClick={handleSave}
                disabled={!form.name || !form.code}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingId !== null ? "Save Changes" : "Add Warehouse"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl p-6 text-center">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} className="text-red-500" />
            </div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Delete Warehouse?</h2>
            <p className="text-sm text-gray-500 mb-5">
              This action cannot be undone. All data associated with this warehouse will be removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
