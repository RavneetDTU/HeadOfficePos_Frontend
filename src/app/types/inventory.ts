// ─────────────────────────────────────────────────────────────────────────────
// HAL POS — Type Definitions (aligned with live backend OpenAPI spec)
// Base URL: http://103.55.104.142:5022
// ─────────────────────────────────────────────────────────────────────────────

// ─── Auth ─────────────────────────────────────────────────────────────────────

export type Role = "admin" | "user";

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  initials: string;
  role: Role;
  warehouse: string | null;
  created_at: string;
}

// ─── Master Data ─────────────────────────────────────────────────────────────

export interface MasterDataProduct {
  id: number;
  sku: string;
  name: string;
  costPrice: number;
  sellingPrice: number;
  taxPercent: number;
}

export interface MasterDataCustomer {
  id: number;
  firstName: string;
  surname?: string | null;
  phone: string;
  email?: string | null;
}

export interface MasterDataSupplier {
  id: number;
  name: string;
  company: string;
  phone: string;
  email?: string | null;
}

export interface MasterDataBiller {
  id: number;
  name: string;
  company: string;
  phone: string;
  email?: string | null;
}

export interface MasterDataResponse {
  products: MasterDataProduct[];
  customers: MasterDataCustomer[];
  suppliers: MasterDataSupplier[];
  billers: MasterDataBiller[];
  totalProducts?: number;
  totalCustomers?: number;
}

// ─── Warehouses ───────────────────────────────────────────────────────────────

export interface WarehouseOut {
  id: number;
  name: string;
  // The real backend may not return all these fields; optional for safety
  code?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  manager?: string;
  type?: "warehouse" | "store";
  status?: "Active" | "Inactive";
  created_at?: string;
}

/** Legacy alias used by existing pages – kept for backward compat */
export type Warehouse = WarehouseOut & {
  code: string;
  type: "warehouse" | "store";
  status: "Active" | "Inactive";
  created_at: string;
};

// ─── Stores ───────────────────────────────────────────────────────────────────

export interface StoreOut {
  id: number;
  name: string;
  code?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  manager?: string;
  status?: "Active" | "Inactive";
  created_at?: string;
}

// ─── Warehouse Inventory ──────────────────────────────────────────────────────

export interface WarehouseInventoryOut {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  category?: string;
  quantity: number;
  warehouseId: number;
  warehouseName: string;
}

/** Legacy alias for pages still using old field names */
export type WarehouseInventoryItem = {
  id: number;
  product_id: number;
  sku: string;
  name: string;
  category?: string;
  brand?: string;
  unit?: string;
  warehouse_id: number;
  warehouse_name: string;
  quantity: number;
  reserved_qty: number;
  available_qty: number;
  purchase_price: number;
  selling_price: number;
  alert_qty: number;
  is_low_stock: boolean;
  last_updated: string;
};

export interface WarehouseInventoryResponse {
  items: WarehouseInventoryItem[];
  total: number;
  total_pages: number;
  current_page: number;
}

export interface AddStockPayload {
  warehouse_id: number;
  product_id: number;
  quantity: number;
  purchase_price: number;
  notes?: string;
  batch_number?: string;
}

// ─── Store Inventory ──────────────────────────────────────────────────────────

export interface StoreInventoryOut {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  category?: string;
  quantity: number;
  storeId: number;
  storeName: string;
}

/** Legacy alias for StoreInventory page */
export type StoreInventoryItem = {
  id: number;
  product_id: number;
  sku: string;
  product_name: string;
  category?: string;
  brand?: string;
  quantity: number;
  purchase_price: number;
  selling_price: number;
  alert_qty: number;
  is_low_stock: boolean;
  last_received_date?: string;
  last_sale_date?: string;
};

export interface StoreInventoryResponse {
  store_id: number;
  store_name: string;
  items: StoreInventoryItem[];
  total: number;
  total_pages: number;
  current_page: number;
}

// ─── Inventory Ledger ─────────────────────────────────────────────────────────

export interface InventoryLedgerOut {
  id: number;
  movementType: string;
  locationType: string;
  locationId: number;
  locationName: string;
  productId: number;
  productSku: string;
  productName: string;
  quantityChange: number;
  balanceAfter: number;
  referenceType?: string | null;
  referenceId?: number | null;
  createdAt: string;
}

export interface InventoryAdjustmentCreate {
  locationType: "Warehouse" | "Store";
  locationId: number;
  productId: number;
  physicalQuantity: number;
  systemQuantity: number;
  reason?: string | null;
}

export interface InventoryAdjustmentOut {
  id: number;
  locationType: string;
  locationId: number;
  locationName: string;
  productId: number;
  productSku: string;
  productName: string;
  systemQuantity: number;
  physicalQuantity: number;
  adjustmentQty: number;
  reason?: string | null;
  createdAt: string;
}

