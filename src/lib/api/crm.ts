import { apiRequest } from "./auth";
import type {
  CRMActivity,
  CRMActivityPayload,
  CRMSummary,
  Contact,
  ContactPayload,
  CustomerCase,
  CustomerCasePayload,
  Lead,
  LeadPayload,
  Opportunity,
  OpportunityPayload,
} from "../../types/crm";

const CRM_BASE_PATH = "/api/crm/";

function crudApi<TItem, TPayload>(path: string) {
  const basePath = `${CRM_BASE_PATH}${path}/`;

  return {
    list: () => apiRequest<TItem[]>(basePath),
    create: (payload: TPayload) =>
      apiRequest<TItem>(
        basePath,
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        { csrf: true },
      ),
    update: (id: number, payload: Partial<TPayload>) =>
      apiRequest<TItem>(
        `${basePath}${id}/`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        },
        { csrf: true },
      ),
    remove: (id: number) =>
      apiRequest<null>(
        `${basePath}${id}/`,
        {
          method: "DELETE",
        },
        { csrf: true },
      ),
  };
}

export async function fetchCRMSummary() {
  return apiRequest<CRMSummary>(`${CRM_BASE_PATH}summary/`);
}

export const leadsApi = crudApi<Lead, LeadPayload>("leads");
export const contactsApi = crudApi<Contact, ContactPayload>("contacts");
export const opportunitiesApi = crudApi<Opportunity, OpportunityPayload>(
  "opportunities",
);
export const activitiesApi = crudApi<CRMActivity, CRMActivityPayload>(
  "activities",
);
export const casesApi = crudApi<CustomerCase, CustomerCasePayload>("cases");
