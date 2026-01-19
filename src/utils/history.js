/**
 * History Manager using LocalStorage
 * Stores recent projects accessed by the user.
 * 
 * Schema:
 * [
 *   {
 *     id: "uuid",
 *     url: "dropbox_url",
 *     title: "Filename or Project Name",
 *     lastAccess: timestamp
 *   }
 * ]
 */

const KEY = 'handover_project_history';
const MAX_ITEMS = 50;

export const getHistory = () => {
    try {
        const raw = localStorage.getItem(KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
};

export const addToHistory = (project) => {
    if (!project || !project.id) return;

    try {
        const current = getHistory();
        // Remove existing entry for same ID to move it to top
        const filtered = current.filter(p => p.id !== project.id);

        const newEntry = {
            id: project.id,
            url: project.url || '',
            title: project.title || 'Untitled Project',
            lastAccess: Date.now()
        };

        const updated = [newEntry, ...filtered].slice(0, MAX_ITEMS);
        localStorage.setItem(KEY, JSON.stringify(updated));
    } catch (e) {
        console.error("Failed to save history", e);
    }
};

export const removeFromHistory = (id) => {
    try {
        const current = getHistory();
        const updated = current.filter(p => p.id !== id);
        localStorage.setItem(KEY, JSON.stringify(updated));
        return updated;
    } catch (e) {
        return [];
    }
};

export const clearHistory = () => {
    localStorage.removeItem(KEY);
};
