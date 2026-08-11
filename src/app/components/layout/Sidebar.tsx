import {
    ArrowLeftRight,
    BarChart3,
    Building2,
    ChevronDown,
    Contact2,
    FileCheck,
    FileText,
    LayoutDashboard,
    ListOrdered,
    Package,
    PlusCircle,
    ScrollText,
    SendToBack,
    Settings,
    ShieldCheck,
    Users
} from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path?: string;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { label: "HQ Dashboard", icon: <LayoutDashboard size={20} />, path: "/" },
  {
    label: "Products",
    icon: <Package size={20} />,
    children: [
      { label: "List Product", icon: <ListOrdered size={18} />, path: "/products" },
      { label: "Add Product", icon: <PlusCircle size={18} />, path: "/products/add" },
    ],
  },
  {
    label: "Sales",
    icon: <ArrowLeftRight size={20} />,
    children: [
      { label: "List Sales", icon: <ListOrdered size={18} />, path: "/transfers" },
      { label: "Add Sales", icon: <PlusCircle size={18} />, path: "/transfers/add" },
    ],
  },
  {
    label: "Quotation",
    icon: <FileText size={20} />,
    children: [
      { label: "List Quotation", icon: <ListOrdered size={18} />, path: "/quotations" },
      { label: "Add Quotation", icon: <PlusCircle size={18} />, path: "/quotations/add" },
    ],
  },
  {
    label: "Proforma",
    icon: <FileCheck size={20} />,
    children: [
      { label: "List Proforma", icon: <ListOrdered size={18} />, path: "/proforma" },
      { label: "Add Proforma", icon: <PlusCircle size={18} />, path: "/proforma/add" },
    ],
  },
  {
    label: "Purchases",
    icon: <SendToBack size={20} />,
    children: [
      { label: "All Purchases", icon: <ListOrdered size={18} />, path: "/requests" },
    ],
  },
  {
    label: "People",
    icon: <Contact2 size={20} />,
    children: [
      { label: "List Biller", icon: <ListOrdered size={18} />, path: "/billers" },
      { label: "Add Biller", icon: <PlusCircle size={18} />, path: "/billers/add" },
      { label: "List Customer", icon: <ListOrdered size={18} />, path: "/customers" },
      { label: "Add Customer", icon: <PlusCircle size={18} />, path: "/customers/add" },
      { label: "List Supplier", icon: <ListOrdered size={18} />, path: "/suppliers" },
      { label: "Add Supplier", icon: <PlusCircle size={18} />, path: "/suppliers/add" },
    ],
  },
  {
    label: "Reports",
    icon: <BarChart3 size={20} />,
    children: [
      { label: "Sales Reports", icon: <BarChart3 size={18} />, path: "/reports/sales" },
      { label: "Purchase Reports", icon: <BarChart3 size={18} />, path: "/reports/purchases" },
      { label: "Inventory Reports", icon: <BarChart3 size={18} />, path: "/reports/inventory" },
    ],
  },
  {
    label: "Logs",
    icon: <ScrollText size={20} />,
    children: [
      { label: "Activity Logs", icon: <ScrollText size={18} />, path: "/logs/activity" },
      { label: "System Logs", icon: <ScrollText size={18} />, path: "/logs/system" },
    ],
  },
  {
    label: "Settings",
    icon: <Settings size={20} />,
    children: [
      { label: "Warehouses", icon: <Building2 size={18} />, path: "/settings/warehouse" },
    ],
  },
  {
    label: "Users",
    icon: <Users size={20} />,
    children: [
      { label: "User Management", icon: <ShieldCheck size={18} />, path: "/settings/users" },
      { label: "User System", icon: <Users size={18} />, path: "/user-management-system" },
    ],
  },
];

export function Sidebar() {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpand = (label: string) => {
    setExpandedItems(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  return (
    <aside className="w-56 bg-[#1a1d29] text-white flex flex-col h-screen overflow-hidden">
      {/* Brand header */}
      <div className="px-4 py-3 border-b border-white/10">
        <h1 className="text-base font-semibold">Hearing Aid Labs</h1>
        <p className="text-xs text-blue-400 font-medium mt-0.5">HeadOffice POS</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        {navItems.map((item) => (
          <div key={item.label}>
            {item.children ? (
              <div>
                <button
                  onClick={() => toggleExpand(item.label)}
                  className="w-full flex items-center justify-between px-4 py-2 text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span className="text-sm">{item.label}</span>
                  </div>
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${expandedItems.includes(item.label) ? "" : "-rotate-90"}`}
                  />
                </button>
                {expandedItems.includes(item.label) && (
                  <div className="bg-black/20">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.label}
                        to={child.path || "#"}
                        className={({ isActive }) =>
                          `flex items-center gap-2 px-4 pl-10 py-1.5 text-xs transition-colors ${isActive
                            ? "bg-blue-600 text-white"
                            : "text-white/70 hover:bg-white/5 hover:text-white"
                          }`
                        }
                      >
                        {child.icon}
                        <span>{child.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <NavLink
                to={item.path || "#"}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 transition-colors ${isActive
                    ? "bg-blue-600 text-white"
                    : "text-white/80 hover:bg-white/5 hover:text-white"
                  }`
                }
              >
                {item.icon}
                <span className="text-sm">{item.label}</span>
              </NavLink>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