// ─── Warehouse Transfers ──────────────────────────────────────────────────────

export interface WarehouseTransferItem {
  productId: number;
  productSku: string;
  productName: string;
  quantity: number;
  unitCost?: number;
}

export interface WarehouseTransferListItemOut {
  id: number;
  reference?: string;
  warehouseId?: number;
  warehouseName?: string;
  storeId?: number;
  storeName?: string;
  status?: string;
  createdAt?: string;
  transferredAt?: string;
  itemCount?: number;
  // fields the API actually returns (flexible shape)
  [key: string]: unknown;
}

export interface WarehouseTransferDetailOut {
  id: number;
  reference?: string;
  warehouseId?: number;
  warehouseName?: string;
  storeId?: number;
  storeName?: string;
  status?: string;
  createdAt?: string;
  items?: WarehouseTransferItem[];
  [key: string]: unknown;
}

export interface WarehouseTransferListResponse {
  transfers: WarehouseTransferListItemOut[];
  total: number;
  total_pages: number;
  current_page: number;
}

export interface WarehouseTransferCreate {
  warehouseId: number;
  storeId: number;
  items: Array<{
    productId: number;
    quantity: number;
    unitCost?: number;
  }>;
  notes?: string;
}

export interface WarehouseTransferResponse {
  id: number;
  reference?: string;
  status?: string;
  [key: string]: unknown;
}

// Legacy transfer types (kept for backward compat with existing pages)
export interface TransferItem {
  id?: number;
  product_id: number;
  sku: string;
  product_name: string;
  category?: string;
  quantity: number;
  purchase_price: number;
  subtotal?: number;
}

export interface Transfer {
  id: number;
  transfer_reference: string;
  transfer_date: string;
  from_warehouse_id: number;
  from_warehouse_name: string;
  to_store_id: number;
  to_store_name: string;
  notes?: string;
  status: "Completed" | "Pending" | "Cancelled" | "Approved" | "In Transit" | "Delivered" | "Rejected";
  created_by: string;
  created_at: string;
  items?: TransferItem[];
  total_items: number;
  total_value: number;
}

export interface TransferListResponse {
  transfers: Transfer[];
  total: number;
  total_pages: number;
  current_page: number;
}

export interface CreateTransferPayload {
  from_warehouse_id: number;
  to_store_id: number;
  transfer_date: string;
  notes?: string;
  items: Array<{
    product_id: number;
    quantity: number;
    purchase_price: number;
  }>;
}

// ─── Store Purchase History ───────────────────────────────────────────────────

export interface StorePurchaseHistoryItem {
  transfer_reference: string;
  transfer_date: string;
  product_name: string;
  sku: string;
  quantity_received: number;
  purchase_price: number;
  total_cost: number;
  from_warehouse: string;
  status: string;
}

export interface StorePurchaseHistoryResponse {
  transfers: StorePurchaseHistoryItem[];
  total: number;
  total_pages: number;
  current_page: number;
}

// ─── Sales ────────────────────────────────────────────────────────────────────

