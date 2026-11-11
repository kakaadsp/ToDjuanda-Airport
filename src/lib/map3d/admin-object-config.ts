export type MapObjectOccupancy = "OCCUPIED" | "VACANT" | "WALKABLE" | "OBSTACLE";
export type MapObjectDoorSide = "NORTH" | "EAST" | "SOUTH" | "WEST";
export type MapObjectDoor = { side: MapObjectDoorSide; open: boolean; position: number };

export type MapObjectConfig = {
  objectName: string;
  displayName: string;
  category?: string;
  entityType: "TENANT" | "FACILITY";
  color: string;
  entryDoors: MapObjectDoor[];
  occupancy: MapObjectOccupancy;
  description: string;
  photoUrl: string;
  websiteUrl: string;
  instagramUrl: string;
  contact: string;
  openTime: string;
  closeTime: string;
  activeFrom: string;
  activeUntil: string;
  updatedAt: string;
};

export const COMMERCIAL_CATEGORIES = [
  "Makanan & Minuman (F&B)",
  "Oleh-oleh & Suvenir",
  "Elektronik & Gadget",
  "Fashion & Pakaian",
  "Buku & Toko Buku",
  "Minimarket & Retail",
  "Jasa & Layanan",
  "Kavling Kosong (Belum Disewa)",
  "Komersial Lainnya",
] as const;

export type CommercialCategory = (typeof COMMERCIAL_CATEGORIES)[number];

export function isFacilityObject(nameOrCode: string, entityType?: string, displayName?: string): boolean {
  if (entityType === "FACILITY") return true;
  const n = `${nameOrCode || ""} ${displayName || ""}`.toLowerCase();
  return (
    /(?:-avsec-|-tl-|-atm-|-nr-|-man-|-mus-|toilet|mushola|musala|restroom)|^(?:floor_|area_visitor)/i.test(n) ||
    /(?:door__|baggage|customer\s*service|pelayanan|informasi|eskalator|eks[-_ ]|tangga|taman|lift|elevator|gate[-_ ]|boarding)/i.test(n)
  );
}

export function inferCommercialCategory(displayName?: string, objectName?: string): string {
  const raw = `${displayName || ""} ${objectName || ""}`.trim();
  const name = raw.toLowerCase();

  // 1. Kosong / Belum disewa
  if (/(?:^|[^a-z])(?:kosong|vacant|unoccupied)(?:$|[^a-z])/i.test(name)) {
    return "Kavling Kosong (Belum Disewa)";
  }

  // 2. Minimarket & Retail - FamilyMart, Circle K, Alfamart, Indomaret
  if (
    /(?:familymart|family\s*mart|fami\s*mart|circle\s*k|alfamart|indomaret|minimarket|convenience|retail\s*mart)/i.test(
      name
    )
  ) {
    return "Minimarket & Retail";
  }

  // 3. Makanan & Minuman (F&B) - Subway, Killiney, A Fung, Pafu, Dough Lab, Expat, Sky Beans, dll.
  if (
    /(?:subway|killiney|a\s*fung|pafu|dough\s*lab|expat|sky\s*beans|starbucks|bangi|bakmi|gocit|a&w|a\s*&\s*w|donut|king|roti|bakso|la\s*cafe|aroma\s*padang|beard\s*papa|gloria\s*jean|kuliner|sandang\s*pangan|papan\s*dahar|yogurt|bangkalan|fami\s*cafe|le\s*petit|kedai|solaria|rotiboy|shihlin|mm\s*juice|concordia|majapahit|blue\s*sky|kopi|coffee|cafe|resto|restaurant|makan|minum|snack|burger|kopitiam|tea|beverage|kitchen|dapur|soto|ayam|mie|bites|lounge)/i.test(
      name
    )
  ) {
    return "Makanan & Minuman (F&B)";
  }

  // 4. Oleh-oleh & Suvenir - Bogajaya, IDP Surabaya, dll.
  if (
    /(?:bogajaya|boga\s*jaya|idp\s*surabaya|idp|oleh[- ]*oleh|suvenir|souvenir|spikoe|lapis|khas|pahlawan|kerajinan|cindera\s*mata)/i.test(
      name
    )
  ) {
    return "Oleh-oleh & Suvenir";
  }

  // 5. Elektronik & Gadget - JETE, Soundcore, dll.
  if (
    /(?:jete|soundcore|gadget|elektronik|electronic|audio|headphone|earphone|digimap|ibox|erafone|accessories\s*hp|ponsel|phone)/i.test(
      name
    )
  ) {
    return "Elektronik & Gadget";
  }

  // 6. Fashion & Pakaian - Polo, Batik Keris, Gajah Duduk, Bratpack, dll.
  if (
    /(?:polo|batik|keris|gajah\s*duduk|bratpack|hadinata|kemompong|kepompong|baju|kaos|apparel|clothing|fashion|busana|tekstil|textile|wear|outfit)/i.test(
      name
    )
  ) {
    return "Fashion & Pakaian";
  }

  // 7. Buku & Toko Buku - Periplus
  if (/(?:periplus|buku|bookstore|books|majalah|reading|gramedia)/i.test(name)) {
    return "Buku & Toko Buku";
  }

  // 8. Jasa & Layanan - Secret Garden, Reflexology, dll.
  if (
    /(?:secret\s*garden|secret\s*golden|foot\s*reflexology|reflexology|beauty|salon|spa|massage|relaksasi|bluebird|taxi|travel|tour|wisata|destinasi|bank|bni|mandiri|bri|bca|valuta|money\s*changer|wrapping|laundry|aura\s*travel)/i.test(
      name
    )
  ) {
    return "Jasa & Layanan";
  }

  return "Komersial Lainnya";
}

