const mockResponses = {
  '/api/users': {
    users: [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ],
  },
  '/api/notifications': [
    { id: 1, message: 'Welcome!', read: false },
    { id: 2, message: 'You have a new message.', read: true },
  ],
  '/api/messages': [
    { id: 1, from: 'Alice', content: 'Hello!' },
    { id: 2, from: 'Bob', content: 'Hi there!' },
  ],
};

const originalFetch = window.fetch;

window.fetch = (url, options) => {
  // Check if we have mock data for this URL
  if (mockResponses[url]) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockResponses[url]),
    });
  }
  // Otherwise use the real fetch
  return originalFetch(url, options);
};