export interface RefundOut {
  id: number;
  sale_id: number;
  customer?: string | null;
  amount: number;
  method?: string | null;
  status?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface SaleReturnOut {
  id: number;
  date?: string;
  reference?: string;
  saleReference?: string;
  customer?: string | null;
  warehouse?: string;
  grandTotal?: number;
  paid?: number;
  balance?: number;
  salesStatus?: string;
  [key: string]: unknown;
}

export interface DeliveryOut {
  id: number;
  sale_id: number;
  customer?: string | null;
  address?: string | null;
  status: string;
  tracking_info?: string | null;
}

export interface GiftCardOut {
  id: number;
  card_number: string;
  value: number;
  balance: number;
  status: string;
  customer_name?: string | null;
}

export interface CashupOut {
  id: number;
  warehouse: string;
  date: string;
  expected_total: number;
  actual_counted: number;
  difference: number;
  entered_by?: string | null;
}

export interface StockItemOut {
  id?: number;
  productId?: number;
  productSku?: string;
  productName?: string;
  quantity?: number;
  [key: string]: unknown;
}

// ─── Purchases ────────────────────────────────────────────────────────────────

export interface PurchaseReturnOut {
  id: number;
  date?: string;
  reference?: string;
  purchaseReference?: string;
  supplier?: string;
  surcharge?: number;
  grandTotal?: number;
  [key: string]: unknown;
}

export interface ExpenseOut {
  id: number;
  date: string;
  reference?: string | null;
  warehouse: string;
  category: string;
  amount: number;
  note?: string | null;
  createdBy?: string | null;
}


export interface ExpenseCreate {
  date: string;
  warehouse: string;
  category: string;
  amount: number;
  reference?: string | null;
  note?: string | null;
}

export interface PurchaseOverview {
  total_purchases?: number;
  total_amount?: number;
  preordered?: number;
  received?: number;
  returned?: number;
  pending?: number;
  [key: string]: unknown;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface WarehouseDashboardOut {
  totalProducts?: number;
  totalStock?: number;
  totalValue?: number;
  recentPurchases?: Array<{ [key: string]: unknown }>;
  recentTransfers?: Array<{ [key: string]: unknown }>;
  lowStockItems?: Array<{ [key: string]: unknown }>;
  [key: string]: unknown;
}

export interface StoreDashboardOut {
  totalProducts?: number;
  totalStock?: number;
  totalValue?: number;
  recentSales?: Array<{ [key: string]: unknown }>;
  recentPurchases?: Array<{ [key: string]: unknown }>;
  lowStockItems?: Array<{ [key: string]: unknown }>;
  [key: string]: unknown;
}

// Legacy dashboard types (kept for AdminDashboard/StoreDashboard component compat)
export interface AdminDashboardSummary {
  warehouse_summary: {
    total_warehouse_stock_value: number;
    total_warehouse_items: number;
    total_warehouse_qty?: number;
    low_stock_count: number;
    low_stock_items: Array<{
      product_id: number;
      sku: string;
      name: string;
      warehouse_name: string;
      quantity: number;
      alert_qty: number;
    }>;
  };
  store_summary: {
    total_store_stock_value: number;
    total_store_items: number;
    low_stock_stores: Array<{
      store_id: number;
      store_name: string;
      low_stock_count: number;
    }>;
  };
  sales_summary: {
    total_sales_today: number;
    total_sales_month: number;
    total_sales_count_today: number;
    total_sales_count_month: number;
  };
  recent_transfers: Array<{
    transfer_reference: string;
    to_store_name: string;
    total_value: number;
    date: string;
  }>;
  recent_sales: Array<{
    reference: string;
    customer_name: string;
    warehouse: string;
    grand_total: number;
    date: string;
  }>;
}

export interface StoreDashboardSummary {
  store_id: number;
  store_name: string;
  inventory_summary: {
    total_items: number;
    total_stock_qty: number;
    total_stock_value: number;
    low_stock_count: number;
    low_stock_items: Array<{
      sku: string;
      name: string;
      quantity: number;
      alert_qty: number;
    }>;
  };
  sales_summary: {
    today_sales_total: number;
    today_sales_count: number;
    month_sales_total: number;
    month_sales_count: number;
  };
  recent_purchases_from_warehouse: Array<{
    transfer_reference: string;
    date: string;
    product_name: string;
    quantity: number;
  }>;
  recent_sales: Array<{
    reference: string;
    customer_name: string;
    grand_total: number;
    date: string;
  }>;
}

// ─── Query Params ─────────────────────────────────────────────────────────────

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface WarehouseInventoryParams extends PaginationParams {
  warehouse_id?: number;
  search?: string;
  category?: string;
  low_stock?: boolean;
}

export interface TransferListParams extends PaginationParams {
  from_warehouse_id?: number;
  to_store_id?: number;
  status?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  warehouseId?: number;
  storeId?: number;
}

export interface ProductListParams extends PaginationParams {
  search?: string;
  category?: string;
  brand?: string;
  status?: string;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  total_pages: number;
  current_page: number;
}

// ─── Products ─────────────────────────────────────────────────────────────────

export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  category?: string;
  brand?: string;
  unit?: string;
  cost_price: number;
  selling_price: number;
  tax_rate?: number;
  description?: string;
  image_url?: string;
  alert_qty?: number;
  status: "Active" | "Inactive";
  created_at: string;
}

// ─── Stock Requests ───────────────────────────────────────────────────────────

export type StockRequestStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Transfer Created"
  | "In Transit"
  | "Delivered"
  | "Cancelled";

export interface StockRequestItem {
  id: number;
  product_id: number;
  sku: string;
  product_name: string;
  quantity: number;
}

export interface StockRequest {
  id: number;
  request_number: string;
  store_id: number;
  store_name?: string;
  requested_by_id: number;
  requested_by?: string;
  status: StockRequestStatus;
  remarks?: string | null;
  transfer_id?: number | null;
  items: StockRequestItem[];
  created_at: string;
  updated_at: string;
}

export interface StockRequestListResponse {
  requests: StockRequest[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export interface CreateStockRequestPayload {
  remarks?: string;
  items: { sku: string; quantity: number }[];
}

export interface UpdateStockRequestStatusPayload {
  status: "Approved" | "Rejected";
  remarks?: string;
}