export function extractCategoryFromConfig(config: Partial<MapObjectConfig>): string {
  if (config.category && config.category.trim()) return config.category.trim();
  if (config.occupancy === "VACANT" || /(?:^|[^a-z])kosong(?:$|[^a-z])/i.test(config.displayName || "")) {
    return "Kavling Kosong (Belum Disewa)";
  }
  const descMatch = config.description?.match(/\[Kategori:\s*([^\]]+)\]/i);
  if (descMatch?.[1]) return descMatch[1].trim();
  if (isFacilityObject(config.objectName || "", config.entityType, config.displayName)) {
    const val = `${config.objectName || ""} ${config.displayName || ""}`.toLowerCase();
    if (/(?:tl|toilet)/i.test(val)) return "Toilet";
    if (/atm/i.test(val)) return "ATM";
    if (/(?:mus|mushol)/i.test(val)) return "Mushola";
    if (/(?:nursery|laktasi|nr)/i.test(val)) return "Ruang Laktasi / Nursery";
    if (/(?:customer\s*service|informasi|layanan)/i.test(val)) return "Pusat Informasi";
    return "Fasilitas & Layanan";
  }
  return inferCommercialCategory(config.displayName, config.objectName);
}

export type MapObjectConfigByName = Record<string, MapObjectConfig>;

export const MAP_OBJECT_CONFIG_STORAGE_KEY = "todjuanda.admin.map-object-config.v1";

/** Converts common Google Drive share links into an image URL usable by <img>. */
export function getMapObjectPhotoUrl(value: string | undefined | null): string {
  const raw = value?.trim() ?? "";
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (!/(^|\.)drive\.google\.com$/i.test(url.hostname) && !/(^|\.)googleusercontent\.com$/i.test(url.hostname)) {
      return raw;
    }
    const fileMatch = url.pathname.match(/\/(?:file\/)?d\/([^/]+)/i);
    const id = fileMatch?.[1] ?? url.searchParams.get("id");
    return id ? `https://lh3.googleusercontent.com/d/${id}` : raw;
  } catch {
    return raw;
  }
}

