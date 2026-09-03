/** Prefix stored in API `imageUrl` when the binary lives in browser IndexedDB. */
export const LOCAL_PRODUCT_IMAGE_PREFIX = "local:";

const DB_NAME = "hal_pos_product_images";
const STORE_NAME = "images";
const DB_VERSION = 1;

function normalizeSku(sku: string): string {
  return sku.trim().toLowerCase();
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error("Failed to open image store."));
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

export function isLocalProductImageRef(
  imageUrl: string | null | undefined
): boolean {
  return !!imageUrl?.startsWith(LOCAL_PRODUCT_IMAGE_PREFIX);
}

export function localProductImageRef(sku: string): string {
  return `${LOCAL_PRODUCT_IMAGE_PREFIX}${encodeURIComponent(normalizeSku(sku))}`;
}

export function parseLocalProductImageRef(
  imageUrl: string | null | undefined
): string | null {
  if (!isLocalProductImageRef(imageUrl)) return null;
  try {
    return decodeURIComponent(imageUrl!.slice(LOCAL_PRODUCT_IMAGE_PREFIX.length));
  } catch {
    return imageUrl!.slice(LOCAL_PRODUCT_IMAGE_PREFIX.length);
  }
}

/** Persist uploaded image bytes locally, keyed by SKU. */
export async function saveProductImage(sku: string, file: Blob): Promise<void> {
  const db = await openDb();
  const key = normalizeSku(sku);
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error ?? new Error("Failed to save product image."));
    tx.objectStore(STORE_NAME).put(file, key);
  });
}

export async function getProductImageBlob(sku: string): Promise<Blob | null> {
  const db = await openDb();
  const key = normalizeSku(sku);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(key);
    request.onerror = () => reject(request.error ?? new Error("Failed to read product image."));
    request.onsuccess = () => {
      db.close();
      resolve((request.result as Blob | undefined) ?? null);
    };
  });
}

/** Create a temporary object URL for displaying a locally stored product image. */
export async function getProductImageObjectUrl(sku: string): Promise<string | null> {
  const blob = await getProductImageBlob(sku);
  return blob ? URL.createObjectURL(blob) : null;
}

export async function deleteProductImage(sku: string): Promise<void> {
  const db = await openDb();
  const key = normalizeSku(sku);
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error ?? new Error("Failed to delete product image."));
    tx.objectStore(STORE_NAME).delete(key);
  });
}
