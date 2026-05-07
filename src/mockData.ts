import {
  mockDataTeam,
  mockDataContacts,
  mockDataInvoices,
  mockTransactions,
  mockBarData,
  mockPieData,
  mockLineData,
  mockGeographyData,
} from "./mockData"; // adjust this path to match where your file actually is

const mockResponses = {
  "/api/team": mockDataTeam,
  "/api/contacts": mockDataContacts,
  "/api/invoices": mockDataInvoices,
  "/api/transactions": mockTransactions,
  "/api/bar": mockBarData,
  "/api/pie": mockPieData,
  "/api/line": mockLineData,
  "/api/geography": mockGeographyData,
};

const originalFetch = window.fetch;

window.fetch = (url, options) => {
  if (mockResponses[url]) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockResponses[url]),
    });
  }
  return originalFetch(url, options);
};