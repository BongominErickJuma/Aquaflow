import {
  LoaderCircle,
  ChevronDown,
  Check,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { ModuleTabs } from "../components/layout/ModuleTabs";
import { useAuth } from "../features/auth/AuthProvider";
import { ApiError } from "../lib/api/auth";
import {
  createFinishedProduct,
  createRawMaterial,
  createStockItem,
  createStockMovement,
  createStorageLocation,
  createSupplier,
  createUnit,
  deleteFinishedProduct,
  deleteRawMaterial,
  deleteStockItem,
  deleteStockMovement,
  deleteStorageLocation,
  deleteSupplier,
  deleteUnit,
  fetchFinishedProduct,
  fetchFinishedProducts,
  fetchRawMaterial,
  fetchRawMaterials,
  fetchReorderAlerts,
  fetchStockItem,
  fetchStockItems,
  fetchStockMovement,
  fetchStockMovements,
  fetchStorageLocation,
  fetchStorageLocations,
  fetchSupplier,
  fetchSuppliers,
  fetchUnit,
  fetchUnits,
  updateFinishedProduct,
  updateRawMaterial,
  updateStockItem,
  updateStockMovement,
  updateStorageLocation,
  updateSupplier,
  updateUnit,
} from "../lib/api/inventory";
import type {
  FinishedProductPayload,
  FinishedProductRecord,
  RawMaterialPayload,
  RawMaterialRecord,
  ReorderAlertRecord,
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
  "group relative flex h-[220px] min-w-[280px] max-w-[280px] flex-shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4";
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
      "Add and update suppliers here. Before this, make sure the units are ready. Next, create storage locations.",
  },
  {
    id: "locations",
    label: "Storage Locations",
    detail:
      "Set up storage locations here. Before this, confirm suppliers are in place. Next, add raw materials.",
  },
  {
    id: "raw",
    label: "Raw Materials",
    detail:
      "Create and edit raw materials here. Before this, storage locations should already exist. Next, add finished products.",
  },
  {
    id: "finished",
    label: "Finished Products",
    detail:
      "Set up finished products here. Before this, make sure raw materials are ready. Next, create stock items.",
  },
  {
    id: "stock",
    label: "Stock Items",
    detail:
      "Create stock items here and link them to locations. Before this, finished products should be in place. Next, record stock movements.",
  },
  {
    id: "movements",
    label: "Stock Movements",
    detail:
      "Capture stock movement entries here. Before this, the stock items should already exist. Next, review reorder alerts.",
  },
  {
    id: "alerts",
    label: "Reorder Alerts",
    detail:
      "Review reorder alerts here. Before this, you should have stock movements recorded. This is the last inventory step.",
  },
] as const;

type ActiveModal =
  | "unit"
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
  notes: string;
};

type StockMovementFormState = {
  stock_item: string;
  movement_type: StockMovementType;
  quantity: string;
  reference_note: string;
  movement_date: string;
};

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

function createEmptySupplierForm(): SupplierPayload {
  return {
    name: "",
    contact_person: "",
    email: "",
    phone_number: "",
    address: "",
    notes: "",
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
    phone_number: record.phone_number,
    address: record.address,
    notes: record.notes,
    is_active: record.is_active,
  };
}

function createEmptyLocationForm(): StorageLocationPayload {
  return {
    name: "",
    code: "",
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
    code: record.code,
    description: record.description,
    is_active: record.is_active,
  };
}

function createEmptyRawMaterialForm(): RawMaterialPayload {
  return {
    name: "",
    sku: "",
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
    sku: record.sku,
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
    sku: "",
    description: "",
    unit: 0,
    reorder_level: "0.00",
    notes: "",
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
    sku: record.sku,
    description: record.description,
    unit: record.unit,
    reorder_level: record.reorder_level,
    notes: record.notes,
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
    notes: "",
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
    notes: record.notes,
  };
}

function createEmptyMovementForm(): StockMovementFormState {
  return {
    stock_item: "",
    movement_type: "stock_in",
    quantity: "",
    reference_note: "",
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
    reference_note: record.reference_note,
    movement_date: formatDateTimeInput(record.movement_date),
  };
}

