import {
  LoaderCircle,
  ChevronDown,
  Check,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import QRCode from "qrcode";
import { useNavigate, useParams } from "react-router-dom";
import { ModuleTabs } from "../components/layout/ModuleTabs";
import { useAuth } from "../features/auth/AuthProvider";
import { ApiError, resolveApiAssetUrl } from "../lib/api/auth";
import {
  acknowledgeStockAlert,
  createCategory,
  createProduct,
  createRawMaterial,
  createStockMovement,
  createWarehouse,
  createWarehouseStock,
  createSupplier,
  createUnit,
  deleteCategory,
  deleteProduct,
  deleteRawMaterial,
  deleteStockMovement,
  deleteWarehouse,
  deleteWarehouseStock,
  deleteSupplier,
  deleteUnit,
  fetchCategories,
  fetchCategory,
  fetchProduct,
  fetchProducts,
  fetchRawMaterial,
  fetchRawMaterials,
  fetchStockAlerts,
  fetchStockMovement,
  fetchStockMovements,
  fetchSupplier,
  fetchSuppliers,
  fetchUnit,
  fetchUnits,
  fetchWarehouse,
  fetchWarehouses,
  fetchWarehouseStock,
  fetchWarehouseStockItem,
  updateCategory,
  updateProduct,
  updateRawMaterial,
  updateStockMovement,
  updateWarehouse,
  updateWarehouseStock,
  updateSupplier,
  updateUnit,
} from "../lib/api/inventory";
import type {
  CategoryPayload,
  CategoryRecord,
  FinishedProductPayload,
  FinishedProductRecord,
  RawMaterialPayload,
  RawMaterialRecord,
  StockAlertRecord,
  StockItemPayload,
  StockItemRecord,
  StockMovementPayload,
  StockMovementRecord,
  StockMovementType,
  StorageLocationPayload,
  StorageLocationRecord,
  SupplierPayload,
  SupplierRecord,
  UnitPayload,
  UnitRecord,
} from "../types/inventory";

const fieldClassName =
  "w-full rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300";
const textAreaClassName = `${fieldClassName} min-h-[108px] resize-y`;
const primaryButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-[linear-gradient(135deg,#1f87ad,#0f6d8d)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(32,141,183,0.22)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70";
const secondaryButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70";
const dangerButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70";
const iconButtonClassName =
  "inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70";
const recordCardClassName =
  "group relative flex h-[320px] min-w-[300px] max-w-[300px] flex-shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4";
const recordEditButtonClassName = `${iconButtonClassName} absolute right-4 top-4 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto`;

const inventoryMilestoneFlow = [
  {
    id: "units",
    label: "Units",
    detail:
      "Define the measurement units here. Before this, there is nothing to prepare. Next, add suppliers.",
  },
  {
    id: "suppliers",
    label: "Suppliers",
    detail:
      "Add and update suppliers here. Before this, make sure the units are ready. Next, build product categories.",
  },
  {
    id: "categories",
    label: "Categories",
    detail:
      "Organize product categories here. Before this, suppliers should already be in place. Next, set up warehouses.",
  },
  {
    id: "warehouses",
    label: "Warehouses",
    detail:
      "Set up warehouses, cold rooms, and stores here. Before this, confirm categories are in place. Next, add raw materials.",
  },
  {
    id: "raw",
    label: "Raw Materials",
    detail:
      "Create and edit raw materials here. Before this, warehouses should already exist. Next, add products.",
  },
  {
    id: "products",
    label: "Products",
    detail:
      "Set up products here with category, supplier, pricing, reorder rules, and default warehouse context. Next, create warehouse stock.",
  },
  {
    id: "stock",
    label: "Warehouse Stock",
    detail:
      "Create warehouse stock records here and link them to warehouses. Before this, products should be in place. Next, record stock movements.",
  },
  {
    id: "movements",
    label: "Stock Movements",
    detail:
      "Capture stock movement entries here. Before this, warehouse stock should already exist. Next, review stock alerts.",
  },
  {
    id: "alerts",
    label: "Stock Alerts",
    detail:
      "Review low-stock and out-of-stock alerts here. Before this, you should have stock movements recorded. This is the last inventory step.",
  },
] as const;

type ActiveModal =
  | "unit"
  | "category"
  | "supplier"
  | "location"
  | "rawMaterial"
  | "finishedProduct"
  | "stockItem"
  | "movement"
  | null;

type StockItemFormState = {
  item_kind: "raw_material" | "finished_product";
  raw_material: string;
  finished_product: string;
  location: string;
  opening_stock: string;
  bin_location: string;
};

type StockMovementFormState = {
  stock_item: string;
  movement_type: StockMovementType;
  quantity: string;
  notes: string;
  movement_date: string;
};

function ProductQrPreview({
  value,
  size = 144,
  className = "",
}: {
  value: string;
  size?: number;
  className?: string;
}) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    let isMounted = true;

    void QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      color: {
        dark: "#0f172a",
        light: "#00000000",
      },
    })
      .then((nextSrc: string) => {
        if (isMounted) {
          setSrc(nextSrc);
        }
      })
      .catch(() => {
        if (isMounted) {
          setSrc("");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [size, value]);

  if (!src) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-500 ${className}`.trim()}
        style={{ width: size, height: size }}
      >
        QR preview
      </div>
    );
  }

  return (
    <img
      src={src}
      alt="Product QR code"
      className={`rounded-2xl border border-slate-200 bg-white object-contain p-2 ${className}`.trim()}
      style={{ width: size, height: size }}
    />
  );
}

function ProductImagePreview({
  image,
  alt,
  className = "",
}: {
  image: File | string | null;
  alt: string;
  className?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!image) {
      setSrc(null);
      return;
    }

    if (typeof image === "string") {
      setSrc(resolveApiAssetUrl(image));
      return;
    }

    const objectUrl = URL.createObjectURL(image);
    setSrc(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [image]);

  if (!src) {
    return (
      <div
        className={`flex items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500 ${className}`.trim()}
      >
        No image
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`rounded-3xl object-cover ${className}`.trim()}
    />
  );
}

function createEmptyUnitForm(): UnitPayload {
  return { name: "", symbol: "", description: "" };
}

function buildUnitForm(record: UnitRecord | null): UnitPayload {
  if (!record) {
    return createEmptyUnitForm();
  }

  return {
    name: record.name,
    symbol: record.symbol,
    description: record.description,
  };
}

function createEmptyCategoryForm(): CategoryPayload {
  return {
    name: "",
    parent: null,
    description: "",
  };
}

function buildCategoryForm(record: CategoryRecord | null): CategoryPayload {
  if (!record) {
    return createEmptyCategoryForm();
  }

  return {
    name: record.name,
    parent: record.parent,
    description: record.description,
  };
}

function createEmptySupplierForm(): SupplierPayload {
  return {
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    payment_terms: "",
    lead_days: 0,
    is_active: true,
  };
}

function buildSupplierForm(record: SupplierRecord | null): SupplierPayload {
  if (!record) {
    return createEmptySupplierForm();
  }

  return {
    name: record.name,
    contact_person: record.contact_person,
    email: record.email,
    phone: record.phone,
    address: record.address,
    payment_terms: record.payment_terms,
    lead_days: record.lead_days,
    is_active: record.is_active,
  };
}

function createEmptyLocationForm(): StorageLocationPayload {
  return {
    name: "",
    location: "",
    manager: null,
    description: "",
    is_active: true,
  };
}

function buildLocationForm(
  record: StorageLocationRecord | null,
): StorageLocationPayload {
  if (!record) {
    return createEmptyLocationForm();
  }

  return {
    name: record.name,
    location: record.location,
    manager: record.manager,
    description: record.description,
    is_active: record.is_active,
  };
}

function createEmptyRawMaterialForm(): RawMaterialPayload {
  return {
    name: "",
    description: "",
    unit: 0,
    supplier: null,
    reorder_level: "0.00",
    notes: "",
    is_active: true,
  };
}

function buildRawMaterialForm(
  record: RawMaterialRecord | null,
): RawMaterialPayload {
  if (!record) {
    return createEmptyRawMaterialForm();
  }

  return {
    name: record.name,
    description: record.description,
    unit: record.unit,
    supplier: record.supplier,
    reorder_level: record.reorder_level,
    notes: record.notes,
    is_active: record.is_active,
  };
}

function createEmptyFinishedProductForm(): FinishedProductPayload {
  return {
    name: "",
    description: "",
    category: null,
    supplier: null,
    unit: 0,
    unit_price: "0.00",
    cost_price: "0.00",
    reorder_level: "0.00",
    reorder_quantity: "0.00",
    location: null,
    image: null,
    clear_image: false,
    is_active: true,
  };
}

function buildFinishedProductForm(
  record: FinishedProductRecord | null,
): FinishedProductPayload {
  if (!record) {
    return createEmptyFinishedProductForm();
  }

  return {
    name: record.name,
    description: record.description,
    category: record.category,
    supplier: record.supplier,
    unit: record.unit,
    unit_price: record.unit_price,
    cost_price: record.cost_price,
    reorder_level: record.reorder_level,
    reorder_quantity: record.reorder_quantity,
    location: record.location,
    image: record.image,
    clear_image: false,
    is_active: record.is_active,
  };
}

function createEmptyStockItemForm(): StockItemFormState {
  return {
    item_kind: "raw_material",
    raw_material: "",
    finished_product: "",
    location: "",
    opening_stock: "0.00",
    bin_location: "",
  };
}

function buildStockItemForm(
  record: StockItemRecord | null,
): StockItemFormState {
  if (!record) {
    return createEmptyStockItemForm();
  }

  return {
    item_kind: record.item_type,
    raw_material: record.raw_material ? String(record.raw_material) : "",
    finished_product: record.finished_product
      ? String(record.finished_product)
      : "",
    location: String(record.location),
    opening_stock: "0.00",
    bin_location: record.bin_location,
  };
}

function createEmptyMovementForm(): StockMovementFormState {
  return {
    stock_item: "",
    movement_type: "stock_in",
    quantity: "",
    notes: "",
    movement_date: formatDateTimeInput(new Date().toISOString()),
  };
}

function buildMovementForm(
  record: StockMovementRecord | null,
): StockMovementFormState {
  if (!record) {
    return createEmptyMovementForm();
  }

  return {
    stock_item: String(record.stock_item),
    movement_type: record.movement_type,
    quantity: record.quantity,
    notes: record.notes,
    movement_date: formatDateTimeInput(record.movement_date),
  };
}

function PickerField({
  value,
  options,
  onChange,
  searchable = false,
  searchPlaceholder = "Search options",
}: {
  value: string;
  options: Array<{ label: string; value: string; searchText?: string }>;
  onChange: (value: string) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedLabel =
    options.find((option) => option.value === value)?.label ??
    options[0]?.label ??
    "Select";
  const normalizedSearchValue = searchValue.trim().toLowerCase();
  const filteredOptions = searchable
    ? options.filter((option) =>
        (option.searchText ?? option.label)
          .toLowerCase()
          .includes(normalizedSearchValue),
      )
    : options;

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setSearchValue("");
    }
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown
          className={[
            "h-4 w-4 shrink-0 text-slate-400 transition",
            isOpen ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {isOpen ? (
        <div className="absolute left-0 top-full z-20 mt-2 w-full rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_24px_60px_rgba(15,23,42,0.14)]">
          {searchable ? (
            <div className="border-b border-slate-200 px-1 pb-2">
              <input
                type="text"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300"
              />
            </div>
          ) : null}
          <div className="scrollbar-hidden mt-2 max-h-[280px] space-y-1 overflow-y-auto pr-1">
            {filteredOptions.length ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={[
                    "flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm transition",
                    value === option.value
                      ? "bg-sky-50 text-sky-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  ].join(" ")}
                >
                  <span>{option.label}</span>
                  {value === option.value ? (
                    <Check className="h-4 w-4" />
                  ) : null}
                </button>
              ))
            ) : (
              <div className="rounded-2xl px-3 py-4 text-sm text-slate-500">
                No matches found.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FieldMessage({
  message,
  tone,
}: {
  message: string;
  tone: "success" | "error";
}) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={[
        "rounded-2xl border px-4 py-3 text-sm",
        tone === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-red-200 bg-red-50 text-red-700",
      ].join(" ")}
    >
      {message}
    </div>
  );
}

function FormPanel({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="panel p-6">
      <p className="section-label">{label}</p>
      <h2 className="mt-2 text-2xl font-semibold text-slate-900">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function EmptyState({
  title,
  description,
  className = "",
}: {
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50/70 px-5 py-6 ${className}`.trim()}
    >
      <p className="text-lg font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function ModalShell({
  title,
  onClose,
  children,
  panelClassName = "",
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  panelClassName?: string;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/32 px-4 py-6 backdrop-blur-sm">
      <div
        className={`panel scrollbar-hidden flex max-h-[90vh] w-full max-w-3xl flex-col overflow-y-auto p-6 ${panelClassName}`.trim()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            Close
          </button>
        </div>
        <div className="mt-8 flex-1">{children}</div>
      </div>
    </div>
  );
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function formatDateTimeInput(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const offset = parsed.getTimezoneOffset();
  const localDate = new Date(parsed.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function humanizeMovementType(value: StockMovementType) {
  switch (value) {
    case "stock_in":
      return "Stock in";
    case "stock_out":
      return "Stock out";
    case "adjustment_positive":
      return "Positive adjustment";
    case "adjustment_negative":
      return "Negative adjustment";
    default:
      return value;
  }
}

function formatQuantity(value: string, unitName?: string) {
  return unitName ? `${value} ${unitName}` : value;
}

function formatCurrency(value: string) {
  const numericValue = Number.parseFloat(value);
  if (!Number.isFinite(numericValue)) {
    return "UGX 0";
  }

  return `UGX ${new Intl.NumberFormat("en-UG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericValue)}`;
}

function parseProductRouteId(value: string | undefined) {
  if (!value) {
    return null;
  }

  const numericValue = Number(value);
  return Number.isInteger(numericValue) && numericValue > 0
    ? numericValue
    : null;
}

function resolveProductQrValue(record: FinishedProductRecord) {
  if (typeof window !== "undefined") {
    return new URL(record.detail_path, window.location.origin).toString();
  }

  return record.qr_code_value || record.detail_url || record.detail_path;
}

async function normalizeProductImage(file: File) {
  if (typeof window === "undefined") {
    return file;
  }

  const imageUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Unable to load selected image."));
      img.src = imageUrl;
    });

    const squareSize = 1200;
    const sourceSize = Math.min(image.width, image.height);
    const sourceX = Math.max(0, (image.width - sourceSize) / 2);
    const sourceY = Math.max(0, (image.height - sourceSize) / 2);

    const canvas = document.createElement("canvas");
    canvas.width = squareSize;
    canvas.height = squareSize;

    const context = canvas.getContext("2d");
    if (!context) {
      return file;
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, squareSize, squareSize);
    context.drawImage(
      image,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      squareSize,
      squareSize,
    );

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.92);
    });

    if (!blob) {
      return file;
    }

    const normalizedName = file.name.replace(/\.[^.]+$/, "") || "product-image";
    return new File([blob], `${normalizedName}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

export function InventoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { productId: productIdParam } = useParams();
  const isAdmin =
    user?.role.code === "admin" || user?.role.code === "superuser";
  const routedProductId = parseProductRouteId(productIdParam);

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [activeTab, setActiveTab] = useState("units");

  const tabs = inventoryMilestoneFlow.map(({ id, label }) => ({ id, label }));
  const activeFlowItem =
    inventoryMilestoneFlow.find((item) => item.id === activeTab) ??
    inventoryMilestoneFlow[0];
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [units, setUnits] = useState<UnitRecord[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [locations, setLocations] = useState<StorageLocationRecord[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterialRecord[]>([]);
  const [finishedProducts, setFinishedProducts] = useState<
    FinishedProductRecord[]
  >([]);
  const [stockItems, setStockItems] = useState<StockItemRecord[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovementRecord[]>(
    [],
  );
  const [stockAlerts, setStockAlerts] = useState<StockAlertRecord[]>([]);

  const [unitForm, setUnitForm] = useState<UnitPayload>(createEmptyUnitForm());
  const [categoryForm, setCategoryForm] = useState<CategoryPayload>(
    createEmptyCategoryForm(),
  );
  const [supplierForm, setSupplierForm] = useState<SupplierPayload>(
    createEmptySupplierForm(),
  );
  const [locationForm, setLocationForm] = useState<StorageLocationPayload>(
    createEmptyLocationForm(),
  );
  const [rawMaterialForm, setRawMaterialForm] = useState<RawMaterialPayload>(
    createEmptyRawMaterialForm(),
  );
  const [finishedProductForm, setFinishedProductForm] =
    useState<FinishedProductPayload>(createEmptyFinishedProductForm());
  const [stockItemForm, setStockItemForm] = useState<StockItemFormState>(
    createEmptyStockItemForm(),
  );
  const [movementForm, setMovementForm] = useState<StockMovementFormState>(
    createEmptyMovementForm(),
  );

  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(
    null,
  );
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(
    null,
  );
  const [selectedRawMaterialId, setSelectedRawMaterialId] = useState<
    number | null
  >(null);
  const [selectedFinishedProductId, setSelectedFinishedProductId] = useState<
    number | null
  >(null);
  const [selectedStockItemId, setSelectedStockItemId] = useState<number | null>(
    null,
  );
  const [selectedMovementId, setSelectedMovementId] = useState<number | null>(
    null,
  );

  const [unitError, setUnitError] = useState("");
  const [isUnitPending, setIsUnitPending] = useState(false);

  const [categoryError, setCategoryError] = useState("");
  const [isCategoryPending, setIsCategoryPending] = useState(false);

  const [supplierError, setSupplierError] = useState("");
  const [isSupplierPending, setIsSupplierPending] = useState(false);

  const [locationError, setLocationError] = useState("");
  const [isLocationPending, setIsLocationPending] = useState(false);

  const [rawMaterialError, setRawMaterialError] = useState("");
  const [isRawMaterialPending, setIsRawMaterialPending] = useState(false);

  const [finishedProductError, setFinishedProductError] = useState("");
  const [isFinishedProductPending, setIsFinishedProductPending] =
    useState(false);

  const [stockItemError, setStockItemError] = useState("");
  const [isStockItemPending, setIsStockItemPending] = useState(false);

  const [movementError, setMovementError] = useState("");
  const [isMovementPending, setIsMovementPending] = useState(false);
  const editingFinishedProductRecord =
    selectedFinishedProductId === null
      ? null
      : finishedProducts.find((record) => record.id === selectedFinishedProductId) ??
        null;
  const [isQrExpanded, setIsQrExpanded] = useState(false);
  const [isRemoveImageConfirming, setIsRemoveImageConfirming] = useState(false);

  const locationNameById = new Map(
    locations.map((record) => [record.id, record.name]),
  );
  const buildSupplierOptions = () =>
    suppliers.map((record) => ({
      label: record.name,
      value: String(record.id),
      searchText: [
        record.name,
        record.contact_person,
        record.email,
        record.phone,
      ]
        .filter(Boolean)
        .join(" "),
    }));
  const buildCategoryOptions = () =>
    categories.map((record) => ({
      label: record.name,
      value: String(record.id),
      searchText: [record.name, record.parent_name, record.description]
        .filter(Boolean)
        .join(" "),
    }));
  const buildLocationOptions = () =>
    locations.map((record) => ({
      label: record.name,
      value: String(record.id),
      searchText: [record.name, record.location, record.manager_name, record.description]
        .filter(Boolean)
        .join(" "),
    }));
  const buildRawMaterialOptions = () =>
    rawMaterials.map((record) => ({
      label: record.name,
      value: String(record.id),
      searchText: [
        record.name,
        record.supplier_name,
        record.unit_name,
        record.description,
      ]
        .filter(Boolean)
        .join(" "),
    }));
  const buildFinishedProductOptions = () =>
    finishedProducts.map((record) => ({
      label: record.name,
      value: String(record.id),
      searchText: [
        record.name,
        record.barcode,
        record.category_name,
        record.supplier_name,
        record.unit_name,
        record.description,
      ]
        .filter(Boolean)
        .join(" "),
    }));
  const buildStockItemOptions = () =>
    stockItems.map((record) => ({
      label: `${record.item_name} - ${
        locationNameById.get(record.location) ?? `#${record.location}`
      }`,
      value: String(record.id),
      searchText: [
        record.item_name,
        locationNameById.get(record.location),
        record.item_type,
        record.unit_name,
      ]
        .filter(Boolean)
        .join(" "),
    }));

  async function reloadInventoryData() {
    const [
      nextUnits,
      nextCategories,
      nextSuppliers,
      nextLocations,
      nextRawMaterials,
      nextFinishedProducts,
      nextStockItems,
      nextStockMovements,
      nextStockAlerts,
    ] = await Promise.all([
      fetchUnits(),
      fetchCategories(),
      fetchSuppliers(),
      fetchWarehouses(),
      fetchRawMaterials(),
      fetchProducts(),
      fetchWarehouseStock(),
      fetchStockMovements(),
      fetchStockAlerts(),
    ]);

    setUnits(nextUnits);
    setCategories(nextCategories);
    setSuppliers(nextSuppliers);
    setLocations(nextLocations);
    setRawMaterials(nextRawMaterials);
    setFinishedProducts(nextFinishedProducts);
    setStockItems(nextStockItems);
    setStockMovements(nextStockMovements);
    setStockAlerts(nextStockAlerts);
  }

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      setPageError("");

      try {
        await reloadInventoryData();
      } catch (error) {
        if (isMounted) {
          setPageError(
            error instanceof ApiError
              ? error.message
              : "Unable to load inventory data right now.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (routedProductId !== null) {
      setActiveTab("products");
    }
  }, [routedProductId]);

  useEffect(() => {
    if (routedProductId === null) {
      return;
    }

    const matchedProduct = finishedProducts.find(
      (record) => record.id === routedProductId,
    );

    if (!matchedProduct) {
      return;
    }

    setSelectedFinishedProductId(matchedProduct.id);
    setFinishedProductForm(buildFinishedProductForm(matchedProduct));
    setActiveModal("finishedProduct");
  }, [routedProductId, finishedProducts]);

  useEffect(() => {
    if (!selectedUnitId) {
      return;
    }

    let isMounted = true;

    const load = async () => {
      try {
        const record = await fetchUnit(selectedUnitId);
        if (isMounted) {
          setUnitForm(buildUnitForm(record));
        }
      } catch {
        if (isMounted) {
          setUnitForm(
            buildUnitForm(
              units.find((item) => item.id === selectedUnitId) ?? null,
            ),
          );
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [selectedUnitId, units]);

  useEffect(() => {
    if (!selectedCategoryId) {
      return;
    }

    let isMounted = true;

    const load = async () => {
      try {
        const record = await fetchCategory(selectedCategoryId);
        if (isMounted) {
          setCategoryForm(buildCategoryForm(record));
        }
      } catch {
        if (isMounted) {
          setCategoryForm(
            buildCategoryForm(
              categories.find((item) => item.id === selectedCategoryId) ??
                null,
            ),
          );
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [categories, selectedCategoryId]);

  useEffect(() => {
    if (!selectedSupplierId) {
      return;
    }

    let isMounted = true;

    const load = async () => {
      try {
        const record = await fetchSupplier(selectedSupplierId);
        if (isMounted) {
          setSupplierForm(buildSupplierForm(record));
        }
      } catch {
        if (isMounted) {
          setSupplierForm(
            buildSupplierForm(
              suppliers.find((item) => item.id === selectedSupplierId) ?? null,
            ),
          );
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [selectedSupplierId, suppliers]);

  useEffect(() => {
    if (!selectedLocationId) {
      return;
    }

    let isMounted = true;

    const load = async () => {
      try {
        const record = await fetchWarehouse(selectedLocationId);
        if (isMounted) {
          setLocationForm(buildLocationForm(record));
        }
      } catch {
        if (isMounted) {
          setLocationForm(
            buildLocationForm(
              locations.find((item) => item.id === selectedLocationId) ?? null,
            ),
          );
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [selectedLocationId, locations]);

  useEffect(() => {
    if (!selectedRawMaterialId) {
      return;
    }

    let isMounted = true;

    const load = async () => {
      try {
        const record = await fetchRawMaterial(selectedRawMaterialId);
        if (isMounted) {
          setRawMaterialForm(buildRawMaterialForm(record));
        }
      } catch {
        if (isMounted) {
          setRawMaterialForm(
            buildRawMaterialForm(
              rawMaterials.find((item) => item.id === selectedRawMaterialId) ??
                null,
            ),
          );
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [selectedRawMaterialId, rawMaterials]);

  useEffect(() => {
    if (!selectedFinishedProductId) {
      return;
    }

    let isMounted = true;

    const load = async () => {
      try {
        const record = await fetchProduct(selectedFinishedProductId);
        if (isMounted) {
          setFinishedProductForm(buildFinishedProductForm(record));
        }
      } catch {
        if (isMounted) {
          setFinishedProductForm(
            buildFinishedProductForm(
              finishedProducts.find(
                (item) => item.id === selectedFinishedProductId,
              ) ?? null,
            ),
          );
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [selectedFinishedProductId, finishedProducts]);

  useEffect(() => {
    if (!selectedStockItemId) {
      return;
    }

    let isMounted = true;

    const load = async () => {
      try {
        const record = await fetchWarehouseStockItem(selectedStockItemId);
        if (isMounted) {
          setStockItemForm(buildStockItemForm(record));
        }
      } catch {
        if (isMounted) {
          setStockItemForm(
            buildStockItemForm(
              stockItems.find((item) => item.id === selectedStockItemId) ??
                null,
            ),
          );
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [selectedStockItemId, stockItems]);

  useEffect(() => {
    if (!selectedMovementId) {
      return;
    }

    let isMounted = true;

    const load = async () => {
      try {
        const record = await fetchStockMovement(selectedMovementId);
        if (isMounted) {
          setMovementForm(buildMovementForm(record));
        }
      } catch {
        if (isMounted) {
          setMovementForm(
            buildMovementForm(
              stockMovements.find((item) => item.id === selectedMovementId) ??
                null,
            ),
          );
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [selectedMovementId, stockMovements]);

  const resetUnitState = () => {
    setSelectedUnitId(null);
    setUnitForm(createEmptyUnitForm());
    setUnitError("");
  };

  const resetCategoryState = () => {
    setSelectedCategoryId(null);
    setCategoryForm(createEmptyCategoryForm());
    setCategoryError("");
  };

  const resetSupplierState = () => {
    setSelectedSupplierId(null);
    setSupplierForm(createEmptySupplierForm());
    setSupplierError("");
  };

  const resetLocationState = () => {
    setSelectedLocationId(null);
    setLocationForm(createEmptyLocationForm());
    setLocationError("");
  };

  const resetRawMaterialState = () => {
    setSelectedRawMaterialId(null);
    setRawMaterialForm(createEmptyRawMaterialForm());
    setRawMaterialError("");
  };

  const resetFinishedProductState = () => {
    setSelectedFinishedProductId(null);
    setFinishedProductForm(createEmptyFinishedProductForm());
    setFinishedProductError("");
    setIsQrExpanded(false);
    setIsRemoveImageConfirming(false);
  };

  const resetStockItemState = () => {
    setSelectedStockItemId(null);
    setStockItemForm(createEmptyStockItemForm());
    setStockItemError("");
  };

  const resetMovementState = () => {
    setSelectedMovementId(null);
    setMovementForm(createEmptyMovementForm());
    setMovementError("");
  };

  const closeModal = () => {
    const shouldReturnToInventory = routedProductId !== null;
    resetUnitState();
    resetCategoryState();
    resetSupplierState();
    resetLocationState();
    resetRawMaterialState();
    resetFinishedProductState();
    resetStockItemState();
    resetMovementState();
    setActiveModal(null);
    if (shouldReturnToInventory) {
      navigate("/inventory");
    }
  };

  const handleUnitSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUnitError("");
    setIsUnitPending(true);

    try {
      const payload: UnitPayload = {
        name: unitForm.name.trim(),
        symbol: unitForm.symbol.trim(),
        description: unitForm.description.trim(),
      };

      if (selectedUnitId) {
        await updateUnit(selectedUnitId, payload);
      } else {
        await createUnit(payload);
      }

      await reloadInventoryData();
      closeModal();
    } catch (error) {
      setUnitError(
        error instanceof ApiError
          ? error.message
          : "Unable to save the unit right now.",
      );
    } finally {
      setIsUnitPending(false);
    }
  };

  const handleUnitDelete = async () => {
    if (!selectedUnitId) {
      return;
    }

    setUnitError("");
    setIsUnitPending(true);

    try {
      await deleteUnit(selectedUnitId);
      await reloadInventoryData();
      closeModal();
    } catch (error) {
      setUnitError(
        error instanceof ApiError
          ? error.message
          : "Unable to delete the unit right now.",
      );
    } finally {
      setIsUnitPending(false);
    }
  };

  const handleCategorySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCategoryError("");
    setIsCategoryPending(true);

    try {
      const payload: CategoryPayload = {
        name: categoryForm.name.trim(),
        parent: categoryForm.parent,
        description: categoryForm.description.trim(),
      };

      if (selectedCategoryId) {
        await updateCategory(selectedCategoryId, payload);
      } else {
        await createCategory(payload);
      }

      await reloadInventoryData();
      closeModal();
    } catch (error) {
      setCategoryError(
        error instanceof ApiError
          ? error.message
          : "Unable to save the category right now.",
      );
    } finally {
      setIsCategoryPending(false);
    }
  };

  const handleCategoryDelete = async () => {
    if (!selectedCategoryId) {
      return;
    }

    setCategoryError("");
    setIsCategoryPending(true);

    try {
      await deleteCategory(selectedCategoryId);
      await reloadInventoryData();
      closeModal();
    } catch (error) {
      setCategoryError(
        error instanceof ApiError
          ? error.message
          : "Unable to delete the category right now.",
      );
    } finally {
      setIsCategoryPending(false);
    }
  };

  const handleSupplierSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSupplierError("");
    setIsSupplierPending(true);

    try {
      const payload: SupplierPayload = {
        name: supplierForm.name.trim(),
        contact_person: supplierForm.contact_person.trim(),
        email: supplierForm.email.trim(),
        phone: supplierForm.phone.trim(),
        address: supplierForm.address.trim(),
        payment_terms: supplierForm.payment_terms.trim(),
        lead_days: supplierForm.lead_days,
        is_active: supplierForm.is_active,
      };

      if (selectedSupplierId) {
        await updateSupplier(selectedSupplierId, payload);
      } else {
        await createSupplier(payload);
      }

      await reloadInventoryData();
      closeModal();
    } catch (error) {
      setSupplierError(
        error instanceof ApiError
          ? error.message
          : "Unable to save the supplier right now.",
      );
    } finally {
      setIsSupplierPending(false);
    }
  };

  const handleSupplierDelete = async () => {
    if (!selectedSupplierId) {
      return;
    }

    setSupplierError("");
    setIsSupplierPending(true);

    try {
      await deleteSupplier(selectedSupplierId);
      await reloadInventoryData();
      closeModal();
    } catch (error) {
      setSupplierError(
        error instanceof ApiError
          ? error.message
          : "Unable to delete the supplier right now.",
      );
    } finally {
      setIsSupplierPending(false);
    }
  };

  const handleLocationSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocationError("");
    setIsLocationPending(true);

    try {
      const payload: StorageLocationPayload = {
        name: locationForm.name.trim(),
        location: locationForm.location.trim(),
        manager: locationForm.manager,
        description: locationForm.description.trim(),
        is_active: locationForm.is_active,
      };

      if (selectedLocationId) {
        await updateWarehouse(selectedLocationId, payload);
      } else {
        await createWarehouse(payload);
      }

      await reloadInventoryData();
      closeModal();
    } catch (error) {
      setLocationError(
        error instanceof ApiError
          ? error.message
          : "Unable to save the location right now.",
      );
    } finally {
      setIsLocationPending(false);
    }
  };

  const handleLocationDelete = async () => {
    if (!selectedLocationId) {
      return;
    }

    setLocationError("");
    setIsLocationPending(true);

    try {
      await deleteWarehouse(selectedLocationId);

      await reloadInventoryData();
      closeModal();
    } catch (error) {
      setLocationError(
        error instanceof ApiError
          ? error.message
          : "Unable to delete the warehouse right now.",
      );
    } finally {
      setIsLocationPending(false);
    }
  };

  const handleRawMaterialSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRawMaterialError("");
    setIsRawMaterialPending(true);

    try {
      const payload: RawMaterialPayload = {
        name: rawMaterialForm.name.trim(),
        description: rawMaterialForm.description.trim(),
        unit: rawMaterialForm.unit,
        supplier: rawMaterialForm.supplier,
        reorder_level: rawMaterialForm.reorder_level,
        notes: rawMaterialForm.notes.trim(),
        is_active: rawMaterialForm.is_active,
      };

      if (selectedRawMaterialId) {
        await updateRawMaterial(selectedRawMaterialId, payload);
      } else {
        await createRawMaterial(payload);
      }

      await reloadInventoryData();
      closeModal();
    } catch (error) {
      setRawMaterialError(
        error instanceof ApiError
          ? error.message
          : "Unable to save the raw material right now.",
      );
    } finally {
      setIsRawMaterialPending(false);
    }
  };

  const handleRawMaterialDelete = async () => {
    if (!selectedRawMaterialId) {
      return;
    }

    setRawMaterialError("");
    setIsRawMaterialPending(true);

    try {
      await deleteRawMaterial(selectedRawMaterialId);
      await reloadInventoryData();
      closeModal();
    } catch (error) {
      setRawMaterialError(
        error instanceof ApiError
          ? error.message
          : "Unable to delete the raw material right now.",
      );
    } finally {
      setIsRawMaterialPending(false);
    }
  };

  const handleFinishedProductSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setFinishedProductError("");
    setIsFinishedProductPending(true);

    try {
      const payload: FinishedProductPayload = {
        name: finishedProductForm.name.trim(),
        description: finishedProductForm.description.trim(),
        category: finishedProductForm.category,
        supplier: finishedProductForm.supplier,
        unit: finishedProductForm.unit,
        unit_price: finishedProductForm.unit_price,
        cost_price: finishedProductForm.cost_price,
        reorder_level: finishedProductForm.reorder_level,
        reorder_quantity: finishedProductForm.reorder_quantity,
        location: finishedProductForm.location,
        image: finishedProductForm.image,
        clear_image: finishedProductForm.clear_image,
        is_active: finishedProductForm.is_active,
      };

      if (selectedFinishedProductId) {
        await updateProduct(selectedFinishedProductId, payload);
      } else {
        await createProduct(payload);
      }

      await reloadInventoryData();
      closeModal();
    } catch (error) {
      setFinishedProductError(
        error instanceof ApiError
          ? error.message
          : "Unable to save the product right now.",
      );
    } finally {
      setIsFinishedProductPending(false);
    }
  };

  const handleFinishedProductDelete = async () => {
    if (!selectedFinishedProductId) {
      return;
    }

    setFinishedProductError("");
    setIsFinishedProductPending(true);

    try {
      await deleteProduct(selectedFinishedProductId);
      await reloadInventoryData();
      closeModal();
    } catch (error) {
      setFinishedProductError(
        error instanceof ApiError
          ? error.message
          : "Unable to delete the product right now.",
      );
    } finally {
      setIsFinishedProductPending(false);
    }
  };

  const handleStockItemSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStockItemError("");
    setIsStockItemPending(true);

    try {
      const payload: StockItemPayload = {
        location: Number(stockItemForm.location),
        bin_location: stockItemForm.bin_location.trim(),
      };

      if (stockItemForm.item_kind === "raw_material") {
        payload.raw_material = stockItemForm.raw_material
          ? Number(stockItemForm.raw_material)
          : null;
        payload.finished_product = null;
      } else {
        payload.finished_product = stockItemForm.finished_product
          ? Number(stockItemForm.finished_product)
          : null;
        payload.raw_material = null;
      }

      if (!selectedStockItemId) {
        payload.opening_stock = stockItemForm.opening_stock.trim() || "0.00";
      }

      if (selectedStockItemId) {
        await updateWarehouseStock(selectedStockItemId, payload);
      } else {
        await createWarehouseStock(payload);
      }

      await reloadInventoryData();
      closeModal();
    } catch (error) {
      setStockItemError(
        error instanceof ApiError
          ? error.message
          : "Unable to save the warehouse stock right now.",
      );
    } finally {
      setIsStockItemPending(false);
    }
  };

  const handleStockItemDelete = async () => {
    if (!selectedStockItemId) {
      return;
    }

    setStockItemError("");
    setIsStockItemPending(true);

    try {
      await deleteWarehouseStock(selectedStockItemId);
      await reloadInventoryData();
      closeModal();
    } catch (error) {
      setStockItemError(
        error instanceof ApiError
          ? error.message
          : "Unable to delete the warehouse stock right now.",
      );
    } finally {
      setIsStockItemPending(false);
    }
  };

  const handleMovementSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMovementError("");
    setIsMovementPending(true);

    try {
      const payload: StockMovementPayload = {
        stock_item: Number(movementForm.stock_item),
        movement_type: movementForm.movement_type,
        quantity: movementForm.quantity.trim(),
        notes: movementForm.notes.trim(),
        movement_date: movementForm.movement_date,
      };

      if (selectedMovementId) {
        await updateStockMovement(selectedMovementId, payload);
      } else {
        await createStockMovement(payload);
      }

      await reloadInventoryData();
      closeModal();
    } catch (error) {
      setMovementError(
        error instanceof ApiError
          ? error.message
          : "Unable to save the stock movement right now.",
      );
    } finally {
      setIsMovementPending(false);
    }
  };

  const handleMovementDelete = async () => {
    if (!selectedMovementId) {
      return;
    }

    setMovementError("");
    setIsMovementPending(true);

    try {
      await deleteStockMovement(selectedMovementId);
      await reloadInventoryData();
      closeModal();
    } catch (error) {
      setMovementError(
        error instanceof ApiError
          ? error.message
          : "Unable to delete the stock movement right now.",
      );
    } finally {
      setIsMovementPending(false);
    }
  };

  const handleAlertAcknowledge = async (id: number) => {
    try {
      await acknowledgeStockAlert(id);
      await reloadInventoryData();
    } catch (error) {
      setPageError(
        error instanceof ApiError
          ? error.message
          : "Unable to acknowledge the stock alert right now.",
      );
    }
  };

  if (isLoading) {
    return (
      <section className="panel flex min-h-[320px] items-center justify-center p-8">
        <div className="flex items-center gap-3 text-slate-600">
          <LoaderCircle className="h-5 w-5 animate-spin text-sky-700" />
          <span>Loading inventory workspace...</span>
        </div>
      </section>
    );
  }

  if (pageError) {
    return (
      <section className="panel max-w-3xl p-8">
        <p className="section-label">Inventory</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">
          Inventory workspace
        </h1>
        <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {pageError}
        </div>
      </section>
    );
  }

  return (
    <div className="module-page">
      <section className="rounded-[32px] border border-white/70 bg-[radial-gradient(circle_at_top_left,#ffffff,rgba(224,242,254,0.92)_52%,rgba(240,249,255,0.95))] py-6 pl-6 pr-0 shadow-[0_25px_80px_rgba(148,163,184,0.14)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">
              Inventory
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Inventory control workspace
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-600">
                Manage products, suppliers, warehouses, stock levels, and
                stock movements in one place.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="hero-metric-card">
              <p className="hero-metric-label">Products</p>
              <p className="hero-metric-value">{finishedProducts.length}</p>
            </div>
            <div className="hero-metric-card">
              <p className="hero-metric-label">Stock alerts</p>
              <p className="hero-metric-value">{stockAlerts.length}</p>
            </div>
            <div className="hero-metric-card">
              <p className="hero-metric-label">Suppliers</p>
              <p className="hero-metric-value">
                {suppliers.filter((item) => item.is_active).length}
              </p>
            </div>
            <div className="hero-metric-card">
              <p className="hero-metric-label">Warehouses</p>
              <p className="hero-metric-value">
                {locations.filter((item) => item.is_active).length}
              </p>
            </div>
          </div>
        </div>
      </section>
      <ModuleTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="module-page-stage !justify-start overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col gap-6">
          <div className="space-y-6">
            {activeTab === "alerts" ? (
              <section className="panel p-6">
                <div>
                  <p className="section-label">Stock Alerts</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                    Attention needed
                  </h2>
                </div>

                <div className="scrollbar-hidden mt-5 flex gap-3 overflow-x-auto pb-2">
                  {stockAlerts.length === 0 ? (
                    <EmptyState
                      title="No stock alerts"
                      description="All tracked inventory is above its alert thresholds right now."
                      className={`${recordCardClassName} justify-center`}
                    />
                  ) : (
                    stockAlerts.map((record) => (
                      <div key={record.id} className={recordCardClassName}>
                        <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto pr-2">
                          <p className="font-semibold text-slate-900">
                            {record.item_name}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {record.item_type === "raw_material"
                              ? "Raw material"
                              : "Product"}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            Warehouse: {record.warehouse_name}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            In stock:{" "}
                            {record.quantity}
                          </p>
                          <p className="mt-2 text-sm font-medium text-amber-700">
                            Alert type:{" "}
                            {record.alert_type === "out_of_stock"
                              ? "Out of stock"
                              : record.alert_type === "low"
                                ? "Low stock"
                                : "Expiry"}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            Triggered: {formatDateTime(record.triggered_at)}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            {record.is_acknowledged
                              ? "Acknowledged"
                              : "Waiting for acknowledgement"}
                          </p>
                        </div>
                        {!record.is_acknowledged && isAdmin ? (
                          <button
                            type="button"
                            onClick={() => void handleAlertAcknowledge(record.id)}
                            className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
                          >
                            Acknowledge
                          </button>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </section>
            ) : null}

            {activeTab === "stock" ? (
              <section className="panel p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="section-label">Warehouse Stock</p>
                    <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                      Current balances
                    </h2>
                  </div>
                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() => {
                        resetStockItemState();
                        setActiveModal("stockItem");
                      }}
                      className={iconButtonClassName}
                      aria-label="Add warehouse stock"
                      title="Add warehouse stock"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                <div className="scrollbar-hidden mt-5 flex gap-3 overflow-x-auto pb-2">
                  {stockItems.length === 0 ? (
                    <EmptyState
                      title="No warehouse stock yet"
                      description="Create warehouse stock records to start tracking balances by warehouse."
                      className={`${recordCardClassName} justify-center`}
                    />
                  ) : (
                    stockItems.map((record) => (
                      <div key={record.id} className={recordCardClassName}>
                        <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto pr-14">
                          <p className="font-semibold text-slate-900">
                            {record.item_name}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {record.item_type === "raw_material"
                              ? "Raw material"
                              : "Product"}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            Warehouse:{" "}
                            {record.warehouse_name ||
                              locationNameById.get(record.location) ||
                              `#${record.location}`}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            Quantity:{" "}
                            {formatQuantity(record.quantity, record.unit_name)}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            Bin: {record.bin_location || "Not set"}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            Reorder:{" "}
                            {formatQuantity(
                              record.reorder_level,
                              record.unit_name,
                            )}
                          </p>
                          <p
                            className={[
                              "mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                              record.is_below_reorder
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700",
                            ].join(" ")}
                          >
                            {record.is_below_reorder
                              ? "Below reorder"
                              : "Healthy"}
                          </p>
                        </div>
                        {isAdmin ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStockItemId(record.id);
                              setStockItemForm(buildStockItemForm(record));
                              setActiveModal("stockItem");
                            }}
                            className={recordEditButtonClassName}
                            aria-label={`Edit ${record.item_name}`}
                            title={`Edit ${record.item_name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </section>
            ) : null}
          </div>

          <div className="space-y-6">
            {activeTab === "raw" ? (
              <section className="panel p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="section-label">Raw Materials</p>
                    <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                      Input materials
                    </h2>
                  </div>
                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() => {
                        resetRawMaterialState();
                        setActiveModal("rawMaterial");
                      }}
                      className={iconButtonClassName}
                      aria-label="Add raw material"
                      title="Add raw material"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                <div className="scrollbar-hidden mt-5 flex gap-3 overflow-x-auto pb-2">
                  {rawMaterials.length === 0 ? (
                    <EmptyState
                      title="No raw materials yet"
                      description="Track water, packaging, and other supply inputs here."
                      className={`${recordCardClassName} justify-center`}
                    />
                  ) : (
                    rawMaterials.map((record) => (
                      <div key={record.id} className={recordCardClassName}>
                        <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto pr-14">
                          <p className="font-semibold text-slate-900">
                            {record.name}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            Unit: {record.unit_name}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            Supplier: {record.supplier_name || "Not linked"}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            Reorder:{" "}
                            {formatQuantity(
                              record.reorder_level,
                              record.unit_name,
                            )}
                          </p>
                        </div>
                        {isAdmin ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRawMaterialId(record.id);
                              setRawMaterialForm(buildRawMaterialForm(record));
                              setActiveModal("rawMaterial");
                            }}
                            className={recordEditButtonClassName}
                            aria-label={`Edit ${record.name}`}
                            title={`Edit ${record.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </section>
            ) : null}

            {activeTab === "products" ? (
              <section className="panel p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="section-label">Products</p>
                    <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                      Sellable inventory
                    </h2>
                  </div>
                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() => {
                        resetFinishedProductState();
                        setActiveModal("finishedProduct");
                      }}
                      className={iconButtonClassName}
                      aria-label="Add product"
                      title="Add product"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                <div className="scrollbar-hidden mt-5 flex gap-3 overflow-x-auto pb-2">
                  {finishedProducts.length === 0 ? (
                    <EmptyState
                      title="No products yet"
                      description="Add the products the business sells and tracks in inventory."
                      className={`${recordCardClassName} justify-center`}
                    />
                  ) : (
                    finishedProducts.map((record) => (
                      <div key={record.id} className={recordCardClassName}>
                        <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto pr-14">
                          <p className="font-semibold text-slate-900">
                            {record.name}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            Category: {record.category_name || "Not assigned"}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            Supplier: {record.supplier_name || "Not linked"}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            Price: {formatCurrency(record.unit_price)}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            Current stock: {record.current_stock} {record.unit_name}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            Reorder:{" "}
                            {formatQuantity(
                              record.reorder_level,
                              record.unit_name,
                            )}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            {record.is_active ? "Active" : "Inactive"}
                          </p>
                        </div>
                        {isAdmin ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedFinishedProductId(record.id);
                              setFinishedProductForm(
                                buildFinishedProductForm(record),
                              );
                              setActiveModal("finishedProduct");
                            }}
                            className={recordEditButtonClassName}
                            aria-label={`Edit ${record.name}`}
                            title={`Edit ${record.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </section>
            ) : null}
          </div>

          <div className="space-y-6">
            {activeTab === "categories" ? (
              <section className="panel p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="section-label">Categories</p>
                    <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                      Product classification
                    </h2>
                  </div>
                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() => {
                        resetCategoryState();
                        setActiveModal("category");
                      }}
                      className={iconButtonClassName}
                      aria-label="Add category"
                      title="Add category"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                <div className="scrollbar-hidden mt-5 flex gap-3 overflow-x-auto pb-2">
                  {categories.length === 0 ? (
                    <EmptyState
                      title="No categories yet"
                      description="Create categories so products are grouped clearly across the inventory workflow."
                      className={`${recordCardClassName} justify-center`}
                    />
                  ) : (
                    categories.map((record) => (
                      <div key={record.id} className={recordCardClassName}>
                        <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto pr-14">
                          <p className="font-semibold text-slate-900">
                            {record.name}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            Parent: {record.parent_name || "Top-level"}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {record.description || "No description recorded"}
                          </p>
                        </div>
                        {isAdmin ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCategoryId(record.id);
                              setCategoryForm(buildCategoryForm(record));
                              setActiveModal("category");
                            }}
                            className={recordEditButtonClassName}
                            aria-label={`Edit ${record.name}`}
                            title={`Edit ${record.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </section>
            ) : null}

            {activeTab === "units" ? (
              <section className="panel p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="section-label">Units</p>
                    <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                      Measurement setup
                    </h2>
                  </div>
                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() => {
                        resetUnitState();
                        setActiveModal("unit");
                      }}
                      className={iconButtonClassName}
                      aria-label="Add unit"
                      title="Add unit"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                <div className="scrollbar-hidden mt-5 flex gap-3 overflow-x-auto pb-2">
                  {units.length === 0 ? (
                    <EmptyState
                      title="No units yet"
                      description="Create the measurement units inventory records will rely on."
                      className={`${recordCardClassName} justify-center`}
                    />
                  ) : (
                    units.map((record) => (
                      <div key={record.id} className={recordCardClassName}>
                        <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto pr-14">
                          <p className="font-semibold text-slate-900">
                            {record.name}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {record.symbol}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {record.description || "No description recorded"}
                          </p>
                        </div>
                        {isAdmin ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUnitId(record.id);
                              setUnitForm(buildUnitForm(record));
                              setActiveModal("unit");
                            }}
                            className={recordEditButtonClassName}
                            aria-label={`Edit ${record.name}`}
                            title={`Edit ${record.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </section>
            ) : null}

            {activeTab === "warehouses" ? (
              <section className="panel p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="section-label">Warehouses</p>
                    <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                      Where stock lives
                    </h2>
                  </div>
                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() => {
                        resetLocationState();
                        setActiveModal("location");
                      }}
                      className={iconButtonClassName}
                      aria-label="Add warehouse"
                      title="Add warehouse"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                <div className="scrollbar-hidden mt-5 flex gap-3 overflow-x-auto pb-2">
                  {locations.length === 0 ? (
                    <EmptyState
                      title="No warehouses yet"
                      description="Add warehouses, cold rooms, or stores before assigning stock."
                      className={`${recordCardClassName} justify-center`}
                    />
                  ) : (
                    locations.map((record) => (
                      <div key={record.id} className={recordCardClassName}>
                        <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto pr-14">
                          <p className="font-semibold text-slate-900">
                            {record.name}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {record.description || "No description recorded"}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            Site: {record.location || "Not set"}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            Manager: {record.manager_name || "Not assigned"}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            {record.is_active ? "Active" : "Inactive"}
                          </p>
                        </div>
                        {isAdmin ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLocationId(record.id);
                              setLocationForm(buildLocationForm(record));
                              setActiveModal("location");
                            }}
                            className={recordEditButtonClassName}
                            aria-label={`Edit ${record.name}`}
                            title={`Edit ${record.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </section>
            ) : null}
          </div>

          <div className="space-y-6">
            {activeTab === "suppliers" ? (
              <section className="panel p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="section-label">Suppliers</p>
                    <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                      External sources
                    </h2>
                  </div>
                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() => {
                        resetSupplierState();
                        setActiveModal("supplier");
                      }}
                      className={iconButtonClassName}
                      aria-label="Add supplier"
                      title="Add supplier"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                <div className="scrollbar-hidden mt-5 flex gap-3 overflow-x-auto pb-2">
                  {suppliers.length === 0 ? (
                    <EmptyState
                      title="No suppliers yet"
                      description="Add the businesses or contacts that supply inventory inputs."
                      className={`${recordCardClassName} justify-center`}
                    />
                  ) : (
                    suppliers.map((record) => (
                      <div key={record.id} className={recordCardClassName}>
                        <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto pr-14">
                          <p className="font-semibold text-slate-900">
                            {record.name}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {record.contact_person || "No contact person"}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            {record.phone || "No phone number"}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            {record.email || "No email address"}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            Terms: {record.payment_terms || "Not set"}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            Lead time: {record.lead_days} day(s)
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            {record.is_active ? "Active" : "Inactive"}
                          </p>
                        </div>
                        {isAdmin ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSupplierId(record.id);
                              setSupplierForm(buildSupplierForm(record));
                              setActiveModal("supplier");
                            }}
                            className={recordEditButtonClassName}
                            aria-label={`Edit ${record.name}`}
                            title={`Edit ${record.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </section>
            ) : null}

            {activeTab === "movements" ? (
              <section className="panel p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="section-label">Stock Movements</p>
                    <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                      Quantity changes
                    </h2>
                  </div>
                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() => {
                        resetMovementState();
                        setActiveModal("movement");
                      }}
                      className={iconButtonClassName}
                      aria-label="Add stock movement"
                      title="Add stock movement"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                <div className="scrollbar-hidden mt-5 flex gap-3 overflow-x-auto pb-2">
                  {stockMovements.length === 0 ? (
                    <EmptyState
                      title="No stock movements yet"
                      description="Record stock in, stock out, and adjustments here."
                      className={`${recordCardClassName} justify-center`}
                    />
                  ) : (
                    stockMovements.map((record) => (
                      <div key={record.id} className={recordCardClassName}>
                        <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto pr-14">
                          <p className="font-semibold text-slate-900">
                            {record.stock_item_name}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {humanizeMovementType(record.movement_type)}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            Quantity: {record.quantity}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            {formatDateTime(record.movement_date)}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {record.notes || "No notes recorded"}
                          </p>
                        </div>
                        {isAdmin ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMovementId(record.id);
                              setMovementForm(buildMovementForm(record));
                              setActiveModal("movement");
                            }}
                            className={recordEditButtonClassName}
                            aria-label={`Edit movement for ${record.stock_item_name}`}
                            title={`Edit movement for ${record.stock_item_name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </section>
            ) : null}
          </div>
        </div>

        <footer className="panel mt-auto px-4 py-3">
          <p className="text-sm leading-6 text-slate-600">
            <span className="font-semibold text-sky-700">
              {activeFlowItem.label}
            </span>{" "}
            {activeFlowItem.detail}
          </p>
        </footer>
      </div>

      {activeModal === "unit" ? (
        <ModalShell
          title={selectedUnitId ? "Edit unit" : "Add unit"}
          onClose={closeModal}
        >
          <FormPanel label="Units" title="Measurement unit form">
            <form className="space-y-4" onSubmit={handleUnitSubmit}>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Name</span>
                <input
                  className={fieldClassName}
                  value={unitForm.name}
                  onChange={(event) =>
                    setUnitForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Symbol
                </span>
                <input
                  className={fieldClassName}
                  value={unitForm.symbol}
                  onChange={(event) =>
                    setUnitForm((current) => ({
                      ...current,
                      symbol: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Description
                </span>
                <textarea
                  className={textAreaClassName}
                  value={unitForm.description}
                  onChange={(event) =>
                    setUnitForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </label>
              <FieldMessage message={unitError} tone="error" />
              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className={secondaryButtonClassName}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleUnitDelete()}
                  disabled={!selectedUnitId || isUnitPending}
                  className={dangerButtonClassName}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
                <button
                  type="submit"
                  disabled={isUnitPending}
                  className={primaryButtonClassName}
                >
                  {isUnitPending ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Saving
                    </>
                  ) : (
                    "Save unit"
                  )}
                </button>
              </div>
            </form>
          </FormPanel>
        </ModalShell>
      ) : null}

      {activeModal === "category" ? (
        <ModalShell
          title={selectedCategoryId ? "Edit category" : "Add category"}
          onClose={closeModal}
        >
          <FormPanel label="Categories" title="Category form">
            <form className="space-y-4" onSubmit={handleCategorySubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Name
                  </span>
                  <input
                    className={fieldClassName}
                    value={categoryForm.name}
                    onChange={(event) =>
                      setCategoryForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Parent category
                  </span>
                  <PickerField
                    value={categoryForm.parent ? String(categoryForm.parent) : ""}
                    options={[
                      { label: "Top-level category", value: "" },
                      ...buildCategoryOptions().filter(
                        (option) =>
                          option.value !== String(selectedCategoryId ?? ""),
                      ),
                    ]}
                    searchable
                    searchPlaceholder="Search categories"
                    onChange={(value) =>
                      setCategoryForm((current) => ({
                        ...current,
                        parent: value ? Number(value) : null,
                      }))
                    }
                  />
                </label>
              </div>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Description
                </span>
                <textarea
                  className={textAreaClassName}
                  value={categoryForm.description}
                  onChange={(event) =>
                    setCategoryForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </label>
              <FieldMessage message={categoryError} tone="error" />
              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className={secondaryButtonClassName}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleCategoryDelete()}
                  disabled={!selectedCategoryId || isCategoryPending}
                  className={dangerButtonClassName}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
                <button
                  type="submit"
                  disabled={isCategoryPending}
                  className={primaryButtonClassName}
                >
                  {isCategoryPending ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Saving
                    </>
                  ) : (
                    "Save category"
                  )}
                </button>
              </div>
            </form>
          </FormPanel>
        </ModalShell>
      ) : null}

      {activeModal === "supplier" ? (
        <ModalShell
          title={selectedSupplierId ? "Edit supplier" : "Add supplier"}
          onClose={closeModal}
        >
          <FormPanel label="Suppliers" title="Supplier form">
            <form className="space-y-4" onSubmit={handleSupplierSubmit}>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Name</span>
                <input
                  className={fieldClassName}
                  value={supplierForm.name}
                  onChange={(event) =>
                    setSupplierForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Contact person
                  </span>
                  <input
                    className={fieldClassName}
                    value={supplierForm.contact_person}
                    onChange={(event) =>
                      setSupplierForm((current) => ({
                        ...current,
                        contact_person: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Phone number
                  </span>
                  <input
                    className={fieldClassName}
                    value={supplierForm.phone}
                    onChange={(event) =>
                      setSupplierForm((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Email
                  </span>
                  <input
                    type="email"
                    className={fieldClassName}
                    value={supplierForm.email}
                    onChange={(event) =>
                      setSupplierForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Payment terms
                  </span>
                  <input
                    className={fieldClassName}
                    value={supplierForm.payment_terms}
                    onChange={(event) =>
                      setSupplierForm((current) => ({
                        ...current,
                        payment_terms: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Lead days
                  </span>
                  <input
                    type="number"
                    min="0"
                    className={fieldClassName}
                    value={supplierForm.lead_days}
                    onChange={(event) =>
                      setSupplierForm((current) => ({
                        ...current,
                        lead_days: Number(event.target.value) || 0,
                      }))
                    }
                  />
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={supplierForm.is_active}
                    onChange={(event) =>
                      setSupplierForm((current) => ({
                        ...current,
                        is_active: event.target.checked,
                      }))
                    }
                  />
                  Active supplier
                </label>
              </div>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Address
                </span>
                <textarea
                  className={textAreaClassName}
                  value={supplierForm.address}
                  onChange={(event) =>
                    setSupplierForm((current) => ({
                      ...current,
                      address: event.target.value,
                    }))
                  }
                />
              </label>
              <FieldMessage message={supplierError} tone="error" />
              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className={secondaryButtonClassName}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleSupplierDelete()}
                  disabled={!selectedSupplierId || isSupplierPending}
                  className={dangerButtonClassName}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
                <button
                  type="submit"
                  disabled={isSupplierPending}
                  className={primaryButtonClassName}
                >
                  {isSupplierPending ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Saving
                    </>
                  ) : (
                    "Save supplier"
                  )}
                </button>
              </div>
            </form>
          </FormPanel>
        </ModalShell>
      ) : null}

      {activeModal === "location" ? (
        <ModalShell
          title={selectedLocationId ? "Edit warehouse" : "Add warehouse"}
          onClose={closeModal}
        >
          <FormPanel label="Warehouses" title="Warehouse form">
            <form className="space-y-4" onSubmit={handleLocationSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Name
                  </span>
                  <input
                    className={fieldClassName}
                    value={locationForm.name}
                    onChange={(event) =>
                      setLocationForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Site or location
                  </span>
                  <input
                    className={fieldClassName}
                    value={locationForm.location}
                    onChange={(event) =>
                      setLocationForm((current) => ({
                        ...current,
                        location: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Manager
                </span>
                <input
                  className={fieldClassName}
                  value={locationForm.manager ? String(locationForm.manager) : ""}
                  onChange={(event) =>
                    setLocationForm((current) => ({
                      ...current,
                      manager: event.target.value
                        ? Number(event.target.value)
                        : null,
                    }))
                  }
                  placeholder="Enter employee ID if known"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Description
                </span>
                <textarea
                  className={textAreaClassName}
                  value={locationForm.description}
                  onChange={(event) =>
                    setLocationForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={locationForm.is_active}
                  onChange={(event) =>
                    setLocationForm((current) => ({
                      ...current,
                      is_active: event.target.checked,
                    }))
                  }
                />
                Active warehouse
              </label>
              <FieldMessage message={locationError} tone="error" />
              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className={secondaryButtonClassName}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleLocationDelete()}
                  disabled={!selectedLocationId || isLocationPending}
                  className={dangerButtonClassName}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
                <button
                  type="submit"
                  disabled={isLocationPending}
                  className={primaryButtonClassName}
                >
                  {isLocationPending ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Saving
                    </>
                  ) : (
                    "Save warehouse"
                  )}
                </button>
              </div>
            </form>
          </FormPanel>
        </ModalShell>
      ) : null}
      {activeModal === "rawMaterial" ? (
        <ModalShell
          title={
            selectedRawMaterialId ? "Edit raw material" : "Add raw material"
          }
          onClose={closeModal}
        >
          <FormPanel label="Raw Materials" title="Raw material form">
            <form className="space-y-4" onSubmit={handleRawMaterialSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                {/* Name */}
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Name
                  </span>
                  <input
                    className={fieldClassName}
                    value={rawMaterialForm.name}
                    onChange={(event) =>
                      setRawMaterialForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    required
                  />
                </label>

                {/* Unit */}
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Unit
                  </span>
                  <PickerField
                    value={
                      rawMaterialForm.unit ? String(rawMaterialForm.unit) : ""
                    }
                    options={[
                      { label: "Select unit", value: "" },
                      ...units.map((record) => ({
                        label: `${record.name} (${record.symbol})`,
                        value: String(record.id),
                      })),
                    ]}
                    onChange={(value) =>
                      setRawMaterialForm((current) => ({
                        ...current,
                        unit: value ? Number(value) : 0,
                      }))
                    }
                  />
                </label>

                {/* Supplier */}
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Supplier
                  </span>
                  <PickerField
                    value={
                      rawMaterialForm.supplier
                        ? String(rawMaterialForm.supplier)
                        : ""
                    }
                    options={[
                      { label: "No supplier", value: "" },
                      ...buildSupplierOptions(),
                    ]}
                    searchable
                    searchPlaceholder="Search suppliers"
                    onChange={(value) =>
                      setRawMaterialForm((current) => ({
                        ...current,
                        supplier: value ? Number(value) : null,
                      }))
                    }
                  />
                </label>

                {/* Reorder level */}
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Reorder level
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={fieldClassName}
                    value={rawMaterialForm.reorder_level}
                    onChange={(event) =>
                      setRawMaterialForm((current) => ({
                        ...current,
                        reorder_level: event.target.value,
                      }))
                    }
                    required
                  />
                </label>

                {/* Active */}
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={rawMaterialForm.is_active}
                    onChange={(event) =>
                      setRawMaterialForm((current) => ({
                        ...current,
                        is_active: event.target.checked,
                      }))
                    }
                  />
                  Active raw material
                </label>
              </div>

              {/* Description */}
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Description
                </span>
                <textarea
                  className={textAreaClassName}
                  value={rawMaterialForm.description}
                  onChange={(event) =>
                    setRawMaterialForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </label>

              {/* Notes */}
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Notes
                </span>
                <textarea
                  className={textAreaClassName}
                  value={rawMaterialForm.notes}
                  onChange={(event) =>
                    setRawMaterialForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                />
              </label>

              <FieldMessage message={rawMaterialError} tone="error" />

              {/* Buttons */}
              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className={secondaryButtonClassName}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => void handleRawMaterialDelete()}
                  disabled={!selectedRawMaterialId || isRawMaterialPending}
                  className={dangerButtonClassName}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>

                <button
                  type="submit"
                  disabled={isRawMaterialPending}
                  className={primaryButtonClassName}
                >
                  {isRawMaterialPending ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Saving
                    </>
                  ) : (
                    "Save raw material"
                  )}
                </button>
              </div>
            </form>
          </FormPanel>
        </ModalShell>
      ) : null}

      {activeModal === "finishedProduct" ? (
        <ModalShell
          title={selectedFinishedProductId ? "Edit product" : "Add product"}
          onClose={closeModal}
        >
          <FormPanel label="Products" title="Product form">
            <form className="space-y-5" onSubmit={handleFinishedProductSubmit}>
              <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
                <div className="space-y-3">
                  <span className="text-sm font-medium text-slate-700">
                    Product image
                  </span>
                  <div className="h-full min-h-[260px] rounded-3xl border border-slate-200/80 bg-slate-50/70 p-5">
                    <ProductImagePreview
                      image={finishedProductForm.image}
                      alt={finishedProductForm.name || "Product image"}
                      className="h-full min-h-[218px] w-full border border-dashed border-slate-200 bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-sm font-medium text-slate-700">
                    Current stock
                  </span>
                  <div className="flex h-full min-h-[260px] flex-col rounded-3xl border border-slate-200/80 bg-slate-50/70 p-5">
                    <div className="space-y-3">
                      <div className={`${fieldClassName} min-h-[56px] flex items-center`}>
                        {editingFinishedProductRecord
                          ? formatQuantity(
                              editingFinishedProductRecord.current_stock,
                              editingFinishedProductRecord.unit_name,
                            )
                          : "0.00"}
                      </div>
                    </div>

                    <div className="mt-6 space-y-3 border-t border-slate-200 pt-6">
                      <label className="flex w-full cursor-pointer items-center justify-start rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                        <span>Choose image</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => {
                            const nextFile = event.target.files?.[0] ?? null;
                            if (!nextFile) {
                              return;
                            }

                            void normalizeProductImage(nextFile)
                              .then((normalizedFile) => {
                                setFinishedProductForm((current) => ({
                                  ...current,
                                  image: normalizedFile,
                                  clear_image: false,
                                }));
                                setIsRemoveImageConfirming(false);
                              })
                              .catch(() => {
                                setFinishedProductForm((current) => ({
                                  ...current,
                                  image: nextFile,
                                  clear_image: false,
                                }));
                                setIsRemoveImageConfirming(false);
                              });
                          }}
                        />
                      </label>
                    </div>

                    <div className="mt-auto border-t border-slate-200 pt-6">
                      {isRemoveImageConfirming ? (
                        <div className="space-y-3">
                          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                            Remove this product image?
                          </div>
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setFinishedProductForm((current) => ({
                                  ...current,
                                  image: null,
                                  clear_image: true,
                                }));
                                setIsRemoveImageConfirming(false);
                              }}
                              className={`${dangerButtonClassName} w-full justify-center`}
                              aria-label="Confirm remove image"
                              title="Confirm remove image"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsRemoveImageConfirming(false)}
                              className={`${secondaryButtonClassName} w-full justify-center`}
                              aria-label="Cancel remove image"
                              title="Cancel remove image"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsRemoveImageConfirming(true)}
                          disabled={!finishedProductForm.image}
                          className={`${secondaryButtonClassName} w-full justify-start`}
                        >
                          Remove image
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Name */}
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Name
                  </span>
                  <input
                    className={fieldClassName}
                    value={finishedProductForm.name}
                    onChange={(event) =>
                      setFinishedProductForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    required
                  />
                </label>

                {/* Unit */}
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Unit
                  </span>
                  <PickerField
                    value={
                      finishedProductForm.unit
                        ? String(finishedProductForm.unit)
                        : ""
                    }
                    options={[
                      { label: "Select unit", value: "" },
                      ...units.map((record) => ({
                        label: `${record.name} (${record.symbol})`,
                        value: String(record.id),
                      })),
                    ]}
                    onChange={(value) =>
                      setFinishedProductForm((current) => ({
                        ...current,
                        unit: value ? Number(value) : 0,
                      }))
                    }
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Category
                  </span>
                  <PickerField
                    value={
                      finishedProductForm.category
                        ? String(finishedProductForm.category)
                        : ""
                    }
                    options={[
                      { label: "No category", value: "" },
                      ...buildCategoryOptions(),
                    ]}
                    searchable
                    searchPlaceholder="Search categories"
                    onChange={(value) =>
                      setFinishedProductForm((current) => ({
                        ...current,
                        category: value ? Number(value) : null,
                      }))
                    }
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Supplier
                  </span>
                  <PickerField
                    value={
                      finishedProductForm.supplier
                        ? String(finishedProductForm.supplier)
                        : ""
                    }
                    options={[
                      { label: "No supplier", value: "" },
                      ...buildSupplierOptions(),
                    ]}
                    searchable
                    searchPlaceholder="Search suppliers"
                    onChange={(value) =>
                      setFinishedProductForm((current) => ({
                        ...current,
                        supplier: value ? Number(value) : null,
                      }))
                    }
                  />
                </label>

                {/* Reorder level */}
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Reorder level
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={fieldClassName}
                    value={finishedProductForm.reorder_level}
                    onChange={(event) =>
                      setFinishedProductForm((current) => ({
                        ...current,
                        reorder_level: event.target.value,
                      }))
                    }
                    required
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Unit price
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={fieldClassName}
                    value={finishedProductForm.unit_price}
                    onChange={(event) =>
                      setFinishedProductForm((current) => ({
                        ...current,
                        unit_price: event.target.value,
                      }))
                    }
                    required
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Cost price
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={fieldClassName}
                    value={finishedProductForm.cost_price}
                    onChange={(event) =>
                      setFinishedProductForm((current) => ({
                        ...current,
                        cost_price: event.target.value,
                      }))
                    }
                    required
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Reorder quantity
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={fieldClassName}
                    value={finishedProductForm.reorder_quantity}
                    onChange={(event) =>
                      setFinishedProductForm((current) => ({
                        ...current,
                        reorder_quantity: event.target.value,
                      }))
                    }
                    required
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Default warehouse
                  </span>
                  <PickerField
                    value={
                      finishedProductForm.location
                        ? String(finishedProductForm.location)
                        : ""
                    }
                    options={[
                      { label: "No default warehouse", value: "" },
                      ...buildLocationOptions(),
                    ]}
                    searchable
                    searchPlaceholder="Search warehouses"
                    onChange={(value) =>
                      setFinishedProductForm((current) => ({
                        ...current,
                        location: value ? Number(value) : null,
                      }))
                    }
                  />
                </label>

                {/* Active */}
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={finishedProductForm.is_active}
                    onChange={(event) =>
                      setFinishedProductForm((current) => ({
                        ...current,
                        is_active: event.target.checked,
                      }))
                    }
                  />
                  Active product
                </label>
              </div>

              {/* Description */}
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Description
                </span>
                <textarea
                  className={textAreaClassName}
                  value={finishedProductForm.description}
                  onChange={(event) =>
                    setFinishedProductForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </label>

              {editingFinishedProductRecord ? (
                <div className="space-y-4 rounded-3xl border border-slate-200/80 bg-slate-50/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        Barcode
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Open to view or scan the product code.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsQrExpanded((current) => !current)}
                      className={secondaryButtonClassName}
                    >
                      {isQrExpanded ? "Hide barcode" : "Show barcode"}
                    </button>
                  </div>

                  <div
                    className={[
                      "overflow-hidden transition-all duration-300 ease-out",
                      isQrExpanded
                        ? "max-h-[420px] opacity-100 translate-y-0"
                        : "max-h-0 opacity-0 -translate-y-2",
                    ].join(" ")}
                  >
                    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
                      <div className="flex flex-col items-center gap-4">
                        <ProductQrPreview
                          value={resolveProductQrValue(editingFinishedProductRecord)}
                          size={280}
                          className="h-[280px] w-[280px]"
                        />
                        <p className="text-sm font-medium text-slate-700">
                          {editingFinishedProductRecord.barcode}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <FieldMessage message={finishedProductError} tone="error" />

              {/* Buttons */}
              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className={secondaryButtonClassName}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => void handleFinishedProductDelete()}
                  disabled={
                    !selectedFinishedProductId || isFinishedProductPending
                  }
                  className={dangerButtonClassName}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>

                <button
                  type="submit"
                  disabled={isFinishedProductPending}
                  className={primaryButtonClassName}
                >
                  {isFinishedProductPending ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Saving
                    </>
                  ) : (
                      "Save product"
                  )}
                </button>
              </div>
            </form>
          </FormPanel>
        </ModalShell>
      ) : null}

      {activeModal === "stockItem" ? (
        <ModalShell
          title={
            selectedStockItemId ? "Edit warehouse stock" : "Add warehouse stock"
          }
          onClose={closeModal}
          panelClassName="min-h-[760px]"
        >
          <div className="pt-14">
            <FormPanel label="Warehouse Stock" title="Warehouse stock form">
              <form className="space-y-4 py-4" onSubmit={handleStockItemSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Item type */}
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      Item type
                    </span>
                    <PickerField
                      value={stockItemForm.item_kind}
                      options={[
                        { label: "Raw material", value: "raw_material" },
                        {
                          label: "Product",
                          value: "finished_product",
                        },
                      ]}
                      onChange={(value) =>
                        setStockItemForm((current) => ({
                          ...current,
                          item_kind: value as
                            | "raw_material"
                            | "finished_product",
                          raw_material: "",
                          finished_product: "",
                        }))
                      }
                    />
                  </label>

                  {/* Location */}
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      Warehouse
                    </span>
                    <PickerField
                      value={
                        stockItemForm.location
                          ? String(stockItemForm.location)
                          : ""
                      }
                      options={[
                        { label: "Select warehouse", value: "" },
                        ...buildLocationOptions(),
                      ]}
                      searchable
                      searchPlaceholder="Search warehouses"
                      onChange={(value) =>
                        setStockItemForm((current) => ({
                          ...current,
                          location: value,
                        }))
                      }
                    />
                  </label>
                </div>

                {/* Raw material OR Product */}
                {stockItemForm.item_kind === "raw_material" ? (
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      Raw material
                    </span>
                    <PickerField
                      value={stockItemForm.raw_material ?? ""}
                      options={[
                        { label: "Select raw material", value: "" },
                        ...buildRawMaterialOptions(),
                      ]}
                      searchable
                      searchPlaceholder="Search raw materials"
                      onChange={(value) =>
                        setStockItemForm((current) => ({
                          ...current,
                          raw_material: value,
                          finished_product: "",
                        }))
                      }
                    />
                  </label>
                ) : (
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      Product
                    </span>
                    <PickerField
                      value={stockItemForm.finished_product ?? ""}
                      options={[
                        { label: "Select product", value: "" },
                        ...buildFinishedProductOptions(),
                      ]}
                      searchable
                      searchPlaceholder="Search products"
                      onChange={(value) =>
                        setStockItemForm((current) => ({
                          ...current,
                          finished_product: value,
                          raw_material: "",
                        }))
                      }
                    />
                  </label>
                )}

                {/* Opening stock */}
                {!selectedStockItemId ? (
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      Opening stock
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={fieldClassName}
                      value={stockItemForm.opening_stock}
                      onChange={(event) =>
                        setStockItemForm((current) => ({
                          ...current,
                          opening_stock: event.target.value,
                        }))
                      }
                    />
                  </label>
                ) : null}

                {/* Bin location */}
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Bin location
                  </span>
                  <input
                    className={fieldClassName}
                    value={stockItemForm.bin_location}
                    onChange={(event) =>
                      setStockItemForm((current) => ({
                        ...current,
                        bin_location: event.target.value,
                      }))
                    }
                  />
                </label>

                {/* Info */}
                <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                  Use stock movements to adjust quantities after the warehouse
                  stock record is created.
                </div>

                <FieldMessage message={stockItemError} tone="error" />

                {/* Buttons */}
                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className={secondaryButtonClassName}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleStockItemDelete()}
                    disabled={!selectedStockItemId || isStockItemPending}
                    className={dangerButtonClassName}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>

                  <button
                    type="submit"
                    disabled={isStockItemPending}
                    className={primaryButtonClassName}
                  >
                    {isStockItemPending ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Saving
                      </>
                    ) : (
                      "Save warehouse stock"
                  )}
                </button>
              </div>
              </form>
            </FormPanel>
          </div>
        </ModalShell>
      ) : null}

      {activeModal === "movement" ? (
        <ModalShell
          title={
            selectedMovementId ? "Edit stock movement" : "Record stock movement"
          }
          onClose={closeModal}
          panelClassName="min-h-[760px]"
        >
          <div className="pt-14">
            <FormPanel label="Stock Movements" title="Stock movement form">
              <form className="space-y-4 py-4" onSubmit={handleMovementSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Warehouse stock */}
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      Warehouse stock
                    </span>
                    <PickerField
                      value={movementForm.stock_item ?? ""}
                      options={[
                        { label: "Select warehouse stock", value: "" },
                        ...buildStockItemOptions(),
                      ]}
                      searchable
                      searchPlaceholder="Search warehouse stock"
                      onChange={(value) =>
                        setMovementForm((current) => ({
                          ...current,
                          stock_item: value,
                        }))
                      }
                    />
                  </label>

                  {/* Movement type */}
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      Movement type
                    </span>
                    <PickerField
                      value={movementForm.movement_type}
                      options={[
                        { label: "Stock in", value: "stock_in" },
                        { label: "Stock out", value: "stock_out" },
                        {
                          label: "Positive adjustment",
                          value: "adjustment_positive",
                        },
                        {
                          label: "Negative adjustment",
                          value: "adjustment_negative",
                        },
                        { label: "Return", value: "return" },
                      ]}
                      onChange={(value) =>
                        setMovementForm((current) => ({
                          ...current,
                          movement_type: value as StockMovementType,
                        }))
                      }
                    />
                  </label>

                  {/* Quantity */}
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      Quantity
                    </span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      className={fieldClassName}
                      value={movementForm.quantity}
                      onChange={(event) =>
                        setMovementForm((current) => ({
                          ...current,
                          quantity: event.target.value,
                        }))
                      }
                      required
                    />
                  </label>

                  {/* Movement date */}
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      Movement date
                    </span>
                    <input
                      type="datetime-local"
                      className={fieldClassName}
                      value={movementForm.movement_date}
                      onChange={(event) =>
                        setMovementForm((current) => ({
                          ...current,
                          movement_date: event.target.value,
                        }))
                      }
                      required
                    />
                  </label>
                </div>

                {/* Notes */}
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Notes
                  </span>
                  <textarea
                    className={textAreaClassName}
                    value={movementForm.notes}
                    onChange={(event) =>
                      setMovementForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                  />
                </label>

                <FieldMessage message={movementError} tone="error" />

                {/* Buttons */}
                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className={secondaryButtonClassName}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleMovementDelete()}
                    disabled={!selectedMovementId || isMovementPending}
                    className={dangerButtonClassName}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>

                  <button
                    type="submit"
                    disabled={isMovementPending}
                    className={primaryButtonClassName}
                  >
                    {isMovementPending ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Saving
                      </>
                    ) : (
                      "Save movement"
                    )}
                  </button>
                </div>
              </form>
            </FormPanel>
          </div>
        </ModalShell>
      ) : null}
    </div>
  );
}
