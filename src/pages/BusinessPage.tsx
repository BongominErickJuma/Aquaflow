import {
  ImageUp,
  LoaderCircle,
  Pencil,
  Plus,
  Check,
  ChevronDown,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { ModuleTabs } from "../components/layout/ModuleTabs";
import { useAuth } from "../features/auth/AuthProvider";
import { ApiError, resolveApiAssetUrl } from "../lib/api/auth";
import {
  createCompanyProfile,
  deleteKpiRecord,
  deleteLicenseRecord,
  deleteLocationRecord,
  deleteRegistrationInfo,
  deleteStrategicPlanRecord,
  fetchCompanyProfile,
  fetchKpiRecord,
  fetchLicenseRecord,
  fetchLocationRecord,
  fetchRegistrationInfo,
  fetchStrategicPlanRecord,
  updateCompanyProfile,
  updateKpiRecord,
  updateLicenseRecord,
  updateLocationRecord,
  updateRegistrationInfo,
  updateStrategicPlanRecord,
} from "../lib/api/business";
import type {
  CompanyLocationRecord,
  CompanyLocationRecordPayload,
  CompanyProfile,
  KPIRecord,
  KPIRecordPayload,
  LicenseRecord,
  LicenseRecordPayload,
  RegistrationInfo,
  RegistrationInfoPayload,
  StrategicPlanRecord,
  StrategicPlanRecordPayload,
} from "../types/business";

type CompanyFormState = {
  company_name: string;
  trading_name: string;
  email: string;
  phone_number: string;
  tax_identification_number: string;
  registration_number: string;
  description: string;
  mission: string;
  vision: string;
};

const businessMilestoneFlow = [
  {
    id: "business",
    label: "Business",
    footerLabel: "Business",
    detail:
      "Create or review the company profile here before moving into the supporting records.",
  },
  {
    id: "registration",
    label: "Registration",
    footerLabel: "Registration",
    detail:
      "Add or update the legal registration here. Before this, make sure the base business profile exists. Next, move into licenses.",
  },
  {
    id: "licenses",
    label: "Licenses",
    footerLabel: "Licenses",
    detail:
      "Add and edit licenses here. Before this, complete registration. Next, capture business locations.",
  },
  {
    id: "locations",
    label: "Locations",
    footerLabel: "Locations",
    detail:
      "Add and update locations here. Before this, make sure licenses are in place. Next, record KPIs.",
  },
  {
    id: "kpis",
    label: "KPIs",
    footerLabel: "KPIs",
    detail:
      "Store and adjust KPI records here. Before this, confirm the locations are set. Next, add strategic plans.",
  },
  {
    id: "plans",
    label: "Strategic Plans",
    footerLabel: "Plans",
    detail:
      "Capture strategic plans here. Before this, you should have KPI records ready. This is the last business step.",
  },
] as const;

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

function createEmptyCompanyForm(): CompanyFormState {
  return {
    company_name: "",
    trading_name: "",
    email: "",
    phone_number: "",
    tax_identification_number: "",
    registration_number: "",
    description: "",
    mission: "",
    vision: "",
  };
}

function buildCompanyForm(company: CompanyProfile | null): CompanyFormState {
  if (!company) {
    return createEmptyCompanyForm();
  }

  return {
    company_name: company.company_name ?? "",
    trading_name: company.trading_name ?? "",
    email: company.email ?? "",
    phone_number: company.phone_number ?? "",
    tax_identification_number: company.tax_identification_number ?? "",
    registration_number: company.registration_number ?? "",
    description: company.description ?? "",
    mission: company.mission ?? "",
    vision: company.vision ?? "",
  };
}

function createEmptyRegistrationForm(): RegistrationInfoPayload {
  return {
    authority_name: "",
    registration_number: "",
    registration_type: "",
    registration_date: null,
    expiry_date: null,
    notes: "",
  };
}

function buildRegistrationForm(
  record: RegistrationInfo | null,
): RegistrationInfoPayload {
  if (!record) {
    return createEmptyRegistrationForm();
  }

  return {
    authority_name: record.authority_name,
    registration_number: record.registration_number,
    registration_type: record.registration_type,
    registration_date: record.registration_date,
    expiry_date: record.expiry_date,
    notes: record.notes,
  };
}

function createEmptyLicenseForm(): LicenseRecordPayload {
  return {
    license_name: "",
    license_number: "",
    issuing_authority: "",
    issue_date: null,
    expiry_date: null,
    status: "pending",
    notes: "",
  };
}

function buildLicenseForm(record: LicenseRecord | null): LicenseRecordPayload {
  if (!record) {
    return createEmptyLicenseForm();
  }

  return {
    license_name: record.license_name,
    license_number: record.license_number,
    issuing_authority: record.issuing_authority,
    issue_date: record.issue_date,
    expiry_date: record.expiry_date,
    status: record.status,
    notes: record.notes,
  };
}

function createEmptyLocationForm(): CompanyLocationRecordPayload {
  return {
    label: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state_or_district: "",
    country: "Uganda",
    postal_code: "",
    is_head_office: false,
    notes: "",
  };
}

function buildLocationForm(
  record: CompanyLocationRecord | null,
): CompanyLocationRecordPayload {
  if (!record) {
    return createEmptyLocationForm();
  }

  return {
    label: record.label,
    address_line_1: record.address_line_1,
    address_line_2: record.address_line_2,
    city: record.city,
    state_or_district: record.state_or_district,
    country: record.country,
    postal_code: record.postal_code,
    is_head_office: record.is_head_office,
    notes: record.notes,
  };
}

function createEmptyKpiForm(): KPIRecordPayload {
  return {
    name: "",
    value: "",
    unit: "",
    record_date: "",
    notes: "",
  };
}

function buildKpiForm(record: KPIRecord | null): KPIRecordPayload {
  if (!record) {
    return createEmptyKpiForm();
  }

  return {
    name: record.name,
    value: record.value,
    unit: record.unit,
    record_date: record.record_date,
    notes: record.notes,
  };
}

function createEmptyPlanForm(): StrategicPlanRecordPayload {
  return {
    title: "",
    objective: "",
    start_date: null,
    end_date: null,
    status: "draft",
    owner_name: "",
    notes: "",
  };
}

function buildPlanForm(
  record: StrategicPlanRecord | null,
): StrategicPlanRecordPayload {
  if (!record) {
    return createEmptyPlanForm();
  }

  return {
    title: record.title,
    objective: record.objective,
    start_date: record.start_date,
    end_date: record.end_date,
    status: record.status,
    owner_name: record.owner_name,
    notes: record.notes,
  };
}

function toOptionalDate(value: string | null) {
  return value && value.trim() ? value : null;
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
            {filteredOptions.length ? filteredOptions.map((option) => (
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
            )) : (
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

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}

function EmptyState({
  title,
  description,
  action,
  className = "",
}: {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50/70 px-5 py-6 ${className}`.trim()}
    >
      <p className="text-lg font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
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

function formatDate(value: string | null | undefined) {
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
  }).format(parsed);
}

function buildOptionLabel(title: string, meta?: string) {
  return meta ? `${title} - ${meta}` : title;
}

export function BusinessPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { user } = useAuth();
  const isAdmin =
    user?.role.code === "admin" || user?.role.code === "superuser";
  const [activeModal, setActiveModal] = useState<
    | "company"
    | "logo"
    | "registration"
    | "license"
    | "location"
    | "kpi"
    | "plan"
    | null
  >(null);
  const [activeTab, setActiveTab] = useState("business");

  const tabs = businessMilestoneFlow.map(({ id, label }) => ({ id, label }));
  const activeBusinessStep =
    businessMilestoneFlow.find((item) => item.id === activeTab) ??
    businessMilestoneFlow[0];

  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [companyForm, setCompanyForm] = useState<CompanyFormState>(
    createEmptyCompanyForm(),
  );
  const [registrationForm, setRegistrationForm] =
    useState<RegistrationInfoPayload>(createEmptyRegistrationForm());
  const [licenseForm, setLicenseForm] = useState<LicenseRecordPayload>(
    createEmptyLicenseForm(),
  );
  const [locationForm, setLocationForm] =
    useState<CompanyLocationRecordPayload>(createEmptyLocationForm());
  const [kpiForm, setKpiForm] =
    useState<KPIRecordPayload>(createEmptyKpiForm());
  const [planForm, setPlanForm] = useState<StrategicPlanRecordPayload>(
    createEmptyPlanForm(),
  );

  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);

  const [selectedLicenseId, setSelectedLicenseId] = useState<number | null>(
    null,
  );
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(
    null,
  );
  const [selectedKpiId, setSelectedKpiId] = useState<number | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

  const [companyMessage, setCompanyMessage] = useState("");
  const [companyError, setCompanyError] = useState("");
  const [registrationMessage, setRegistrationMessage] = useState("");
  const [registrationError, setRegistrationError] = useState("");
  const [licenseMessage, setLicenseMessage] = useState("");
  const [licenseError, setLicenseError] = useState("");
  const [locationMessage, setLocationMessage] = useState("");
  const [locationError, setLocationError] = useState("");
  const [kpiMessage, setKpiMessage] = useState("");
  const [kpiError, setKpiError] = useState("");
  const [planMessage, setPlanMessage] = useState("");
  const [planError, setPlanError] = useState("");
  const [logoMessage, setLogoMessage] = useState("");
  const [logoError, setLogoError] = useState("");

  const [isCompanyPending, setIsCompanyPending] = useState(false);
  const [isLogoPending, setIsLogoPending] = useState(false);
  const [isRegistrationPending, setIsRegistrationPending] = useState(false);
  const [isLicensePending, setIsLicensePending] = useState(false);
  const [isLocationPending, setIsLocationPending] = useState(false);
  const [isKpiPending, setIsKpiPending] = useState(false);
  const [isPlanPending, setIsPlanPending] = useState(false);

  const closeModal = () => {
    setActiveModal(null);
    setSelectedLicenseId(null);
    setSelectedLocationId(null);
    setSelectedKpiId(null);
    setSelectedPlanId(null);
    setSelectedLogo(null);
    setLicenseForm(createEmptyLicenseForm());
    setLocationForm(createEmptyLocationForm());
    setKpiForm(createEmptyKpiForm());
    setPlanForm(createEmptyPlanForm());
  };

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      setPageError("");

      try {
        const nextCompany = await fetchCompanyProfile();
        if (isMounted) {
          setCompany(nextCompany);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (error instanceof ApiError && error.status === 404) {
          setCompany(null);
        } else if (error instanceof ApiError) {
          setPageError(error.message);
        } else {
          setPageError("Unable to load the business module right now.");
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
    setCompanyForm(buildCompanyForm(company));
  }, [company]);

  useEffect(() => {
    let isMounted = true;

    if (!company?.registration) {
      setRegistrationForm(createEmptyRegistrationForm());
      return;
    }

    const load = async () => {
      try {
        const record = await fetchRegistrationInfo(company.id);
        if (isMounted) {
          setRegistrationForm(buildRegistrationForm(record));
        }
      } catch {
        if (isMounted) {
          setRegistrationForm(buildRegistrationForm(company.registration));
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [company?.id, company?.registration]);

  useEffect(() => {
    let isMounted = true;

    if (!company || !selectedLicenseId) {
      setLicenseForm(createEmptyLicenseForm());
      return;
    }

    const load = async () => {
      try {
        const record = await fetchLicenseRecord(company.id, selectedLicenseId);
        if (isMounted) {
          setLicenseForm(buildLicenseForm(record));
        }
      } catch {
        if (isMounted) {
          setLicenseForm(
            buildLicenseForm(
              company.licenses.find((item) => item.id === selectedLicenseId) ??
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
  }, [company, selectedLicenseId]);

  useEffect(() => {
    let isMounted = true;

    if (!company || !selectedLocationId) {
      setLocationForm(createEmptyLocationForm());
      return;
    }

    const load = async () => {
      try {
        const record = await fetchLocationRecord(
          company.id,
          selectedLocationId,
        );
        if (isMounted) {
          setLocationForm(buildLocationForm(record));
        }
      } catch {
        if (isMounted) {
          setLocationForm(
            buildLocationForm(
              company.locations.find(
                (item) => item.id === selectedLocationId,
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
  }, [company, selectedLocationId]);

  useEffect(() => {
    let isMounted = true;

    if (!company || !selectedKpiId) {
      setKpiForm(createEmptyKpiForm());
      return;
    }

    const load = async () => {
      try {
        const record = await fetchKpiRecord(company.id, selectedKpiId);
        if (isMounted) {
          setKpiForm(buildKpiForm(record));
        }
      } catch {
        if (isMounted) {
          setKpiForm(
            buildKpiForm(
              company.kpis.find((item) => item.id === selectedKpiId) ?? null,
            ),
          );
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [company, selectedKpiId]);

  useEffect(() => {
    let isMounted = true;

    if (!company || !selectedPlanId) {
      setPlanForm(createEmptyPlanForm());
      return;
    }

    const load = async () => {
      try {
        const record = await fetchStrategicPlanRecord(
          company.id,
          selectedPlanId,
        );
        if (isMounted) {
          setPlanForm(buildPlanForm(record));
        }
      } catch {
        if (isMounted) {
          setPlanForm(
            buildPlanForm(
              company.strategic_plans.find(
                (item) => item.id === selectedPlanId,
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
  }, [company, selectedPlanId]);

  const licenseOptions = company?.licenses ?? [];
  const locationOptions = company?.locations ?? [];
  const kpiOptions = company?.kpis ?? [];
  const planOptions = company?.strategic_plans ?? [];
  const buildLicenseOptions = () =>
    licenseOptions.map((record) => ({
      label: buildOptionLabel(record.license_name, record.license_number),
      value: String(record.id),
      searchText: [
        record.license_name,
        record.license_number,
        record.issuing_authority,
        record.status,
      ]
        .filter(Boolean)
        .join(" "),
    }));
  const buildLocationOptions = () =>
    locationOptions.map((record) => ({
      label: buildOptionLabel(record.label, record.city),
      value: String(record.id),
      searchText: [
        record.label,
        record.city,
        record.country,
        record.address_line_1,
        record.state_or_district,
      ]
        .filter(Boolean)
        .join(" "),
    }));
  const buildKpiOptions = () =>
    kpiOptions.map((record) => ({
      label: buildOptionLabel(record.name, record.record_date),
      value: String(record.id),
      searchText: [record.name, record.value, record.unit, record.record_date]
        .filter(Boolean)
        .join(" "),
    }));
  const buildPlanOptions = () =>
    planOptions.map((record) => ({
      label: buildOptionLabel(record.title, record.status),
      value: String(record.id),
      searchText: [
        record.title,
        record.objective,
        record.owner_name,
        record.status,
      ]
        .filter(Boolean)
        .join(" "),
    }));

  const handleCompanySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCompanyMessage("");
    setCompanyError("");
    setIsCompanyPending(true);

    try {
      const payload = {
        company_name: companyForm.company_name.trim(),
        trading_name: companyForm.trading_name.trim(),
        email: companyForm.email.trim(),
        phone_number: companyForm.phone_number.trim(),
        tax_identification_number: companyForm.tax_identification_number.trim(),
        registration_number: companyForm.registration_number.trim(),
        description: companyForm.description.trim(),
        mission: companyForm.mission.trim(),
        vision: companyForm.vision.trim(),
      };

      const nextCompany = company
        ? await updateCompanyProfile(payload)
        : await createCompanyProfile(payload);

      setCompany(nextCompany);
      setCompanyMessage(
        company ? "Company form saved." : "Company profile created.",
      );
      setActiveModal(null);
    } catch (error) {
      setCompanyError(
        error instanceof ApiError
          ? error.message
          : "Unable to save the company form right now.",
      );
    } finally {
      setIsCompanyPending(false);
    }
  };

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedLogo(event.target.files?.[0] ?? null);
    setLogoMessage("");
    setLogoError("");
  };

  const handleLogoUpload = async () => {
    if (!company || !selectedLogo) {
      setLogoError("Choose a file before uploading the logo.");
      return;
    }

    setLogoMessage("");
    setLogoError("");
    setIsLogoPending(true);

    try {
      const payload = new FormData();
      payload.append("company_logo", selectedLogo);
      const nextCompany = await updateCompanyProfile(payload);
      setCompany(nextCompany);
      setSelectedLogo(null);
      setLogoMessage("Logo uploaded.");
      setActiveModal(null);
    } catch (error) {
      setLogoError(
        error instanceof ApiError
          ? error.message
          : "Unable to upload the logo right now.",
      );
    } finally {
      setIsLogoPending(false);
    }
  };

  const handleLogoRemove = async () => {
    if (!company?.company_logo) {
      return;
    }

    setLogoMessage("");
    setLogoError("");
    setIsLogoPending(true);

    try {
      const nextCompany = await updateCompanyProfile({
        remove_company_logo: true,
      });
      setCompany(nextCompany);
      setSelectedLogo(null);
      setLogoMessage("Logo removed.");
      setActiveModal(null);
    } catch (error) {
      setLogoError(
        error instanceof ApiError
          ? error.message
          : "Unable to remove the logo right now.",
      );
    } finally {
      setIsLogoPending(false);
    }
  };

  const handleRegistrationSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!company) {
      return;
    }

    setRegistrationMessage("");
    setRegistrationError("");
    setIsRegistrationPending(true);

    const payload: RegistrationInfoPayload = {
      authority_name: registrationForm.authority_name.trim(),
      registration_number: registrationForm.registration_number.trim(),
      registration_type: registrationForm.registration_type.trim(),
      registration_date: toOptionalDate(registrationForm.registration_date),
      expiry_date: toOptionalDate(registrationForm.expiry_date),
      notes: registrationForm.notes.trim(),
    };

    try {
      if (company.registration) {
        await updateRegistrationInfo(company.id, payload);
        setRegistrationMessage("Registration form saved.");
      } else {
        await updateCompanyProfile({ registration: payload });
        setRegistrationMessage("Registration created.");
      }

      setCompany(await fetchCompanyProfile());
      setActiveModal(null);
    } catch (error) {
      setRegistrationError(
        error instanceof ApiError
          ? error.message
          : "Unable to save registration right now.",
      );
    } finally {
      setIsRegistrationPending(false);
    }
  };

  const handleRegistrationDelete = async () => {
    if (!company?.registration) {
      return;
    }

    setRegistrationMessage("");
    setRegistrationError("");
    setIsRegistrationPending(true);

    try {
      await deleteRegistrationInfo(company.id);
      setCompany(await fetchCompanyProfile());
      setRegistrationForm(createEmptyRegistrationForm());
      setRegistrationMessage("Registration deleted.");
      setActiveModal(null);
    } catch (error) {
      setRegistrationError(
        error instanceof ApiError
          ? error.message
          : "Unable to delete registration right now.",
      );
    } finally {
      setIsRegistrationPending(false);
    }
  };

  const handleLicenseSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!company) {
      return;
    }

    setLicenseMessage("");
    setLicenseError("");
    setIsLicensePending(true);

    const payload: LicenseRecordPayload = {
      license_name: licenseForm.license_name.trim(),
      license_number: licenseForm.license_number.trim(),
      issuing_authority: licenseForm.issuing_authority.trim(),
      issue_date: toOptionalDate(licenseForm.issue_date),
      expiry_date: toOptionalDate(licenseForm.expiry_date),
      status: licenseForm.status,
      notes: licenseForm.notes.trim(),
    };

    try {
      if (selectedLicenseId) {
        await updateLicenseRecord(company.id, selectedLicenseId, payload);
        setLicenseMessage("License form saved.");
        setCompany(await fetchCompanyProfile());
        setActiveModal(null);
      } else {
        const nextCompany = await updateCompanyProfile({
          append_licenses: payload,
        });
        setCompany(nextCompany);
        setLicenseMessage("License created.");
        setActiveModal(null);
      }
    } catch (error) {
      setLicenseError(
        error instanceof ApiError
          ? error.message
          : "Unable to save the license right now.",
      );
    } finally {
      setIsLicensePending(false);
    }
  };

  const handleLicenseDelete = async () => {
    if (!company || !selectedLicenseId) {
      return;
    }

    setLicenseMessage("");
    setLicenseError("");
    setIsLicensePending(true);

    try {
      await deleteLicenseRecord(company.id, selectedLicenseId);
      setCompany(await fetchCompanyProfile());
      setSelectedLicenseId(null);
      setLicenseForm(createEmptyLicenseForm());
      setLicenseMessage("License deleted.");
      setActiveModal(null);
    } catch (error) {
      setLicenseError(
        error instanceof ApiError
          ? error.message
          : "Unable to delete the license right now.",
      );
    } finally {
      setIsLicensePending(false);
    }
  };

  const handleLocationSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!company) {
      return;
    }

    setLocationMessage("");
    setLocationError("");
    setIsLocationPending(true);

    const payload: CompanyLocationRecordPayload = {
      label: locationForm.label.trim(),
      address_line_1: locationForm.address_line_1.trim(),
      address_line_2: locationForm.address_line_2.trim(),
      city: locationForm.city.trim(),
      state_or_district: locationForm.state_or_district.trim(),
      country: locationForm.country.trim() || "Uganda",
      postal_code: locationForm.postal_code.trim(),
      is_head_office: locationForm.is_head_office,
      notes: locationForm.notes.trim(),
    };

    try {
      if (selectedLocationId) {
        await updateLocationRecord(company.id, selectedLocationId, payload);
        setLocationMessage("Location form saved.");
        setCompany(await fetchCompanyProfile());
        setActiveModal(null);
      } else {
        const nextCompany = await updateCompanyProfile({
          append_locations: payload,
        });
        setCompany(nextCompany);
        setLocationMessage("Location created.");
        setActiveModal(null);
      }
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
    if (!company || !selectedLocationId) {
      return;
    }

    setLocationMessage("");
    setLocationError("");
    setIsLocationPending(true);

    try {
      await deleteLocationRecord(company.id, selectedLocationId);
      setCompany(await fetchCompanyProfile());
      setSelectedLocationId(null);
      setLocationForm(createEmptyLocationForm());
      setLocationMessage("Location deleted.");
      setActiveModal(null);
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

  const handleKpiSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!company) {
      return;
    }

    setKpiMessage("");
    setKpiError("");
    setIsKpiPending(true);

    const payload: KPIRecordPayload = {
      name: kpiForm.name.trim(),
      value: kpiForm.value.trim(),
      unit: kpiForm.unit.trim(),
      record_date: kpiForm.record_date,
      notes: kpiForm.notes.trim(),
    };

    try {
      if (selectedKpiId) {
        await updateKpiRecord(company.id, selectedKpiId, payload);
        setKpiMessage("KPI form saved.");
        setCompany(await fetchCompanyProfile());
        setActiveModal(null);
      } else {
        const nextCompany = await updateCompanyProfile({
          append_kpis: payload,
        });
        setCompany(nextCompany);
        setKpiMessage("KPI record created.");
        setActiveModal(null);
      }
    } catch (error) {
      setKpiError(
        error instanceof ApiError
          ? error.message
          : "Unable to save the KPI right now.",
      );
    } finally {
      setIsKpiPending(false);
    }
  };

  const handleKpiDelete = async () => {
    if (!company || !selectedKpiId) {
      return;
    }

    setKpiMessage("");
    setKpiError("");
    setIsKpiPending(true);

    try {
      await deleteKpiRecord(company.id, selectedKpiId);
      setCompany(await fetchCompanyProfile());
      setSelectedKpiId(null);
      setKpiForm(createEmptyKpiForm());
      setKpiMessage("KPI record deleted.");
      setActiveModal(null);
    } catch (error) {
      setKpiError(
        error instanceof ApiError
          ? error.message
          : "Unable to delete the KPI right now.",
      );
    } finally {
      setIsKpiPending(false);
    }
  };

  const handlePlanSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!company) {
      return;
    }

    setPlanMessage("");
    setPlanError("");
    setIsPlanPending(true);

    const payload: StrategicPlanRecordPayload = {
      title: planForm.title.trim(),
      objective: planForm.objective.trim(),
      start_date: toOptionalDate(planForm.start_date),
      end_date: toOptionalDate(planForm.end_date),
      status: planForm.status,
      owner_name: planForm.owner_name.trim(),
      notes: planForm.notes.trim(),
    };

    try {
      if (selectedPlanId) {
        await updateStrategicPlanRecord(company.id, selectedPlanId, payload);
        setPlanMessage("Strategic plan form saved.");
        setCompany(await fetchCompanyProfile());
        setActiveModal(null);
      } else {
        const nextCompany = await updateCompanyProfile({
          append_strategic_plans: payload,
        });
        setCompany(nextCompany);
        setPlanMessage("Strategic plan created.");
        setActiveModal(null);
      }
    } catch (error) {
      setPlanError(
        error instanceof ApiError
          ? error.message
          : "Unable to save the strategic plan right now.",
      );
    } finally {
      setIsPlanPending(false);
    }
  };

  const handlePlanDelete = async () => {
    if (!company || !selectedPlanId) {
      return;
    }

    setPlanMessage("");
    setPlanError("");
    setIsPlanPending(true);

    try {
      await deleteStrategicPlanRecord(company.id, selectedPlanId);
      setCompany(await fetchCompanyProfile());
      setSelectedPlanId(null);
      setPlanForm(createEmptyPlanForm());
      setPlanMessage("Strategic plan deleted.");
      setActiveModal(null);
    } catch (error) {
      setPlanError(
        error instanceof ApiError
          ? error.message
          : "Unable to delete the strategic plan right now.",
      );
    } finally {
      setIsPlanPending(false);
    }
  };

  if (isLoading) {
    return (
      <section className="panel p-8">
        <div className="flex items-center gap-3 text-slate-600">
          <LoaderCircle className="h-5 w-5 animate-spin text-sky-700" />
          Loading business forms...
        </div>
      </section>
    );
  }

  return (
    <div className="module-page">
      {pageError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {pageError}
        </div>
      ) : null}

      {!company ? (
        <section className="rounded-[32px] border border-white/70 bg-[radial-gradient(circle_at_top_left,#ffffff,rgba(224,242,254,0.92)_52%,rgba(240,249,255,0.95))] py-6 pl-6 pr-0 shadow-[0_25px_80px_rgba(148,163,184,0.14)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">
                Business
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-[1.5rem] border border-amber-200 bg-amber-50 text-amber-700">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                    Company profile not created yet
                  </h1>
                  <p className="max-w-2xl text-sm leading-7 text-slate-600">
                    This module becomes useful once the base company record
                    exists. Create it first, then the registration, licenses,
                    locations, KPIs, and plans can sit under the same business
                    profile.
                  </p>
                </div>
              </div>
            </div>
            {isAdmin ? (
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModal("company")}
                  className={primaryButtonClassName}
                >
                  <Plus className="h-4 w-4" />
                  Create company profile
                </button>
              </div>
            ) : null}
          </div>
        </section>
      ) : (
        <>
          <section className="rounded-[32px] border border-white/70 bg-[radial-gradient(circle_at_top_left,#ffffff,rgba(224,242,254,0.92)_52%,rgba(240,249,255,0.95))] py-6 pl-6 pr-0 shadow-[0_25px_80px_rgba(148,163,184,0.14)]">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">
                  Business
                </div>
                <div className="flex items-start gap-4">
                  {company.company_logo ? (
                    <img
                      src={resolveApiAssetUrl(company.company_logo) ?? ""}
                      alt={company.company_name}
                      className="h-20 w-20 rounded-[1.5rem] border border-white/80 object-cover shadow-sm"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-sky-200 bg-white text-2xl font-semibold text-sky-700 shadow-sm">
                      {(company.company_name[0] ?? "I").toUpperCase()}
                    </div>
                  )}
                  <div className="space-y-2">
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                      {company.company_name}
                    </h1>
                    <p className="text-sm text-slate-500">
                      {company.trading_name || "No trading name set"}
                    </p>
                    <p className="max-w-2xl text-sm leading-7 text-slate-600">
                      Keep the company identity, legal record, locations, KPIs,
                      and strategic plans aligned under one business profile.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="hero-metric-card">
                    <p className="hero-metric-label">Licenses</p>
                    <p className="hero-metric-value">
                      {company.licenses.length}
                    </p>
                  </div>
                  <div className="hero-metric-card">
                    <p className="hero-metric-label">Locations</p>
                    <p className="hero-metric-value">
                      {company.locations.length}
                    </p>
                  </div>
                  <div className="hero-metric-card">
                    <p className="hero-metric-label">KPIs</p>
                    <p className="hero-metric-value">{company.kpis.length}</p>
                  </div>
                  <div className="hero-metric-card">
                    <p className="hero-metric-label">Plans</p>
                    <p className="hero-metric-value">
                      {company.strategic_plans.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <ModuleTabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
          />

          <div className="module-page-stage">
            <div className="space-y-6">
              {activeTab === "business" ? (
                <section className="panel p-6">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1 max-w-3xl">
                      <p className="section-label">Business</p>
                      <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                        Company profile
                      </h2>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        Core identity, tax, and directional information for the
                        company.
                      </p>
                    </div>

                    {isAdmin ? (
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => setActiveModal("company")}
                          className={iconButtonClassName}
                          aria-label="Edit company"
                          title="Edit company"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveModal("logo")}
                          className={iconButtonClassName}
                          aria-label="Update logo"
                          title="Update logo"
                        >
                          <ImageUp className="h-4 w-4" />
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <DetailItem
                      label="Company name"
                      value={company.company_name}
                    />
                    <DetailItem
                      label="Trading name"
                      value={company.trading_name || "Not set"}
                    />
                    <DetailItem
                      label="Email"
                      value={company.email || "Not set"}
                    />
                    <DetailItem
                      label="Phone number"
                      value={company.phone_number || "Not set"}
                    />
                    <DetailItem
                      label="TIN"
                      value={company.tax_identification_number || "Not set"}
                    />
                    <DetailItem
                      label="Registration number"
                      value={company.registration_number || "Not set"}
                    />
                    <DetailItem
                      label="Mission"
                      value={company.mission || "Not set"}
                    />
                    <DetailItem
                      label="Vision"
                      value={company.vision || "Not set"}
                    />
                    <DetailItem
                      label="Registration status"
                      value={
                        company.registration
                          ? "Registration record available"
                          : "Registration record not added"
                      }
                    />
                  </div>

                  <div className="mt-4">
                    <DetailItem
                      label="Description"
                      value={company.description || "No description recorded"}
                    />
                  </div>
                </section>
              ) : null}

              {activeTab === "registration" ? (
                <section className="panel p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="section-label">Registration</p>
                      <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                        Legal record
                      </h2>
                    </div>
                    {isAdmin ? (
                      <button
                        type="button"
                        onClick={() => setActiveModal("registration")}
                        className={iconButtonClassName}
                        aria-label={
                          company.registration
                            ? "Edit registration"
                            : "Add registration"
                        }
                        title={
                          company.registration
                            ? "Edit registration"
                            : "Add registration"
                        }
                      >
                        {company.registration ? (
                          <Pencil className="h-4 w-4" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </button>
                    ) : null}
                  </div>

                  {company.registration ? (
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <DetailItem
                        label="Authority"
                        value={company.registration.authority_name}
                      />
                      <DetailItem
                        label="Type"
                        value={company.registration.registration_type}
                      />
                      <DetailItem
                        label="Number"
                        value={company.registration.registration_number}
                      />
                      <DetailItem
                        label="Expiry"
                        value={formatDate(company.registration.expiry_date)}
                      />
                      <div className="md:col-span-2">
                        <DetailItem
                          label="Notes"
                          value={
                            company.registration.notes || "No notes recorded"
                          }
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="mt-5">
                      <EmptyState
                        title="No registration record"
                        description="Add the company registration so the legal record is visible here."
                      />
                    </div>
                  )}
                </section>
              ) : null}

              {activeTab === "licenses" ? (
                <section className="panel p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="section-label">Licenses</p>
                      <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                        Business licenses
                      </h2>
                    </div>
                    {isAdmin ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLicenseId(null);
                          setLicenseForm(createEmptyLicenseForm());
                          setActiveModal("license");
                        }}
                        className={iconButtonClassName}
                        aria-label="Add license"
                        title="Add license"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>

                  <div className="scrollbar-hidden mt-5 flex gap-3 overflow-x-auto pb-2">
                    {licenseOptions.length === 0 ? (
                      <EmptyState
                        title="No licenses yet"
                        description="Add operational and regulatory licenses here."
                        className={`${recordCardClassName} justify-center`}
                      />
                    ) : (
                      licenseOptions.map((record) => (
                        <div key={record.id} className={recordCardClassName}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto pr-14">
                              <p className="font-semibold text-slate-900">
                                {record.license_name}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                {record.license_number} /{" "}
                                {record.issuing_authority}
                              </p>
                              <p className="mt-2 text-sm text-slate-600">
                                Issued {formatDate(record.issue_date)} / Expires{" "}
                                {formatDate(record.expiry_date)}
                              </p>
                            </div>
                            {isAdmin ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedLicenseId(record.id);
                                  setActiveModal("license");
                                }}
                                className={recordEditButtonClassName}
                                aria-label={`Edit ${record.license_name}`}
                                title={`Edit ${record.license_name}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            ) : null}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              ) : null}
            </div>

            <div className="space-y-6">
              {activeTab === "locations" ? (
                <section className="panel p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="section-label">Locations</p>
                      <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                        Business locations
                      </h2>
                    </div>
                    {isAdmin ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLocationId(null);
                          setLocationForm(createEmptyLocationForm());
                          setActiveModal("location");
                        }}
                        className={iconButtonClassName}
                        aria-label="Add location"
                        title="Add location"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>

                  <div className="scrollbar-hidden mt-5 flex gap-3 overflow-x-auto pb-2">
                    {locationOptions.length === 0 ? (
                      <EmptyState
                        title="No locations yet"
                        description="Add head office, production site, and branch locations here."
                        className={`${recordCardClassName} justify-center`}
                      />
                    ) : (
                      locationOptions.map((record) => (
                        <div key={record.id} className={recordCardClassName}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto pr-14">
                              <p className="font-semibold text-slate-900">
                                {record.label}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                {record.address_line_1}
                              </p>
                              <p className="mt-2 text-sm text-slate-600">
                                {[
                                  record.city,
                                  record.state_or_district,
                                  record.country,
                                ]
                                  .filter(Boolean)
                                  .join(", ")}
                              </p>
                            </div>
                            {isAdmin ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedLocationId(record.id);
                                  setActiveModal("location");
                                }}
                                className={recordEditButtonClassName}
                                aria-label={`Edit ${record.label}`}
                                title={`Edit ${record.label}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            ) : null}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              ) : null}

              {activeTab === "kpis" ? (
                <section className="panel p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="section-label">KPIs</p>
                      <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                        KPI history
                      </h2>
                    </div>
                    {isAdmin ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedKpiId(null);
                          setKpiForm(createEmptyKpiForm());
                          setActiveModal("kpi");
                        }}
                        className={iconButtonClassName}
                        aria-label="Add KPI"
                        title="Add KPI"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>

                  <div className="scrollbar-hidden mt-5 flex gap-3 overflow-x-auto pb-2">
                    {kpiOptions.length === 0 ? (
                      <EmptyState
                        title="No KPI records yet"
                        description="Store top-level business performance entries here."
                        className={`${recordCardClassName} justify-center`}
                      />
                    ) : (
                      kpiOptions.map((record) => (
                        <div key={record.id} className={recordCardClassName}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto pr-14">
                              <p className="font-semibold text-slate-900">
                                {record.name}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                {record.value} {record.unit || ""}
                              </p>
                              <p className="mt-2 text-sm text-slate-600">
                                Recorded {formatDate(record.record_date)}
                              </p>
                            </div>
                            {isAdmin ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedKpiId(record.id);
                                  setActiveModal("kpi");
                                }}
                                className={recordEditButtonClassName}
                                aria-label={`Edit ${record.name}`}
                                title={`Edit ${record.name}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            ) : null}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              ) : null}
            </div>

            {activeTab === "plans" ? (
              <section className="panel p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="section-label">Strategic Plans</p>
                    <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                      Strategy and expansion
                    </h2>
                  </div>
                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPlanId(null);
                        setPlanForm(createEmptyPlanForm());
                        setActiveModal("plan");
                      }}
                      className={iconButtonClassName}
                      aria-label="Add strategic plan"
                      title="Add strategic plan"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                <div className="scrollbar-hidden mt-5 flex gap-3 overflow-x-auto pb-2">
                  {planOptions.length === 0 ? (
                    <EmptyState
                      title="No strategic plans yet"
                      description="Add business goals, ownership, and status tracking here."
                      className={`${recordCardClassName} justify-center`}
                    />
                  ) : (
                    planOptions.map((record) => (
                      <div key={record.id} className={recordCardClassName}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto pr-14">
                            <p className="font-semibold text-slate-900">
                              {record.title}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {record.status}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              {record.objective}
                            </p>
                          </div>
                          {isAdmin ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPlanId(record.id);
                                setActiveModal("plan");
                              }}
                              className={recordEditButtonClassName}
                              aria-label={`Edit ${record.title}`}
                              title={`Edit ${record.title}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            ) : null}
          </div>
          {activeTab !== "business" ? (
            <footer className="panel px-4 py-3">
              <p className="text-sm leading-6 text-slate-600">
                <span className="font-semibold text-sky-700">
                  {activeBusinessStep.footerLabel}
                </span>{" "}
                {activeBusinessStep.detail}
              </p>
            </footer>
          ) : null}
        </>
      )}

      <>
        {activeModal === "company" ? (
          <ModalShell
            title={company ? "Edit company" : "Create company"}
            onClose={closeModal}
          >
            <FormPanel
              label="Company"
              title={company ? "Company form" : "Create company form"}
            >
              <form className="space-y-4" onSubmit={handleCompanySubmit}>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Company name
                  </span>
                  <input
                    className={fieldClassName}
                    value={companyForm.company_name}
                    onChange={(event) =>
                      setCompanyForm((current) => ({
                        ...current,
                        company_name: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      Trading name
                    </span>
                    <input
                      className={fieldClassName}
                      value={companyForm.trading_name}
                      onChange={(event) =>
                        setCompanyForm((current) => ({
                          ...current,
                          trading_name: event.target.value,
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
                      value={companyForm.email}
                      onChange={(event) =>
                        setCompanyForm((current) => ({
                          ...current,
                          email: event.target.value,
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
                      value={companyForm.phone_number}
                      onChange={(event) =>
                        setCompanyForm((current) => ({
                          ...current,
                          phone_number: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      TIN
                    </span>
                    <input
                      className={fieldClassName}
                      value={companyForm.tax_identification_number}
                      onChange={(event) =>
                        setCompanyForm((current) => ({
                          ...current,
                          tax_identification_number: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Registration number
                  </span>
                  <input
                    className={fieldClassName}
                    value={companyForm.registration_number}
                    onChange={(event) =>
                      setCompanyForm((current) => ({
                        ...current,
                        registration_number: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Description
                  </span>
                  <textarea
                    className={textAreaClassName}
                    value={companyForm.description}
                    onChange={(event) =>
                      setCompanyForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                  />
                </label>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      Mission
                    </span>
                    <textarea
                      className={textAreaClassName}
                      value={companyForm.mission}
                      onChange={(event) =>
                        setCompanyForm((current) => ({
                          ...current,
                          mission: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      Vision
                    </span>
                    <textarea
                      className={textAreaClassName}
                      value={companyForm.vision}
                      onChange={(event) =>
                        setCompanyForm((current) => ({
                          ...current,
                          vision: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
                <FieldMessage message={companyError} tone="error" />
                <FieldMessage message={companyMessage} tone="success" />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isCompanyPending}
                    className={primaryButtonClassName}
                  >
                    {isCompanyPending ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Saving
                      </>
                    ) : company ? (
                      "Save company form"
                    ) : (
                      "Create company"
                    )}
                  </button>
                </div>
              </form>
            </FormPanel>
          </ModalShell>
        ) : null}

        {activeModal === "logo" ? (
          <ModalShell title="Company logo" onClose={closeModal}>
            <FormPanel label="Logo" title="Company logo form">
              <div className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-200 bg-sky-100 text-sky-700">
                  <ImageUp className="h-5 w-5" />
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleLogoChange}
                />
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!company}
                    className={secondaryButtonClassName}
                  >
                    Choose file
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleLogoUpload()}
                    disabled={!company || isLogoPending || !selectedLogo}
                    className={primaryButtonClassName}
                  >
                    {isLogoPending ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Uploading
                      </>
                    ) : (
                      "Upload logo"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleLogoRemove()}
                    disabled={!company?.company_logo || isLogoPending}
                    className={dangerButtonClassName}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove logo
                  </button>
                </div>
                <FieldMessage message={logoError} tone="error" />
                <FieldMessage message={logoMessage} tone="success" />
              </div>
            </FormPanel>
          </ModalShell>
        ) : null}

        {activeModal === "registration" ? (
          <ModalShell title="Registration" onClose={closeModal}>
            <FormPanel label="Registration" title="Registration form">
              <form className="space-y-4" onSubmit={handleRegistrationSubmit}>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Authority name
                  </span>
                  <input
                    className={fieldClassName}
                    value={registrationForm.authority_name}
                    onChange={(event) =>
                      setRegistrationForm((current) => ({
                        ...current,
                        authority_name: event.target.value,
                      }))
                    }
                    disabled={!company}
                    required
                  />
                </label>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      Registration number
                    </span>
                    <input
                      className={fieldClassName}
                      value={registrationForm.registration_number}
                      onChange={(event) =>
                        setRegistrationForm((current) => ({
                          ...current,
                          registration_number: event.target.value,
                        }))
                      }
                      disabled={!company}
                      required
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      Registration type
                    </span>
                    <input
                      className={fieldClassName}
                      value={registrationForm.registration_type}
                      onChange={(event) =>
                        setRegistrationForm((current) => ({
                          ...current,
                          registration_type: event.target.value,
                        }))
                      }
                      disabled={!company}
                      required
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      Registration date
                    </span>
                    <input
                      type="date"
                      className={fieldClassName}
                      value={registrationForm.registration_date ?? ""}
                      onChange={(event) =>
                        setRegistrationForm((current) => ({
                          ...current,
                          registration_date: event.target.value || null,
                        }))
                      }
                      disabled={!company}
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      Expiry date
                    </span>
                    <input
                      type="date"
                      className={fieldClassName}
                      value={registrationForm.expiry_date ?? ""}
                      onChange={(event) =>
                        setRegistrationForm((current) => ({
                          ...current,
                          expiry_date: event.target.value || null,
                        }))
                      }
                      disabled={!company}
                    />
                  </label>
                </div>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Notes
                  </span>
                  <textarea
                    className={textAreaClassName}
                    value={registrationForm.notes}
                    onChange={(event) =>
                      setRegistrationForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    disabled={!company}
                  />
                </label>
                <FieldMessage message={registrationError} tone="error" />
                <FieldMessage message={registrationMessage} tone="success" />
                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => void handleRegistrationDelete()}
                    disabled={!company?.registration || isRegistrationPending}
                    className={dangerButtonClassName}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete registration
                  </button>
                  <button
                    type="submit"
                    disabled={!company || isRegistrationPending}
                    className={primaryButtonClassName}
                  >
                    {isRegistrationPending ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Saving
                      </>
                    ) : (
                      "Save registration"
                    )}
                  </button>
                </div>
              </form>
            </FormPanel>
          </ModalShell>
        ) : null}

        {activeModal === "license" ? (
          <ModalShell
            title={selectedLicenseId ? "Edit license" : "Add license"}
            onClose={closeModal}
          >
            <FormPanel label="Licenses" title="License form">
              <form className="space-y-4" onSubmit={handleLicenseSubmit}>
                {/* Existing license */}
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Existing license
                  </span>
                  <PickerField
                    value={selectedLicenseId ? String(selectedLicenseId) : ""}
                    options={[
                      { label: "Create new license", value: "" },
                      ...buildLicenseOptions(),
                    ]}
                    searchable
                    searchPlaceholder="Search licenses"
                    onChange={(value) =>
                      setSelectedLicenseId(value ? Number(value) : null)
                    }
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  {/* License name */}
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      License name
                    </span>
                    <input
                      className={fieldClassName}
                      value={licenseForm.license_name}
                      onChange={(event) =>
                        setLicenseForm((current) => ({
                          ...current,
                          license_name: event.target.value,
                        }))
                      }
                      disabled={!company}
                      required
                    />
                  </label>

                  {/* License number */}
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      License number
                    </span>
                    <input
                      className={fieldClassName}
                      value={licenseForm.license_number}
                      onChange={(event) =>
                        setLicenseForm((current) => ({
                          ...current,
                          license_number: event.target.value,
                        }))
                      }
                      disabled={!company}
                      required
                    />
                  </label>

                  {/* Issuing authority */}
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      Issuing authority
                    </span>
                    <input
                      className={fieldClassName}
                      value={licenseForm.issuing_authority}
                      onChange={(event) =>
                        setLicenseForm((current) => ({
                          ...current,
                          issuing_authority: event.target.value,
                        }))
                      }
                      disabled={!company}
                      required
                    />
                  </label>

                  {/* Status */}
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      Status
                    </span>
                    <PickerField
                      value={licenseForm.status}
                      options={[
                        { label: "Pending", value: "pending" },
                        { label: "Active", value: "active" },
                        { label: "Expired", value: "expired" },
                      ]}
                      onChange={(value) =>
                        setLicenseForm((current) => ({
                          ...current,
                          status: value as LicenseRecordPayload["status"],
                        }))
                      }
                    />
                  </label>

                  {/* Issue date */}
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      Issue date
                    </span>
                    <input
                      type="date"
                      className={fieldClassName}
                      value={licenseForm.issue_date ?? ""}
                      onChange={(event) =>
                        setLicenseForm((current) => ({
                          ...current,
                          issue_date: event.target.value || null,
                        }))
                      }
                      disabled={!company}
                    />
                  </label>

                  {/* Expiry date */}
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      Expiry date
                    </span>
                    <input
                      type="date"
                      className={fieldClassName}
                      value={licenseForm.expiry_date ?? ""}
                      onChange={(event) =>
                        setLicenseForm((current) => ({
                          ...current,
                          expiry_date: event.target.value || null,
                        }))
                      }
                      disabled={!company}
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
                    value={licenseForm.notes}
                    onChange={(event) =>
                      setLicenseForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    disabled={!company}
                  />
                </label>

                <FieldMessage message={licenseError} tone="error" />
                <FieldMessage message={licenseMessage} tone="success" />

                {/* Buttons */}
                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLicenseId(null);
                      setLicenseForm(createEmptyLicenseForm());
                    }}
                    disabled={isLicensePending}
                    className={secondaryButtonClassName}
                  >
                    Reset form
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleLicenseDelete()}
                    disabled={!selectedLicenseId || isLicensePending}
                    className={dangerButtonClassName}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete selected
                  </button>

                  <button
                    type="submit"
                    disabled={!company || isLicensePending}
                    className={primaryButtonClassName}
                  >
                    {isLicensePending ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Saving
                      </>
                    ) : (
                      "Save license"
                    )}
                  </button>
                </div>
              </form>
            </FormPanel>
          </ModalShell>
        ) : null}

        {activeModal === "location" ? (
          <ModalShell
            title={selectedLocationId ? "Edit location" : "Add location"}
            onClose={closeModal}
          >
            <FormPanel label="Locations" title="Location form">
              <form className="space-y-4" onSubmit={handleLocationSubmit}>
                {/* Existing location */}
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Existing location
                  </span>
                  <PickerField
                    value={selectedLocationId ? String(selectedLocationId) : ""}
                    options={[
                      { label: "Create new location", value: "" },
                      ...buildLocationOptions(),
                    ]}
                    searchable
                    searchPlaceholder="Search locations"
                    onChange={(value) =>
                      setSelectedLocationId(value ? Number(value) : null)
                    }
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  {/* Label */}
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      Label
                    </span>
                    <input
                      className={fieldClassName}
                      value={locationForm.label}
                      onChange={(event) =>
                        setLocationForm((current) => ({
                          ...current,
                          label: event.target.value,
                        }))
                      }
                      disabled={!company}
                      required
                    />
                  </label>

                  {/* City */}
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      City
                    </span>
                    <input
                      className={fieldClassName}
                      value={locationForm.city}
                      onChange={(event) =>
                        setLocationForm((current) => ({
                          ...current,
                          city: event.target.value,
                        }))
                      }
                      disabled={!company}
                      required
                    />
                  </label>
                </div>

                {/* Address line 1 */}
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Address line 1
                  </span>
                  <input
                    className={fieldClassName}
                    value={locationForm.address_line_1}
                    onChange={(event) =>
                      setLocationForm((current) => ({
                        ...current,
                        address_line_1: event.target.value,
                      }))
                    }
                    disabled={!company}
                    required
                  />
                </label>

                {/* Address line 2 */}
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Address line 2
                  </span>
                  <input
                    className={fieldClassName}
                    value={locationForm.address_line_2}
                    onChange={(event) =>
                      setLocationForm((current) => ({
                        ...current,
                        address_line_2: event.target.value,
                      }))
                    }
                    disabled={!company}
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  {/* State */}
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      State or district
                    </span>
                    <input
                      className={fieldClassName}
                      value={locationForm.state_or_district}
                      onChange={(event) =>
                        setLocationForm((current) => ({
                          ...current,
                          state_or_district: event.target.value,
                        }))
                      }
                      disabled={!company}
                    />
                  </label>

                  {/* Country */}
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      Country
                    </span>
                    <input
                      className={fieldClassName}
                      value={locationForm.country}
                      onChange={(event) =>
                        setLocationForm((current) => ({
                          ...current,
                          country: event.target.value,
                        }))
                      }
                      disabled={!company}
                    />
                  </label>
                </div>

                {/* Postal code */}
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Postal code
                  </span>
                  <input
                    className={fieldClassName}
                    value={locationForm.postal_code}
                    onChange={(event) =>
                      setLocationForm((current) => ({
                        ...current,
                        postal_code: event.target.value,
                      }))
                    }
                    disabled={!company}
                  />
                </label>

                {/* Head office */}
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={locationForm.is_head_office}
                    onChange={(event) =>
                      setLocationForm((current) => ({
                        ...current,
                        is_head_office: event.target.checked,
                      }))
                    }
                    disabled={!company}
                  />
                  Mark as head office
                </label>

                {/* Notes */}
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Notes
                  </span>
                  <textarea
                    className={textAreaClassName}
                    value={locationForm.notes}
                    onChange={(event) =>
                      setLocationForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    disabled={!company}
                  />
                </label>

                <FieldMessage message={locationError} tone="error" />
                <FieldMessage message={locationMessage} tone="success" />

                {/* Buttons */}
                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLocationId(null);
                      setLocationForm(createEmptyLocationForm());
                    }}
                    disabled={isLocationPending}
                    className={secondaryButtonClassName}
                  >
                    Reset form
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleLocationDelete()}
                    disabled={!selectedLocationId || isLocationPending}
                    className={dangerButtonClassName}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete selected
                  </button>

                  <button
                    type="submit"
                    disabled={!company || isLocationPending}
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

        {activeModal === "kpi" ? (
          <ModalShell
            title={selectedKpiId ? "Edit KPI" : "Add KPI"}
            onClose={closeModal}
          >
            <FormPanel label="KPIs" title="KPI form">
              <form className="space-y-4" onSubmit={handleKpiSubmit}>
                {/* Existing KPI */}
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Existing KPI
                  </span>
                  <PickerField
                    value={selectedKpiId ? String(selectedKpiId) : ""}
                    options={[
                      { label: "Create new KPI record", value: "" },
                      ...buildKpiOptions(),
                    ]}
                    searchable
                    searchPlaceholder="Search KPIs"
                    onChange={(value) =>
                      setSelectedKpiId(value ? Number(value) : null)
                    }
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  {/* Name */}
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      Name
                    </span>
                    <input
                      className={fieldClassName}
                      value={kpiForm.name}
                      onChange={(event) =>
                        setKpiForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      disabled={!company}
                      required
                    />
                  </label>

                  {/* Value */}
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      Value
                    </span>
                    <input
                      className={fieldClassName}
                      value={kpiForm.value}
                      onChange={(event) =>
                        setKpiForm((current) => ({
                          ...current,
                          value: event.target.value,
                        }))
                      }
                      disabled={!company}
                      required
                    />
                  </label>

                  {/* Unit */}
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      Unit
                    </span>
                    <input
                      className={fieldClassName}
                      value={kpiForm.unit}
                      onChange={(event) =>
                        setKpiForm((current) => ({
                          ...current,
                          unit: event.target.value,
                        }))
                      }
                      disabled={!company}
                    />
                  </label>

                  {/* Record date */}
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      Record date
                    </span>
                    <input
                      type="date"
                      className={fieldClassName}
                      value={kpiForm.record_date}
                      onChange={(event) =>
                        setKpiForm((current) => ({
                          ...current,
                          record_date: event.target.value,
                        }))
                      }
                      disabled={!company}
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
                    value={kpiForm.notes}
                    onChange={(event) =>
                      setKpiForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    disabled={!company}
                  />
                </label>

                <FieldMessage message={kpiError} tone="error" />
                <FieldMessage message={kpiMessage} tone="success" />

                {/* Buttons */}
                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedKpiId(null);
                      setKpiForm(createEmptyKpiForm());
                    }}
                    disabled={isKpiPending}
                    className={secondaryButtonClassName}
                  >
                    Reset form
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleKpiDelete()}
                    disabled={!selectedKpiId || isKpiPending}
                    className={dangerButtonClassName}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete selected
                  </button>

                  <button
                    type="submit"
                    disabled={!company || isKpiPending}
                    className={primaryButtonClassName}
                  >
                    {isKpiPending ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Saving
                      </>
                    ) : (
                      "Save KPI"
                    )}
                  </button>
                </div>
              </form>
            </FormPanel>
          </ModalShell>
        ) : null}

        {activeModal === "plan" ? (
          <ModalShell
            title={
              selectedPlanId ? "Edit strategic plan" : "Add strategic plan"
            }
            onClose={closeModal}
          >
            <FormPanel label="Strategic Plans" title="Strategic plan form">
              <form className="space-y-4" onSubmit={handlePlanSubmit}>
                {/* Existing plan */}
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Existing plan
                  </span>
                  <PickerField
                    value={selectedPlanId ? String(selectedPlanId) : ""}
                    options={[
                      { label: "Create new strategic plan", value: "" },
                      ...buildPlanOptions(),
                    ]}
                    searchable
                    searchPlaceholder="Search plans"
                    onChange={(value) =>
                      setSelectedPlanId(value ? Number(value) : null)
                    }
                  />
                </label>

                {/* Title */}
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Title
                  </span>
                  <input
                    className={fieldClassName}
                    value={planForm.title}
                    onChange={(event) =>
                      setPlanForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    disabled={!company}
                    required
                  />
                </label>

                {/* Objective */}
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    Objective
                  </span>
                  <textarea
                    className={textAreaClassName}
                    value={planForm.objective}
                    onChange={(event) =>
                      setPlanForm((current) => ({
                        ...current,
                        objective: event.target.value,
                      }))
                    }
                    disabled={!company}
                    required
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  {/* Owner */}
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      Owner name
                    </span>
                    <input
                      className={fieldClassName}
                      value={planForm.owner_name}
                      onChange={(event) =>
                        setPlanForm((current) => ({
                          ...current,
                          owner_name: event.target.value,
                        }))
                      }
                      disabled={!company}
                    />
                  </label>

                  {/* Status */}
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      Status
                    </span>
                    <PickerField
                      value={planForm.status}
                      options={[
                        { label: "Draft", value: "draft" },
                        { label: "Active", value: "active" },
                        { label: "Completed", value: "completed" },
                      ]}
                      onChange={(value) =>
                        setPlanForm((current) => ({
                          ...current,
                          status: value as StrategicPlanRecordPayload["status"],
                        }))
                      }
                    />
                  </label>

                  {/* Start date */}
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      Start date
                    </span>
                    <input
                      type="date"
                      className={fieldClassName}
                      value={planForm.start_date ?? ""}
                      onChange={(event) =>
                        setPlanForm((current) => ({
                          ...current,
                          start_date: event.target.value || null,
                        }))
                      }
                      disabled={!company}
                    />
                  </label>

                  {/* End date */}
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      End date
                    </span>
                    <input
                      type="date"
                      className={fieldClassName}
                      value={planForm.end_date ?? ""}
                      onChange={(event) =>
                        setPlanForm((current) => ({
                          ...current,
                          end_date: event.target.value || null,
                        }))
                      }
                      disabled={!company}
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
                    value={planForm.notes}
                    onChange={(event) =>
                      setPlanForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    disabled={!company}
                  />
                </label>

                <FieldMessage message={planError} tone="error" />
                <FieldMessage message={planMessage} tone="success" />

                {/* Buttons */}
                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPlanId(null);
                      setPlanForm(createEmptyPlanForm());
                    }}
                    disabled={isPlanPending}
                    className={secondaryButtonClassName}
                  >
                    Reset form
                  </button>

                  <button
                    type="button"
                    onClick={() => void handlePlanDelete()}
                    disabled={!selectedPlanId || isPlanPending}
                    className={dangerButtonClassName}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete selected
                  </button>

                  <button
                    type="submit"
                    disabled={!company || isPlanPending}
                    className={primaryButtonClassName}
                  >
                    {isPlanPending ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Saving
                      </>
                    ) : (
                      "Save plan"
                    )}
                  </button>
                </div>
              </form>
            </FormPanel>
          </ModalShell>
        ) : null}
      </>
    </div>
  );
}
