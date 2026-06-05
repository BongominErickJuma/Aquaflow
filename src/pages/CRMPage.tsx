import {
  BriefcaseBusiness,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  Edit3,
  Handshake,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import {
  Children,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { ApiError, fetchAllUsers } from "../lib/api/auth";
import {
  activitiesApi,
  casesApi,
  contactsApi,
  fetchCRMSummary,
  leadsApi,
  opportunitiesApi,
} from "../lib/api/crm";
import { fetchClients } from "../lib/api/sales";
import type { AdminUser } from "../types/auth";
import type {
  ActivityStatus,
  ActivityType,
  CasePriority,
  CaseStatus,
  CRMActivity,
  CRMActivityPayload,
  CRMSummary,
  Contact,
  ContactPayload,
  CustomerCase,
  CustomerCasePayload,
  InterestLevel,
  Lead,
  LeadPayload,
  LeadStatus,
  Opportunity,
  OpportunityPayload,
  OpportunityStage,
} from "../types/crm";
import type { ClientRecord } from "../types/sales";

type CRMTab = "leads" | "opportunities" | "activities" | "contacts" | "cases";
type Editor =
  | { type: "lead"; record?: Lead }
  | { type: "opportunity"; record?: Opportunity }
  | { type: "activity"; record?: CRMActivity }
  | { type: "contact"; record?: Contact }
  | { type: "case"; record?: CustomerCase };

const fieldClassName =
  "w-full rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300";
const textAreaClassName = `${fieldClassName} min-h-[108px] resize-y leading-6`;
const secondaryButtonClassName =
  "modal-icon-button modal-icon-button-secondary";
const primaryButtonClassName =
  "modal-icon-button modal-icon-button-primary";

const emptySummary: CRMSummary = {
  leads_total: 0,
  leads_new: 0,
  leads_overdue_followups: 0,
  opportunities_open: 0,
  opportunities_won: 0,
  pipeline_value: 0,
  activities_due: 0,
  cases_open: 0,
  cases_urgent: 0,
};

const emptyLead: LeadPayload = {
  company_name: "",
  contact_person: "",
  email: "",
  phone_number: "",
  source: "",
  status: "new",
  interest_level: "medium",
  estimated_value: "0.00",
  next_follow_up_date: null,
  assigned_to: null,
  converted_client: null,
  notes: "",
};

const emptyOpportunity: OpportunityPayload = {
  title: "",
  client: null,
  lead: null,
  stage: "prospecting",
  value: "0.00",
  probability: 50,
  expected_close_date: null,
  assigned_to: null,
  notes: "",
};

const emptyActivity: CRMActivityPayload = {
  subject: "",
  activity_type: "call",
  status: "open",
  due_at: null,
  client: null,
  lead: null,
  opportunity: null,
  assigned_to: null,
  notes: "",
};

const emptyContact: ContactPayload = {
  client: null,
  lead: null,
  full_name: "",
  role_title: "",
  email: "",
  phone_number: "",
  is_primary: false,
  notes: "",
};

const emptyCase: CustomerCasePayload = {
  title: "",
  client: null,
  contact: null,
  status: "open",
  priority: "medium",
  assigned_to: null,
  description: "",
  resolution_notes: "",
};

function formatCurrency(value: string | number) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatDate(value: string | null) {
  if (!value) return "Not set";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function labelize(value: string) {
  return value.replaceAll("_", " ");
}

function optionalId(value: string) {
  return value ? Number(value) : null;
}

function compactDateTime(value: string | null) {
  if (!value) return "";
  return value.slice(0, 16);
}

function normalizeDateTime(value: string) {
  return value ? new Date(value).toISOString() : null;
}

function getRelationName(record: {
  client_name?: string;
  lead_name?: string;
  opportunity_title?: string;
}) {
  return (
    record.client_name ||
    record.lead_name ||
    record.opportunity_title ||
    "Unlinked"
  );
}

export function CRMPage() {
  const [activeTab, setActiveTab] = useState<CRMTab>("leads");
  const [summary, setSummary] = useState<CRMSummary>(emptySummary);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [activities, setActivities] = useState<CRMActivity[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [cases, setCases] = useState<CustomerCase[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState<Editor | null>(null);
  const [actionId, setActionId] = useState<string | number | null>(null);

  const [leadForm, setLeadForm] = useState<LeadPayload>(emptyLead);
  const [opportunityForm, setOpportunityForm] =
    useState<OpportunityPayload>(emptyOpportunity);
  const [activityForm, setActivityForm] =
    useState<CRMActivityPayload>(emptyActivity);
  const [contactForm, setContactForm] = useState<ContactPayload>(emptyContact);
  const [caseForm, setCaseForm] = useState<CustomerCasePayload>(emptyCase);

  const loadCRM = async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError("");

    try {
      const [
        nextSummary,
        nextLeads,
        nextOpportunities,
        nextActivities,
        nextContacts,
        nextCases,
        nextClients,
        nextUsers,
      ] = await Promise.all([
        fetchCRMSummary(),
        leadsApi.list(),
        opportunitiesApi.list(),
        activitiesApi.list(),
        contactsApi.list(),
        casesApi.list(),
        fetchClients(),
        fetchAllUsers(),
      ]);
      setSummary(nextSummary);
      setLeads(nextLeads);
      setOpportunities(nextOpportunities);
      setActivities(nextActivities);
      setContacts(nextContacts);
      setCases(nextCases);
      setClients(nextClients);
      setUsers(nextUsers);
    } catch (nextError) {
      setError(
        nextError instanceof ApiError
          ? nextError.message
          : "Unable to load CRM data right now.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void loadCRM();
  }, []);

  const tabCounts = {
    leads: leads.length,
    opportunities: opportunities.length,
    activities: activities.length,
    contacts: contacts.length,
    cases: cases.length,
  };

  const normalizedSearch = search.trim().toLowerCase();

  const filteredLeads = useMemo(
    () =>
      leads.filter((lead) =>
        [
          lead.company_name,
          lead.contact_person,
          lead.email,
          lead.phone_number,
          lead.source,
          lead.status,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch),
      ),
    [leads, normalizedSearch],
  );

  const filteredOpportunities = useMemo(
    () =>
      opportunities.filter((opportunity) =>
        [
          opportunity.title,
          opportunity.client_name,
          opportunity.lead_name,
          opportunity.stage,
          opportunity.assigned_to_name,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch),
      ),
    [normalizedSearch, opportunities],
  );

  const filteredActivities = useMemo(
    () =>
      activities.filter((activity) =>
        [
          activity.subject,
          activity.activity_type,
          activity.status,
          activity.client_name,
          activity.lead_name,
          activity.opportunity_title,
          activity.assigned_to_name,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch),
      ),
    [activities, normalizedSearch],
  );

  const filteredContacts = useMemo(
    () =>
      contacts.filter((contact) =>
        [
          contact.full_name,
          contact.role_title,
          contact.email,
          contact.phone_number,
          contact.client_name,
          contact.lead_name,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch),
      ),
    [contacts, normalizedSearch],
  );

  const filteredCases = useMemo(
    () =>
      cases.filter((crmCase) =>
        [
          crmCase.title,
          crmCase.client_name,
          crmCase.contact_name,
          crmCase.status,
          crmCase.priority,
          crmCase.assigned_to_name,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch),
      ),
    [cases, normalizedSearch],
  );

  const openEditor = (nextEditor: Editor) => {
    setEditor(nextEditor);
    setNotice("");
    setError("");

    if (nextEditor.type === "lead") {
      setLeadForm(nextEditor.record ?? emptyLead);
    }
    if (nextEditor.type === "opportunity") {
      setOpportunityForm(nextEditor.record ?? emptyOpportunity);
    }
    if (nextEditor.type === "activity") {
      setActivityForm(
        nextEditor.record
          ? {
              ...nextEditor.record,
              due_at: compactDateTime(nextEditor.record.due_at),
            }
          : emptyActivity,
      );
    }
    if (nextEditor.type === "contact") {
      setContactForm(nextEditor.record ?? emptyContact);
    }
    if (nextEditor.type === "case") {
      setCaseForm(nextEditor.record ?? emptyCase);
    }
  };

  const closeEditor = () => {
    setEditor(null);
    setActionId(null);
  };

  const saveEditor = async () => {
    if (!editor) return;

    setActionId("save");
    setError("");
    setNotice("");

    try {
      if (editor.type === "lead") {
        const payload = {
          ...leadForm,
          company_name: leadForm.company_name.trim(),
          estimated_value: leadForm.estimated_value || "0.00",
        };
        const saved = editor.record
          ? await leadsApi.update(editor.record.id, payload)
          : await leadsApi.create(payload);
        setLeads((current) =>
          editor.record
            ? current.map((item) => (item.id === saved.id ? saved : item))
            : [saved, ...current],
        );
      }

      if (editor.type === "opportunity") {
        const payload = {
          ...opportunityForm,
          title: opportunityForm.title.trim(),
          value: opportunityForm.value || "0.00",
          probability: Number(opportunityForm.probability || 0),
        };
        const saved = editor.record
          ? await opportunitiesApi.update(editor.record.id, payload)
          : await opportunitiesApi.create(payload);
        setOpportunities((current) =>
          editor.record
            ? current.map((item) => (item.id === saved.id ? saved : item))
            : [saved, ...current],
        );
      }

      if (editor.type === "activity") {
        const payload = {
          ...activityForm,
          subject: activityForm.subject.trim(),
          due_at: normalizeDateTime(activityForm.due_at ?? ""),
        };
        const saved = editor.record
          ? await activitiesApi.update(editor.record.id, payload)
          : await activitiesApi.create(payload);
        setActivities((current) =>
          editor.record
            ? current.map((item) => (item.id === saved.id ? saved : item))
            : [saved, ...current],
        );
      }

      if (editor.type === "contact") {
        const payload = {
          ...contactForm,
          full_name: contactForm.full_name.trim(),
        };
        const saved = editor.record
          ? await contactsApi.update(editor.record.id, payload)
          : await contactsApi.create(payload);
        setContacts((current) =>
          editor.record
            ? current.map((item) => (item.id === saved.id ? saved : item))
            : [saved, ...current],
        );
      }

      if (editor.type === "case") {
        const payload = {
          ...caseForm,
          title: caseForm.title.trim(),
        };
        const saved = editor.record
          ? await casesApi.update(editor.record.id, payload)
          : await casesApi.create(payload);
        setCases((current) =>
          editor.record
            ? current.map((item) => (item.id === saved.id ? saved : item))
            : [saved, ...current],
        );
      }

      setNotice("CRM record saved successfully.");
      closeEditor();
      const nextSummary = await fetchCRMSummary();
      setSummary(nextSummary);
    } catch (nextError) {
      setError(
        nextError instanceof ApiError
          ? nextError.message
          : "Unable to save this CRM record right now.",
      );
    } finally {
      setActionId(null);
    }
  };

  const deleteRecord = async (type: CRMTab, id: number) => {
    setActionId(`${type}-${id}`);
    setError("");
    setNotice("");

    try {
      if (type === "leads") {
        await leadsApi.remove(id);
        setLeads((current) => current.filter((item) => item.id !== id));
      }
      if (type === "opportunities") {
        await opportunitiesApi.remove(id);
        setOpportunities((current) => current.filter((item) => item.id !== id));
      }
      if (type === "activities") {
        await activitiesApi.remove(id);
        setActivities((current) => current.filter((item) => item.id !== id));
      }
      if (type === "contacts") {
        await contactsApi.remove(id);
        setContacts((current) => current.filter((item) => item.id !== id));
      }
      if (type === "cases") {
        await casesApi.remove(id);
        setCases((current) => current.filter((item) => item.id !== id));
      }
      setNotice("CRM record deleted successfully.");
      const nextSummary = await fetchCRMSummary();
      setSummary(nextSummary);
    } catch (nextError) {
      setError(
        nextError instanceof ApiError
          ? nextError.message
          : "Unable to delete this CRM record right now.",
      );
    } finally {
      setActionId(null);
    }
  };

  const renderUserOptions = () => (
    <>
      <option value="">Unassigned</option>
      {users.map((user) => (
        <option key={user.id} value={user.id}>
          {[user.first_name, user.last_name].filter(Boolean).join(" ") ||
            user.email}
        </option>
      ))}
    </>
  );

  const renderClientOptions = () => (
    <>
      <option value="">No client</option>
      {clients.map((client) => (
        <option key={client.id} value={client.id}>
          {client.name}
        </option>
      ))}
    </>
  );

  const renderLeadOptions = () => (
    <>
      <option value="">No lead</option>
      {leads.map((lead) => (
        <option key={lead.id} value={lead.id}>
          {lead.company_name}
        </option>
      ))}
    </>
  );

  const renderOpportunityOptions = () => (
    <>
      <option value="">No opportunity</option>
      {opportunities.map((opportunity) => (
        <option key={opportunity.id} value={opportunity.id}>
          {opportunity.title}
        </option>
      ))}
    </>
  );

  return (
    <div className="module-page">
      <section className="rounded-[32px] border border-white/70 bg-[radial-gradient(circle_at_top_left,#ffffff,rgba(236,253,245,0.9)_46%,rgba(240,249,255,0.95))] py-6 pl-6 pr-0 shadow-[0_25px_80px_rgba(148,163,184,0.14)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
              CRM
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Customer Relationship Management
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-600">
                Track leads, customer contacts, sales opportunities, follow-up
                work, and service cases around the sales pipeline.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            <Metric label="New leads" value={summary.leads_new} />
            <Metric label="Open deals" value={summary.opportunities_open} />
            <Metric label="Due work" value={summary.activities_due} />
            <Metric label="Open cases" value={summary.cases_open} />
          </div>
        </div>
      </section>

      <div className="module-page-stage justify-start">
        <section className="panel p-6">
          <div className="grid gap-3 lg:grid-cols-5">
            <MetricBand
              icon={Handshake}
              label="Total leads"
              value={summary.leads_total}
              tone="emerald"
            />
            <MetricBand
              icon={CalendarClock}
              label="Overdue follow-ups"
              value={summary.leads_overdue_followups}
              tone="amber"
            />
            <MetricBand
              icon={CircleDollarSign}
              label="Pipeline value"
              value={formatCurrency(summary.pipeline_value)}
              tone="sky"
            />
            <MetricBand
              icon={CheckCircle2}
              label="Won deals"
              value={summary.opportunities_won}
              tone="emerald"
            />
            <MetricBand
              icon={ClipboardList}
              label="Urgent cases"
              value={summary.cases_urgent}
              tone="red"
            />
          </div>

          <div className="mt-6 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="scrollbar-hidden overflow-x-auto rounded-[28px] border border-slate-200/80 bg-slate-50/70 p-2">
              <div className="flex min-w-max items-center gap-2">
                {(
                  [
                    ["leads", "Leads"],
                    ["opportunities", "Opportunities"],
                    ["activities", "Activities"],
                    ["contacts", "Contacts"],
                    ["cases", "Cases"],
                  ] as [CRMTab, string][]
                ).map(([tab, label]) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={[
                      "h-10 rounded-2xl px-4 text-sm font-semibold transition",
                      activeTab === tab
                        ? "bg-white text-slate-950 shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
                        : "text-slate-500 hover:text-slate-900",
                    ].join(" ")}
                  >
                    {label}{" "}
                    <span className="text-xs text-slate-400">
                      {tabCounts[tab]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="flex h-11 min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-slate-500 sm:w-80">
                <Search className="h-4 w-4 shrink-0" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search CRM records..."
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </label>
              <button
                type="button"
                onClick={() => void loadCRM(true)}
                disabled={isRefreshing}
                aria-label="Refresh CRM"
                title="Refresh"
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-70"
              >
                {isRefreshing ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </button>
              <button
                type="button"
                onClick={() => openEditor({ type: singularTab(activeTab) })}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
              >
                <Plus className="h-4 w-4" />
                New
              </button>
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {notice ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {notice}
            </div>
          ) : null}

          <div className="mt-5">
            {isLoading ? (
              <div className="flex min-h-[280px] items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-slate-50/70 text-slate-500">
                <div className="flex items-center gap-3 text-sm font-medium">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Loading CRM...
                </div>
              </div>
            ) : (
              <>
                {activeTab === "leads" && (
                  <RecordGrid
                    emptyLabel="No leads yet"
                    records={filteredLeads}
                    render={(lead) => (
                      <RecordCard
                        key={lead.id}
                        icon={Handshake}
                        title={lead.company_name}
                        eyebrow={labelize(lead.status)}
                        tags={[lead.interest_level, lead.source || "direct"]}
                        body={lead.notes || lead.contact_person || "No notes recorded."}
                        meta={[
                          `Value ${formatCurrency(lead.estimated_value)}`,
                          `Follow-up ${formatDate(lead.next_follow_up_date)}`,
                          lead.assigned_to_name || "Unassigned",
                        ]}
                        onEdit={() => openEditor({ type: "lead", record: lead })}
                        onDelete={() => void deleteRecord("leads", lead.id)}
                        isDeleting={actionId === `leads-${lead.id}`}
                      />
                    )}
                  />
                )}

                {activeTab === "opportunities" && (
                  <RecordGrid
                    emptyLabel="No opportunities yet"
                    records={filteredOpportunities}
                    render={(opportunity) => (
                      <RecordCard
                        key={opportunity.id}
                        icon={CircleDollarSign}
                        title={opportunity.title}
                        eyebrow={labelize(opportunity.stage)}
                        tags={[`${opportunity.probability}%`, getRelationName(opportunity)]}
                        body={opportunity.notes || "No opportunity notes recorded."}
                        meta={[
                          formatCurrency(opportunity.value),
                          `Close ${formatDate(opportunity.expected_close_date)}`,
                          opportunity.assigned_to_name || "Unassigned",
                        ]}
                        onEdit={() =>
                          openEditor({ type: "opportunity", record: opportunity })
                        }
                        onDelete={() =>
                          void deleteRecord("opportunities", opportunity.id)
                        }
                        isDeleting={actionId === `opportunities-${opportunity.id}`}
                      />
                    )}
                  />
                )}

                {activeTab === "activities" && (
                  <RecordGrid
                    emptyLabel="No activities yet"
                    records={filteredActivities}
                    render={(activity) => (
                      <RecordCard
                        key={activity.id}
                        icon={CalendarClock}
                        title={activity.subject}
                        eyebrow={labelize(activity.status)}
                        tags={[labelize(activity.activity_type), getRelationName(activity)]}
                        body={activity.notes || "No activity notes recorded."}
                        meta={[
                          `Due ${formatDate(activity.due_at)}`,
                          activity.assigned_to_name || "Unassigned",
                        ]}
                        onEdit={() =>
                          openEditor({ type: "activity", record: activity })
                        }
                        onDelete={() => void deleteRecord("activities", activity.id)}
                        isDeleting={actionId === `activities-${activity.id}`}
                      />
                    )}
                  />
                )}

                {activeTab === "contacts" && (
                  <RecordGrid
                    emptyLabel="No contacts yet"
                    records={filteredContacts}
                    render={(contact) => (
                      <RecordCard
                        key={contact.id}
                        icon={UserRound}
                        title={contact.full_name}
                        eyebrow={contact.role_title || "Contact"}
                        tags={[
                          contact.is_primary ? "primary" : "secondary",
                          getRelationName(contact),
                        ]}
                        body={contact.notes || contact.email || contact.phone_number || "No contact notes recorded."}
                        meta={[contact.email || "No email", contact.phone_number || "No phone"]}
                        onEdit={() =>
                          openEditor({ type: "contact", record: contact })
                        }
                        onDelete={() => void deleteRecord("contacts", contact.id)}
                        isDeleting={actionId === `contacts-${contact.id}`}
                      />
                    )}
                  />
                )}

                {activeTab === "cases" && (
                  <RecordGrid
                    emptyLabel="No customer cases yet"
                    records={filteredCases}
                    render={(crmCase) => (
                      <RecordCard
                        key={crmCase.id}
                        icon={ClipboardList}
                        title={crmCase.title}
                        eyebrow={labelize(crmCase.status)}
                        tags={[crmCase.priority, getRelationName(crmCase)]}
                        body={crmCase.description || "No case description recorded."}
                        meta={[
                          `Reported ${formatDate(crmCase.reported_at)}`,
                          crmCase.assigned_to_name || "Unassigned",
                        ]}
                        onEdit={() => openEditor({ type: "case", record: crmCase })}
                        onDelete={() => void deleteRecord("cases", crmCase.id)}
                        isDeleting={actionId === `cases-${crmCase.id}`}
                      />
                    )}
                  />
                )}
              </>
            )}
          </div>
        </section>
      </div>

      {editor ? (
        <ModalShell
          title={`${editor.record ? "Edit" : "New"} ${editorLabel(editor.type)}`}
          onClose={closeEditor}
        >
            <div className="grid gap-4 sm:grid-cols-2">
              {editor.type === "lead" && (
                <>
                  <TextField label="Company" value={leadForm.company_name} onChange={(value) => setLeadForm({ ...leadForm, company_name: value })} />
                  <TextField label="Contact person" value={leadForm.contact_person} onChange={(value) => setLeadForm({ ...leadForm, contact_person: value })} />
                  <TextField label="Email" value={leadForm.email} onChange={(value) => setLeadForm({ ...leadForm, email: value })} />
                  <TextField label="Phone" value={leadForm.phone_number} onChange={(value) => setLeadForm({ ...leadForm, phone_number: value })} />
                  <TextField label="Source" value={leadForm.source} onChange={(value) => setLeadForm({ ...leadForm, source: value })} />
                  <TextField label="Estimated value" value={leadForm.estimated_value} onChange={(value) => setLeadForm({ ...leadForm, estimated_value: value })} />
                  <SelectField label="Status" value={leadForm.status} onChange={(value) => setLeadForm({ ...leadForm, status: value as LeadStatus })}>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="proposal_sent">Proposal sent</option>
                    <option value="converted">Converted</option>
                    <option value="lost">Lost</option>
                  </SelectField>
                  <SelectField label="Interest" value={leadForm.interest_level} onChange={(value) => setLeadForm({ ...leadForm, interest_level: value as InterestLevel })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </SelectField>
                  <TextField label="Next follow-up" type="date" value={leadForm.next_follow_up_date ?? ""} onChange={(value) => setLeadForm({ ...leadForm, next_follow_up_date: value || null })} />
                  <SelectField label="Assigned to" value={leadForm.assigned_to ?? ""} onChange={(value) => setLeadForm({ ...leadForm, assigned_to: optionalId(value) })}>
                    {renderUserOptions()}
                  </SelectField>
                  <SelectField label="Converted client" value={leadForm.converted_client ?? ""} onChange={(value) => setLeadForm({ ...leadForm, converted_client: optionalId(value) })}>
                    {renderClientOptions()}
                  </SelectField>
                  <TextArea label="Notes" value={leadForm.notes} onChange={(value) => setLeadForm({ ...leadForm, notes: value })} />
                </>
              )}

              {editor.type === "opportunity" && (
                <>
                  <TextField label="Title" value={opportunityForm.title} onChange={(value) => setOpportunityForm({ ...opportunityForm, title: value })} />
                  <TextField label="Value" value={opportunityForm.value} onChange={(value) => setOpportunityForm({ ...opportunityForm, value })} />
                  <TextField label="Probability" type="number" value={String(opportunityForm.probability)} onChange={(value) => setOpportunityForm({ ...opportunityForm, probability: Number(value) })} />
                  <TextField label="Expected close" type="date" value={opportunityForm.expected_close_date ?? ""} onChange={(value) => setOpportunityForm({ ...opportunityForm, expected_close_date: value || null })} />
                  <SelectField label="Stage" value={opportunityForm.stage} onChange={(value) => setOpportunityForm({ ...opportunityForm, stage: value as OpportunityStage })}>
                    <option value="prospecting">Prospecting</option>
                    <option value="needs_review">Needs review</option>
                    <option value="quoted">Quoted</option>
                    <option value="negotiation">Negotiation</option>
                    <option value="won">Won</option>
                    <option value="lost">Lost</option>
                  </SelectField>
                  <SelectField label="Client" value={opportunityForm.client ?? ""} onChange={(value) => setOpportunityForm({ ...opportunityForm, client: optionalId(value) })}>
                    {renderClientOptions()}
                  </SelectField>
                  <SelectField label="Lead" value={opportunityForm.lead ?? ""} onChange={(value) => setOpportunityForm({ ...opportunityForm, lead: optionalId(value) })}>
                    {renderLeadOptions()}
                  </SelectField>
                  <SelectField label="Assigned to" value={opportunityForm.assigned_to ?? ""} onChange={(value) => setOpportunityForm({ ...opportunityForm, assigned_to: optionalId(value) })}>
                    {renderUserOptions()}
                  </SelectField>
                  <TextArea label="Notes" value={opportunityForm.notes} onChange={(value) => setOpportunityForm({ ...opportunityForm, notes: value })} />
                </>
              )}

              {editor.type === "activity" && (
                <>
                  <TextField label="Subject" value={activityForm.subject} onChange={(value) => setActivityForm({ ...activityForm, subject: value })} />
                  <TextField label="Due" type="datetime-local" value={activityForm.due_at ?? ""} onChange={(value) => setActivityForm({ ...activityForm, due_at: value || null })} />
                  <SelectField label="Type" value={activityForm.activity_type} onChange={(value) => setActivityForm({ ...activityForm, activity_type: value as ActivityType })}>
                    <option value="call">Call</option>
                    <option value="meeting">Meeting</option>
                    <option value="email">Email</option>
                    <option value="visit">Visit</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="task">Task</option>
                  </SelectField>
                  <SelectField label="Status" value={activityForm.status} onChange={(value) => setActivityForm({ ...activityForm, status: value as ActivityStatus })}>
                    <option value="open">Open</option>
                    <option value="done">Done</option>
                    <option value="cancelled">Cancelled</option>
                  </SelectField>
                  <SelectField label="Client" value={activityForm.client ?? ""} onChange={(value) => setActivityForm({ ...activityForm, client: optionalId(value) })}>
                    {renderClientOptions()}
                  </SelectField>
                  <SelectField label="Lead" value={activityForm.lead ?? ""} onChange={(value) => setActivityForm({ ...activityForm, lead: optionalId(value) })}>
                    {renderLeadOptions()}
                  </SelectField>
                  <SelectField label="Opportunity" value={activityForm.opportunity ?? ""} onChange={(value) => setActivityForm({ ...activityForm, opportunity: optionalId(value) })}>
                    {renderOpportunityOptions()}
                  </SelectField>
                  <SelectField label="Assigned to" value={activityForm.assigned_to ?? ""} onChange={(value) => setActivityForm({ ...activityForm, assigned_to: optionalId(value) })}>
                    {renderUserOptions()}
                  </SelectField>
                  <TextArea label="Notes" value={activityForm.notes} onChange={(value) => setActivityForm({ ...activityForm, notes: value })} />
                </>
              )}

              {editor.type === "contact" && (
                <>
                  <TextField label="Full name" value={contactForm.full_name} onChange={(value) => setContactForm({ ...contactForm, full_name: value })} />
                  <TextField label="Role title" value={contactForm.role_title} onChange={(value) => setContactForm({ ...contactForm, role_title: value })} />
                  <TextField label="Email" value={contactForm.email} onChange={(value) => setContactForm({ ...contactForm, email: value })} />
                  <TextField label="Phone" value={contactForm.phone_number} onChange={(value) => setContactForm({ ...contactForm, phone_number: value })} />
                  <SelectField label="Client" value={contactForm.client ?? ""} onChange={(value) => setContactForm({ ...contactForm, client: optionalId(value) })}>
                    {renderClientOptions()}
                  </SelectField>
                  <SelectField label="Lead" value={contactForm.lead ?? ""} onChange={(value) => setContactForm({ ...contactForm, lead: optionalId(value) })}>
                    {renderLeadOptions()}
                  </SelectField>
                  <label className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={contactForm.is_primary}
                      onChange={(event) => setContactForm({ ...contactForm, is_primary: event.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-sky-700"
                    />
                    Primary contact
                  </label>
                  <TextArea label="Notes" value={contactForm.notes} onChange={(value) => setContactForm({ ...contactForm, notes: value })} />
                </>
              )}

              {editor.type === "case" && (
                <>
                  <TextField label="Title" value={caseForm.title} onChange={(value) => setCaseForm({ ...caseForm, title: value })} />
                  <SelectField label="Status" value={caseForm.status} onChange={(value) => setCaseForm({ ...caseForm, status: value as CaseStatus })}>
                    <option value="open">Open</option>
                    <option value="in_progress">In progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </SelectField>
                  <SelectField label="Priority" value={caseForm.priority} onChange={(value) => setCaseForm({ ...caseForm, priority: value as CasePriority })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </SelectField>
                  <SelectField label="Client" value={caseForm.client ?? ""} onChange={(value) => setCaseForm({ ...caseForm, client: optionalId(value) })}>
                    {renderClientOptions()}
                  </SelectField>
                  <SelectField label="Contact" value={caseForm.contact ?? ""} onChange={(value) => setCaseForm({ ...caseForm, contact: optionalId(value) })}>
                    <option value="">No contact</option>
                    {contacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.full_name}
                      </option>
                    ))}
                  </SelectField>
                  <SelectField label="Assigned to" value={caseForm.assigned_to ?? ""} onChange={(value) => setCaseForm({ ...caseForm, assigned_to: optionalId(value) })}>
                    {renderUserOptions()}
                  </SelectField>
                  <TextArea label="Description" value={caseForm.description} onChange={(value) => setCaseForm({ ...caseForm, description: value })} />
                  <TextArea label="Resolution notes" value={caseForm.resolution_notes} onChange={(value) => setCaseForm({ ...caseForm, resolution_notes: value })} />
                </>
              )}
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={closeEditor}
                className={secondaryButtonClassName}
                aria-label="Cancel"
                title="Cancel"
              >
                <X className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => void saveEditor()}
                disabled={actionId === "save"}
                className={primaryButtonClassName}
                aria-label="Save"
                title="Save"
              >
                {actionId === "save" ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
              </button>
            </div>
        </ModalShell>
      ) : null}
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
            className="modal-close-button"
            aria-label="Close"
            title="Close"
          >
            <X className="h-4 w-4 sm:hidden" />
            <span className="hidden sm:inline">Close</span>
          </button>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

function singularTab(tab: CRMTab): Editor["type"] {
  if (tab === "leads") return "lead";
  if (tab === "opportunities") return "opportunity";
  if (tab === "activities") return "activity";
  if (tab === "contacts") return "contact";
  return "case";
}

function editorLabel(type: Editor["type"]) {
  if (type === "case") return "case";
  return type;
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="hero-metric-card">
      <p className="hero-metric-label">{label}</p>
      <p className="hero-metric-value">{value}</p>
    </div>
  );
}

function MetricBand({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof BriefcaseBusiness;
  label: string;
  value: number | string;
  tone: "emerald" | "amber" | "sky" | "red";
}) {
  const classes = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    sky: "border-sky-200 bg-sky-50 text-sky-700",
    red: "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white/90 p-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${classes[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            {label}
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-950">{value}</p>
        </div>
      </div>
    </div>
  );
}

function RecordGrid<T>({
  records,
  render,
  emptyLabel,
}: {
  records: T[];
  render: (record: T) => ReactNode;
  emptyLabel: string;
}) {
  if (records.length === 0) {
    return (
      <div className="flex min-h-[260px] items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-slate-50/70 text-center text-sm font-medium text-slate-500">
        {emptyLabel}
      </div>
    );
  }

  return <div className="grid gap-4 xl:grid-cols-2">{records.map(render)}</div>;
}

function RecordCard({
  icon: Icon,
  title,
  eyebrow,
  tags,
  body,
  meta,
  onEdit,
  onDelete,
  isDeleting,
}: {
  icon: typeof BriefcaseBusiness;
  title: string;
  eyebrow: string;
  tags: string[];
  body: string;
  meta: string[];
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  return (
    <article className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700">
              <Icon className="h-4 w-4" />
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              {eyebrow}
            </span>
            {tags.filter(Boolean).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700"
              >
                {tag}
              </span>
            ))}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
            <p className="mt-2 line-clamp-3 text-sm leading-7 text-slate-600">
              {body}
            </p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
            {meta.filter(Boolean).map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${title}`}
            title="Edit"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            aria-label={`Delete ${title}`}
            title="Delete"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-red-700 transition hover:bg-red-100 disabled:opacity-70"
          >
            {isDeleting ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`mt-2 ${fieldClassName}`}
      />
    </label>
  );
}

function getOptionLabel(children: ReactNode) {
  return Children.toArray(children)
    .map((child) => (typeof child === "string" || typeof child === "number" ? String(child) : ""))
    .join("")
    .trim();
}

function extractPickerOptions(children: ReactNode): Array<{
  label: string;
  value: string;
  searchText: string;
}> {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement(child)) {
      return [];
    }

    const props = child.props as {
      value?: string | number;
      children?: ReactNode;
    };

    if (props.value === undefined && props.children) {
      return extractPickerOptions(props.children);
    }

    const optionValue = String(props.value ?? "");
    const optionLabel = getOptionLabel(props.children) || optionValue || "Select";
    return [
      {
        value: optionValue,
        label: optionLabel,
        searchText: `${optionLabel} ${optionValue}`,
      },
    ];
  });
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
        <div className="absolute left-0 top-full z-50 mt-2 w-full rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_24px_60px_rgba(15,23,42,0.14)]">
          {searchable ? (
            <div className="border-b border-slate-200 px-1 pb-2">
              <input
                type="text"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder={searchPlaceholder}
                className={fieldClassName}
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
                  role="option"
                  aria-selected={value === option.value}
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

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  const options = extractPickerOptions(children);

  return (
    <div className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <div className="mt-2">
        <PickerField
          value={String(value)}
          options={options}
          onChange={onChange}
          searchable={options.length > 6}
          searchPlaceholder={`Search ${label.toLowerCase()}`}
        />
      </div>
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block sm:col-span-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className={`mt-2 ${textAreaClassName}`}
      />
    </label>
  );
}