export function defaultMapObjectConfig(objectName: string): MapObjectConfig {
  const isFacility = isFacilityObject(objectName);
  return {
    objectName,
    displayName: "",
    category: "",
    entityType: isFacility ? "FACILITY" : "TENANT",
    color: "",
    entryDoors: [
      { side: "NORTH", open: true, position: 50 },
      { side: "EAST", open: true, position: 50 },
      { side: "SOUTH", open: true, position: 50 },
      { side: "WEST", open: true, position: 50 },
    ],
    occupancy: "OCCUPIED",
    description: "",
    photoUrl: "",
    websiteUrl: "",
    instagramUrl: "",
    contact: "",
    openTime: "",
    closeTime: "",
    activeFrom: "",
    activeUntil: "",
    updatedAt: "",
  };
}

export function readMapObjectConfigs(): MapObjectConfigByName {
  if (typeof window === "undefined") return {};
  try {
    const value = JSON.parse(window.localStorage.getItem(MAP_OBJECT_CONFIG_STORAGE_KEY) ?? "{}");
    if (!value || typeof value !== "object") return {};
    return Object.fromEntries(
      Object.entries(value as Record<string, Partial<MapObjectConfig>>).map(([objectName, config]) => {
        const base = defaultMapObjectConfig(objectName);
        const resolvedCategory = config.category?.trim() || extractCategoryFromConfig({ ...base, ...config, objectName });
        return [
          objectName,
          {
            ...base,
            ...config,
            objectName,
            category: resolvedCategory,
            entryDoors: config.entryDoors?.slice(0, 4) ?? base.entryDoors,
          },
        ];
      }),
    ) as MapObjectConfigByName;
  } catch {
    return {};
  }
}

export function writeMapObjectConfigs(configs: MapObjectConfigByName) {
  window.localStorage.setItem(MAP_OBJECT_CONFIG_STORAGE_KEY, JSON.stringify(configs));
  window.dispatchEvent(new CustomEvent("todjuanda-map-config-change", { detail: configs }));
}

/**
 * Ambil semua konfigurasi objek peta dari database via API.
 * Menyimpan hasilnya ke localStorage sebagai cache.
 * Melempar error jika fetch gagal.
 */
export async function fetchMapObjectConfigsFromDb(): Promise<MapObjectConfigByName> {
  const response = await fetch("/api/admin/map-objects", { cache: "no-store" });
  if (!response.ok) throw new Error(`Gagal mengambil konfigurasi peta: ${response.status}`);
  const raw = (await response.json()) as Record<string, Partial<MapObjectConfig>>;
  const databaseConfigs: MapObjectConfigByName = Object.fromEntries(
    Object.entries(raw).map(([objectName, config]) => {
      const base = defaultMapObjectConfig(objectName);
      const resolvedCategory = config.category?.trim() || extractCategoryFromConfig({ ...base, ...config, objectName });
      return [
        objectName,
        {
          ...base,
          ...config,
          objectName,
          category: resolvedCategory,
          entryDoors: config.entryDoors?.slice(0, 4) ?? base.entryDoors,
        },
      ];
    }),
  );
  // Simpan ke localStorage sebagai cache
  if (typeof window === "undefined") return databaseConfigs;
  const configs = { ...readMapObjectConfigs(), ...databaseConfigs };
  window.localStorage.setItem(MAP_OBJECT_CONFIG_STORAGE_KEY, JSON.stringify(configs));
  return configs;
}

/**
 * Simpan konfigurasi satu objek ke database via API, lalu update localStorage.
 */
export async function saveMapObjectConfigToDb(config: MapObjectConfig): Promise<void> {
  const response = await fetch(`/api/admin/map-objects/${encodeURIComponent(config.objectName)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error ?? `Gagal menyimpan: ${response.status}`);
  }
  // Update localStorage juga agar perubahan langsung terlihat
  if (typeof window !== "undefined") {
    const existing = readMapObjectConfigs();
    const next = { ...existing, [config.objectName]: { ...config, updatedAt: new Date().toISOString() } };
    writeMapObjectConfigs(next);
  }
}

/**
 * Simpan semua konfigurasi (batch) ke database via API.
 */
export async function saveAllMapObjectConfigsToDb(configs: MapObjectConfigByName): Promise<void> {
  const response = await fetch("/api/admin/map-objects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(configs),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error ?? `Gagal menyimpan: ${response.status}`);
  }
  if (typeof window !== "undefined") {
    writeMapObjectConfigs(configs);
  }
}

