import {
    AlertTriangle,
    Building2,
    Loader2,
    MapPin,
    UserCheck,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { createBiller } from "../../services/inventoryService";

export function AddBiller() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    company: "",
    name: "",
    vatNumber: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "South Africa",
    customField: "",
    status: "Active",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const updateField = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const resetForm = () =>
    setForm({
      company: "",
      name: "",
      vatNumber: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      country: "South Africa",
      customField: "",
      status: "Active",
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !form.company.trim() ||
      !form.name.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.address.trim() ||
      !form.city.trim()
    ) {
      setError("Please fill in all required fields marked with *.");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess(false);

    try {
      const payload = {
        company: form.company.trim(),
        name: form.name.trim(),
        vatNumber: form.vatNumber.trim() || undefined,
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim() || undefined,
        postalCode: form.postalCode.trim() || undefined,
        country: form.country.trim() || "South Africa",
        customField1: form.customField.trim() || undefined,
        status: form.status,
      };

      await createBiller(payload);
      setSuccess(true);
      resetForm();
      setTimeout(() => {
        navigate("/billers");
      }, 1500);
    } catch (e: any) {
      console.error("Failed to create biller:", e);
      setError(e instanceof Error ? e.message : "Failed to add biller. Please check your data.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 bg-white min-h-screen">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
        <span>Home</span><span>/</span>
        <span>People</span><span>/</span>
        <span className="text-gray-900 font-medium">Add Biller</span>
      </div>

      <div className="mb-5">
        <h1 className="text-xl font-semibold text-gray-900">Add New Biller</h1>
        <p className="text-sm text-gray-500 mt-0.5">Fields marked with * are required</p>
      </div>

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm animate-pulse">
          <UserCheck size={16} className="text-green-600" />
          Biller added successfully! Redirecting to billers list...
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
          <AlertTriangle size={16} className="text-red-600" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-4">
        {/* Main Biller Info */}
        <div className="col-span-2 space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <Building2 size={16} className="text-blue-600" />
              <h2 className="text-sm font-semibold text-gray-800">Biller Information</h2>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {/* Left column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Company *</label>
                  <input
                    type="text"
                    required
                    value={form.company}
                    onChange={(e) => updateField("company", e.target.value)}
                    placeholder="e.g. Phonak South Africa"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="Contact person name"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">VAT Number</label>
                  <input
                    type="text"
                    value={form.vatNumber}
                    onChange={(e) => updateField("vatNumber", e.target.value)}
                    placeholder="e.g. 4123456789"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="biller@example.com"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="text"
                    required
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="e.g. +27 11 123 4567"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Address *</label>
                  <input
                    type="text"
                    required
                    value={form.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    placeholder="Street address"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    placeholder="e.g. Johannesburg"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    value={form.state}
                    onChange={(e) => updateField("state", e.target.value)}
                    placeholder="e.g. Gauteng"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Postal Code</label>
                  <input
                    type="text"
                    value={form.postalCode}
                    onChange={(e) => updateField("postalCode", e.target.value)}
                    placeholder="e.g. 2000"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={form.country}
                    onChange={(e) => updateField("country", e.target.value)}
                    placeholder="e.g. South Africa"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Biller Custom Field</label>
                  <input
                    type="text"
                    value={form.customField}
                    onChange={(e) => updateField("customField", e.target.value)}
                    placeholder="Optional custom info"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <div className="relative">
                    <select
                      value={form.status}
                      onChange={(e) => updateField("status", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none bg-white"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Summary Card */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <UserCheck size={16} />
              <h2 className="text-sm font-semibold">Biller Summary</h2>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-200">Company</span>
                <span className="font-medium text-right max-w-32 truncate">{form.company || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-200">Contact</span>
                <span className="font-medium text-right max-w-32 truncate">{form.name || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-200">Email</span>
                <span className="font-medium text-right max-w-32 truncate">{form.email || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-200">Phone</span>
                <span className="font-medium">{form.phone || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-200">City</span>
                <span className="font-medium">{form.city || "—"}</span>
              </div>
            </div>
          </div>

          {/* Location preview */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={16} className="text-purple-600" />
              <h2 className="text-sm font-semibold text-gray-800">Location Preview</h2>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              {form.address ? `${form.address}, ` : ""}
              {form.city ? `${form.city}, ` : ""}
              {form.state ? `${form.state}, ` : ""}
              {form.postalCode ? `${form.postalCode}, ` : ""}
              {form.country || "—"}
            </p>
          </div>

          {/* Actions */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
            <button
              id="submit-biller-btn"
              type="submit"
              disabled={isSaving || success}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Saving...
                </>
              ) : (
                "Add Biller"
              )}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="w-full py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              Reset Form
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
