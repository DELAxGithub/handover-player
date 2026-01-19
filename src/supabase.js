import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const isValidUrl = (urlString) => {
    try { return Boolean(new URL(urlString)); } catch (e) { return false; }
};

// --- Local Storage Mock Helpers ---
const MOCK_STORAGE_KEY = 'handover_mock_comments';

const getMockData = () => {
    try {
        return JSON.parse(localStorage.getItem(MOCK_STORAGE_KEY) || '[]');
    } catch { return []; }
};

const setMockData = (data) => {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(data));
};

// Simple event bus for same-tab updates not covered by 'storage' event
const mockEventBus = new EventTarget();

export const supabase = (isValidUrl(supabaseUrl) && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : {
        from: (table) => {
            if (table !== 'comments') {
                return {
                    select: () => Promise.resolve({ data: [], error: null }),
                    insert: () => Promise.resolve({ error: null })
                };
            }

            return {
                select: () => {
                    let data = getMockData();
                    const builder = {
                        eq: (col, val) => {
                            data = data.filter(item => item[col] === val);
                            return builder;
                        },
                        order: (col, { ascending }) => {
                            data.sort((a, b) => ascending ? a[col] - b[col] : b[col] - a[col]);
                            return builder;
                        },
                        // Make it then-able so it can be awaited
                        then: (resolve) => resolve({ data, error: null })
                    };
                    return builder;
                },
                update: (updates) => {
                    const builder = {
                        eq: (col, val) => {
                            const current = getMockData();
                            let found = false;

                            const updated = current.map(item => {
                                if (item[col] === val) {
                                    found = true;
                                    const newItem = { ...item, ...updates };
                                    setTimeout(() => {
                                        const event = new CustomEvent('mock-update', { detail: newItem });
                                        mockEventBus.dispatchEvent(event);
                                    }, 0);
                                    return newItem;
                                }
                                return item;
                            });

                            if (found) {
                                setMockData(updated);
                            }

                            return Promise.resolve({ error: null });
                        }
                    };
                    return builder;
                },
                insert: (rows) => {
                    const current = getMockData();
                    const newRows = rows.map(r => ({
                        ...r,
                        id: r.id || crypto.randomUUID(), // Use random UUID for ID
                        created_at: new Date().toISOString(),
                        resolved: false // Default to unresolved
                    }));

                    const updated = [...current, ...newRows];
                    setMockData(updated);

                    // Dispatch event for local subscribers (same tab won't get 'storage' event)
                    newRows.forEach(row => {
                        const event = new CustomEvent('mock-insert', { detail: row });
                        mockEventBus.dispatchEvent(event);
                    });

                    return Promise.resolve({ error: null });
                }
            };
        },
        channel: () => {
            const subscribers = new Set();

            // Handler for cross-tab updates (localStorage changes)
            const handleStorage = (e) => {
                if (e.key === MOCK_STORAGE_KEY && e.newValue) {
                    const oldVal = JSON.parse(e.oldValue || '[]');
                    const newVal = JSON.parse(e.newValue);

                    // Simple logic: find items in new that aren't in old
                    // This assumes append-only behavior mainly
                    const oldIds = new Set(oldVal.map(i => i.id));
                    const newItems = newVal.filter(i => !oldIds.has(i.id));

                    newItems.forEach(item => {
                        subscribers.forEach(cb => cb({ new: item }));
                    });
                }
            };

            // Handler for same-tab updates
            const handleLocal = (e) => {
                if (e.type === 'mock-insert') {
                    subscribers.forEach(cb => cb({ new: e.detail, eventType: 'INSERT' }));
                } else if (e.type === 'mock-update') {
                    subscribers.forEach(cb => cb({ new: e.detail, eventType: 'UPDATE' }));
                }
            }

            window.addEventListener('storage', handleStorage);
            mockEventBus.addEventListener('mock-insert', handleLocal);
            mockEventBus.addEventListener('mock-update', handleLocal);

            const mockChannel = {
                on: (event, filter, callback) => {
                    if (event === 'postgres_changes') {
                        subscribers.add((payload) => {
                            // Simple filtering to match real Supabase behavior
                            if (filter.event === '*' || filter.event === payload.eventType) {
                                callback(payload);
                            }
                        });
                    }
                    return mockChannel;
                },
                subscribe: () => mockChannel,
                unsubscribe: () => {
                    subscribers.clear();
                    window.removeEventListener('storage', handleStorage);
                    mockEventBus.removeEventListener('mock-insert', handleLocal);
                    mockEventBus.removeEventListener('mock-update', handleLocal);
                },
            };
            return mockChannel;
        }
    };
