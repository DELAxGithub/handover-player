/**
 * User Color Utility
 * Provides consistent color assignment for users across Timeline markers and Avatars
 */

export const USER_COLORS = [
    { bg: 'bg-emerald-500', hover: 'hover:bg-emerald-400', hex: '#10b981' },
    { bg: 'bg-blue-500', hover: 'hover:bg-blue-400', hex: '#3b82f6' },
    { bg: 'bg-purple-500', hover: 'hover:bg-purple-400', hex: '#a855f7' },
    { bg: 'bg-pink-500', hover: 'hover:bg-pink-400', hex: '#ec4899' },
    { bg: 'bg-amber-500', hover: 'hover:bg-amber-400', hex: '#f59e0b' },
    { bg: 'bg-cyan-500', hover: 'hover:bg-cyan-400', hex: '#06b6d4' },
    { bg: 'bg-rose-500', hover: 'hover:bg-rose-400', hex: '#f43f5e' },
    { bg: 'bg-indigo-500', hover: 'hover:bg-indigo-400', hex: '#6366f1' },
    { bg: 'bg-teal-500', hover: 'hover:bg-teal-400', hex: '#14b8a6' },
    { bg: 'bg-orange-500', hover: 'hover:bg-orange-400', hex: '#f97316' },
];

/**
 * Get a consistent color for a user based on their name
 * @param {string} userName - The user's name
 * @returns {object} Color object with bg, hover, and hex properties
 */
export const getUserColor = (userName) => {
    if (!userName) return USER_COLORS[0];

    let hash = 0;
    for (let i = 0; i < userName.length; i++) {
        hash = userName.charCodeAt(i) + ((hash << 5) - hash);
    }

    return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
};

/**
 * Get just the Tailwind bg class for a user (backwards compatible)
 * @param {string} userName - The user's name
 * @returns {string} Tailwind bg class
 */
export const getAvatarColor = (userName) => {
    return getUserColor(userName).bg;
};

/**
 * Get user initials from name
 * @param {string} name - The user's name
 * @returns {string} Initials (max 2 characters)
 */
export const getInitials = (name) => {
    return (name || 'A')
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
};