function PickerField({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedLabel =
    options.find((option) => option.value === value)?.label ??
    options[0]?.label ??
    "Select";

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
          <div className="space-y-1">
            {options.map((option) => (
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
                {value === option.value ? <Check className="h-4 w-4" /> : null}
              </button>
            ))}
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
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/32 px-4 py-6 backdrop-blur-sm">
      <div className="panel scrollbar-hidden max-h-[90vh] w-full max-w-3xl overflow-y-auto p-6">
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
        <div className="mt-6">{children}</div>
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

export function InventoryPage() {
  const { user } = useAuth();
  const isAdmin =
    user?.role.code === "admin" || user?.role.code === "superuser";

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [activeTab, setActiveTab] = useState("units");

  const tabs = inventoryMilestoneFlow.map(({ id, label }) => ({ id, label }));
  const activeFlowItem =
    inventoryMilestoneFlow.find((item) => item.id === activeTab) ??
    inventoryMilestoneFlow[0];
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [units, setUnits] = useState<UnitRecord[]>([]);
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
  const [reorderAlerts, setReorderAlerts] = useState<ReorderAlertRecord[]>([]);

  const [unitForm, setUnitForm] = useState<UnitPayload>(createEmptyUnitForm());
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

  const locationNameById = new Map(
    locations.map((record) => [record.id, record.name]),
  );

  async function reloadInventoryData() {
    const [
      nextUnits,
      nextSuppliers,
      nextLocations,
      nextRawMaterials,
      nextFinishedProducts,
      nextStockItems,
      nextStockMovements,
      nextAlerts,
    ] = await Promise.all([
      fetchUnits(),
      fetchSuppliers(),
      fetchStorageLocations(),
      fetchRawMaterials(),
      fetchFinishedProducts(),
      fetchStockItems(),
      fetchStockMovements(),
      fetchReorderAlerts(),
    ]);

    setUnits(nextUnits);
    setSuppliers(nextSuppliers);
    setLocations(nextLocations);
    setRawMaterials(nextRawMaterials);
    setFinishedProducts(nextFinishedProducts);
    setStockItems(nextStockItems);
    setStockMovements(nextStockMovements);
    setReorderAlerts(nextAlerts);
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
        const record = await fetchStorageLocation(selectedLocationId);
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
        const record = await fetchFinishedProduct(selectedFinishedProductId);
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
        const record = await fetchStockItem(selectedStockItemId);
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
    resetUnitState();
    resetSupplierState();
    resetLocationState();
    resetRawMaterialState();
    resetFinishedProductState();
    resetStockItemState();
    resetMovementState();
    setActiveModal(null);
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

  const handleSupplierSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSupplierError("");
    setIsSupplierPending(true);

    try {
      const payload: SupplierPayload = {
        name: supplierForm.name.trim(),
        contact_person: supplierForm.contact_person.trim(),
        email: supplierForm.email.trim(),
        phone_number: supplierForm.phone_number.trim(),
        address: supplierForm.address.trim(),
        notes: supplierForm.notes.trim(),
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
        code: locationForm.code.trim(),
        description: locationForm.description.trim(),
        is_active: locationForm.is_active,
      };

      if (selectedLocationId) {
        await updateStorageLocation(selectedLocationId, payload);
      } else {
        await createStorageLocation(payload);
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
      await deleteStorageLocation(selectedLocationId);
      await reloadInventoryData();
      closeModal();
    } catch (error) {
      setLocationError(
        error instanceof ApiError
          ? error.message
          : "Unable to delete the location right now.",
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
        sku: rawMaterialForm.sku.trim(),
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
        sku: finishedProductForm.sku.trim(),
        description: finishedProductForm.description.trim(),
        unit: finishedProductForm.unit,
        reorder_level: finishedProductForm.reorder_level,
        notes: finishedProductForm.notes.trim(),
        is_active: finishedProductForm.is_active,
      };

      if (selectedFinishedProductId) {
        await updateFinishedProduct(selectedFinishedProductId, payload);
      } else {
        await createFinishedProduct(payload);
      }

      await reloadInventoryData();
      closeModal();
    } catch (error) {
      setFinishedProductError(
        error instanceof ApiError
          ? error.message
          : "Unable to save the finished product right now.",
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
      await deleteFinishedProduct(selectedFinishedProductId);
      await reloadInventoryData();
      closeModal();
    } catch (error) {
      setFinishedProductError(
        error instanceof ApiError
          ? error.message
          : "Unable to delete the finished product right now.",
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
        notes: stockItemForm.notes.trim(),
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
        await updateStockItem(selectedStockItemId, payload);
      } else {
        await createStockItem(payload);
      }

      await reloadInventoryData();
      closeModal();
    } catch (error) {
      setStockItemError(
        error instanceof ApiError
          ? error.message
          : "Unable to save the stock item right now.",
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
      await deleteStockItem(selectedStockItemId);
      await reloadInventoryData();
      closeModal();
    } catch (error) {
      setStockItemError(
        error instanceof ApiError
          ? error.message
          : "Unable to delete the stock item right now.",
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
        reference_note: movementForm.reference_note.trim(),
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
                Stock control workspace
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-600">
                Quantities live on stock items, and quantity changes happen
                through stock movements. This page keeps the records visible and
                the edits tucked into modals.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="hero-metric-card">
              <p className="hero-metric-label">Stock items</p>
              <p className="hero-metric-value">{stockItems.length}</p>
            </div>
            <div className="hero-metric-card">
              <p className="hero-metric-label">Alerts</p>
              <p className="hero-metric-value">{reorderAlerts.length}</p>
            </div>
            <div className="hero-metric-card">
              <p className="hero-metric-label">Suppliers</p>
              <p className="hero-metric-value">
                {suppliers.filter((item) => item.is_active).length}
              </p>
            </div>
            <div className="hero-metric-card">
              <p className="hero-metric-label">Locations</p>
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
                  <p className="section-label">Reorder Alerts</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                    Attention needed
                  </h2>
                </div>

                <div className="scrollbar-hidden mt-5 flex gap-3 overflow-x-auto pb-2">
                  {reorderAlerts.length === 0 ? (
                    <EmptyState
                      title="No reorder alerts"
                      description="All tracked items are above their reorder levels right now."
                      className={`${recordCardClassName} justify-center`}
                    />
                  ) : (
                    reorderAlerts.map((record) => (
                      <div key={record.id} className={recordCardClassName}>
                        <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto pr-2">
                          <p className="font-semibold text-slate-900">
                            {record.item_name}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {record.item_type === "raw_material"
                              ? "Raw material"
                              : "Finished product"}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            Location:{" "}
                            {locationNameById.get(record.location) ??
                              `#${record.location}`}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            In stock:{" "}
                            {formatQuantity(record.quantity, record.unit_name)}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            Reorder level:{" "}
                            {formatQuantity(
                              record.reorder_level,
                              record.unit_name,
                            )}
                          </p>
                          <p className="mt-2 text-sm font-medium text-amber-700">
                            Shortage:{" "}
                            {formatQuantity(record.shortage, record.unit_name)}
                          </p>
                        </div>
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
                    <p className="section-label">Stock Items</p>
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
                      aria-label="Add stock item"
                      title="Add stock item"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                <div className="scrollbar-hidden mt-5 flex gap-3 overflow-x-auto pb-2">
                  {stockItems.length === 0 ? (
                    <EmptyState
                      title="No stock items yet"
                      description="Create stock items to start tracking balances by location."
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
                              : "Finished product"}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            Location:{" "}
                            {locationNameById.get(record.location) ??
                              `#${record.location}`}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            Quantity:{" "}
                            {formatQuantity(record.quantity, record.unit_name)}
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
                          <p className="mt-1 text-sm text-slate-500">
                            {record.sku}
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

            {activeTab === "finished" ? (
              <section className="panel p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="section-label">Finished Products</p>
                    <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                      Sellable outputs
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
                      aria-label="Add finished product"
                      title="Add finished product"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                <div className="scrollbar-hidden mt-5 flex gap-3 overflow-x-auto pb-2">
                  {finishedProducts.length === 0 ? (
                    <EmptyState
                      title="No finished products yet"
                      description="Add the packaged products the business keeps in stock."
                      className={`${recordCardClassName} justify-center`}
                    />
                  ) : (
                    finishedProducts.map((record) => (
                      <div key={record.id} className={recordCardClassName}>
                        <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto pr-14">
                          <p className="font-semibold text-slate-900">
                            {record.name}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {record.sku}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            Unit: {record.unit_name}
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
                            onClick={() => {
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

            {activeTab === "locations" ? (
              <section className="panel p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="section-label">Storage Locations</p>
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
                      aria-label="Add storage location"
                      title="Add storage location"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                <div className="scrollbar-hidden mt-5 flex gap-3 overflow-x-auto pb-2">
                  {locations.length === 0 ? (
                    <EmptyState
                      title="No storage locations yet"
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
                          <p className="mt-1 text-sm text-slate-500">
                            {record.code}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {record.description || "No description recorded"}
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
                            {record.phone_number || "No phone number"}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            {record.email || "No email address"}
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
                            {record.reference_note || "No reference note"}
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
                    value={supplierForm.phone_number}
                    onChange={(event) =>
                      setSupplierForm((current) => ({
                        ...current,
                        phone_number: event.target.value,
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
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Notes
                </span>
                <textarea
                  className={textAreaClassName}
                  value={supplierForm.notes}
                  onChange={(event) =>
                    setSupplierForm((current) => ({
                      ...current,
                      notes: event.target.value,
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
          title={
            selectedLocationId
              ? "Edit storage location"
              : "Add storage location"
          }
          onClose={closeModal}
        >
          <FormPanel label="Storage Locations" title="Storage location form">
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
                    Code
                  </span>
                  <input
                    className={fieldClassName}
                    value={locationForm.code}
                    onChange={(event) =>
                      setLocationForm((current) => ({
                        ...current,
                        code: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
              </div>
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
                Active location
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
                    "Save location"
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

                {/* SKU */}
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    SKU
                  </span>
                  <input
                    className={fieldClassName}
                    value={rawMaterialForm.sku}
                    onChange={(event) =>
                      setRawMaterialForm((current) => ({
                        ...current,
                        sku: event.target.value,
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
                      ...suppliers.map((record) => ({
                        label: record.name,
                        value: String(record.id),
                      })),
                    ]}
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
          title={
            selectedFinishedProductId
              ? "Edit finished product"
              : "Add finished product"
          }
          onClose={closeModal}
        >
          <FormPanel label="Finished Products" title="Finished product form">
            <form className="space-y-4" onSubmit={handleFinishedProductSubmit}>
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

                {/* SKU */}
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    SKU
                  </span>
                  <input
                    className={fieldClassName}
                    value={finishedProductForm.sku}
                    onChange={(event) =>
                      setFinishedProductForm((current) => ({
                        ...current,
                        sku: event.target.value,
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
                  Active finished product
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

              {/* Notes */}
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Notes
                </span>
                <textarea
                  className={textAreaClassName}
                  value={finishedProductForm.notes}
                  onChange={(event) =>
                    setFinishedProductForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                />
              </label>

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
                    "Save finished product"
                  )}
                </button>
              </div>
            </form>
          </FormPanel>
        </ModalShell>
      ) : null}

      {activeModal === "stockItem" ? (
        <ModalShell
          title={selectedStockItemId ? "Edit stock item" : "Add stock item"}
          onClose={closeModal}
        >
          <FormPanel label="Stock Items" title="Stock item form">
            <form className="space-y-4" onSubmit={handleStockItemSubmit}>
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
                      { label: "Finished product", value: "finished_product" },
                    ]}
                    onChange={(value) =>
                      setStockItemForm((current) => ({
                        ...current,
                        item_kind: value as "raw_material" | "finished_product",
                        raw_material: "",
                        finished_product: "",
                      }))
                    }
                  />
                </label>

                {/* Location */}
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Storage location
                  </span>
                  <PickerField
                    value={
                      stockItemForm.location
                        ? String(stockItemForm.location)
                        : ""
                    }
                    options={[
                      { label: "Select location", value: "" },
                      ...locations.map((record) => ({
                        label: record.name,
                        value: String(record.id),
                      })),
                    ]}
                    onChange={(value) =>
                      setStockItemForm((current) => ({
                        ...current,
                        location: value,
                      }))
                    }
                  />
                </label>
              </div>

              {/* Raw material OR Finished product */}
              {stockItemForm.item_kind === "raw_material" ? (
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Raw material
                  </span>
                  <PickerField
                    value={stockItemForm.raw_material ?? ""}
                    options={[
                      { label: "Select raw material", value: "" },
                      ...rawMaterials.map((record) => ({
                        label: record.name,
                        value: String(record.id),
                      })),
                    ]}
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
                    Finished product
                  </span>
                  <PickerField
                    value={stockItemForm.finished_product ?? ""}
                    options={[
                      { label: "Select finished product", value: "" },
                      ...finishedProducts.map((record) => ({
                        label: record.name,
                        value: String(record.id),
                      })),
                    ]}
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

              {/* Notes */}
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Notes
                </span>
                <textarea
                  className={textAreaClassName}
                  value={stockItemForm.notes}
                  onChange={(event) =>
                    setStockItemForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                />
              </label>

              {/* Info */}
              <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                Use stock movements to adjust quantities after the stock item is
                created.
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
                    "Save stock item"
                  )}
                </button>
              </div>
            </form>
          </FormPanel>
        </ModalShell>
      ) : null}

      {activeModal === "movement" ? (
        <ModalShell
          title={
            selectedMovementId ? "Edit stock movement" : "Record stock movement"
          }
          onClose={closeModal}
        >
          <FormPanel label="Stock Movements" title="Stock movement form">
            <form className="space-y-4" onSubmit={handleMovementSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                {/* Stock item */}
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Stock item
                  </span>
                  <PickerField
                    value={movementForm.stock_item ?? ""}
                    options={[
                      { label: "Select stock item", value: "" },
                      ...stockItems.map((record) => ({
                        label: `${record.item_name} - ${
                          locationNameById.get(record.location) ??
                          `#${record.location}`
                        }`,
                        value: String(record.id),
                      })),
                    ]}
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

              {/* Reference note */}
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Reference note
                </span>
                <textarea
                  className={textAreaClassName}
                  value={movementForm.reference_note}
                  onChange={(event) =>
                    setMovementForm((current) => ({
                      ...current,
                      reference_note: event.target.value,
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
        </ModalShell>
      ) : null}
    </div>
  );
}
