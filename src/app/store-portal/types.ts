export type Role = "admin" | "user" | "store_manager";

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: Role;
  warehouse: string | null;
  storeId: number | null;
  storeName?: string | null;
}

export interface ProductImage {
  url: string;
  thumbnailUrl?: string | null;
  alt?: string | null;
  sortOrder: number;
}

export interface CatalogFacet {
  id: number;
  name: string;
  productCount?: number;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  category?: string | null;
  subCategory?: string | null;
  brand?: string | null;
  model?: string | null;
  unit?: string;
  costPrice: number;
  sellingPrice: number;
  mrp?: number | null;
  taxPercent: number;
  description?: string | null;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  images: ProductImage[];
  status: string;
  alertQty: number;
  availableQty?: number;
  physicalQty?: number;
  allocatedQty?: number;
  incomingSupplierQty?: number;
  totalStock?: number;
}

export interface Store {
  id: number;
  name: string;
  code?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  manager?: string;
  status?: string;
}

export interface Warehouse {
  id: number;
  name: string;
  code?: string;
  type?: string;
  status?: string;
  city?: string;
  address?: string;
}

/**
 * Head Office stock for B2B ordering.
 * availableQty = physicalQty - allocatedQty (when backend is correct).
 */
export interface StockLine {
  sku: string;
  name: string;
  category?: string;
  brand?: string;
  warehouse?: string;
  storeId?: number;
  productId?: number;
  /** Units physically on HO shelf */
  physicalQty: number;
  /** Units committed to open branch orders (not yet invoiced/dispatched) */
  allocatedQty: number;
  /** What branches can order now */
  availableQty: number;
  incomingSupplierQty: number;
  alertQty: number;
  unitCost: number;
  sellingPrice: number;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  /** @deprecated use allocatedQty */
  reservedQty?: number;
  inTransitQty?: number;
  incomingQty?: number;
}

export type BranchOrderStatus =
  | "PRE_ORDER"
  | "ORDERED"
  | "PROCESSING"
  | "PARTIAL"
  | "BACKORDER"
  | "INVOICED"
  | "DISPATCHED"
  | "RECEIVED"
  | "PARTIALLY_RECEIVED"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED"
  | string;

export interface BranchOrderItem {
  id?: number;
  productId?: number;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  tax?: number;
  isBackorder?: boolean;
  imageUrl?: string | null;
  dispatchedQty?: number;
  receivedQty?: number | null;
  removed?: boolean;
}

export interface OrderTimelineEvent {
  oldStatus?: string | null;
  newStatus?: string;
  notes?: string | null;
  changedBy?: string;
  createdAt?: string;
}

export interface BranchOrder {
  id: number;
  reference: string;
  storeId: number | null;
  storeName?: string | null;
  status: BranchOrderStatus;
  orderType?: string;
  createdAt?: string;
  createdBy?: string;
  notes?: string;
  subtotal: number;
  tax: number;
  total: number;
  items: BranchOrderItem[];
  /** Present on list responses when full `items` are omitted */
  itemCount?: number;
  timeline?: OrderTimelineEvent[];
  saleId?: number | null;
  saleReference?: string | null;
  source?: "order" | "transfer" | "purchase";
  fromWarehouse?: string | null;
  parentOrderId?: number | null;
  parentReference?: string | null;
  backorderOrderId?: number | null;
  backorderReference?: string | null;
  invoiceId?: number | null;
  invoiceReference?: string | null;
  removedItems?: BranchOrderItem[];
}

export interface CartLine {
  cartItemId?: number;
  productId: number;
  sku: string;
  name: string;
  imageUrl?: string | null;
  unitCost: number;
  availableQty: number;
  qty: number;
  /** True when HO available qty is 0. This is not a Lauren back-order status. */
  isBackorder?: boolean;
  taxPercent?: number;
}

export interface LedgerEntry {
  id: number;
  movementType?: string;
  locationName?: string;
  productSku?: string;
  productName?: string;
  quantityChange?: number;
  balanceAfter?: number;
  createdAt?: string;
  [key: string]: unknown;
}

/** Legacy transfer types kept for optional admin transfer screens */
export type TransferStatus = string;

export interface TransferItem {
  productId?: number;
  productSku: string;
  productName: string;
  quantity: number;
  purchasePrice: number;
}

export interface Transfer {
  id: number;
  transferNumber: string;
  warehouseId?: number;
  warehouseName?: string;
  storeId?: number;
  storeName?: string;
  status: TransferStatus;
  createdAt?: string;
  remarks?: string;
  itemCount?: number;
  items?: TransferItem[];
  totalValue?: number;
}
