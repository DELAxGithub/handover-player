import { supabase } from '../supabase';

/**
 * Creates a new project in Supabase.
 * @param {string} url - The source URL (Dropbox, etc.)
 * @param {string} [title] - Optional title
 * @returns {Promise<{id: string, error: object}>}
 */
export const createProject = async (url, title = null) => {
    // 1. Generate UUID on client or let DB do it. 
    // DB default is gen_random_uuid(), so we can just insert.
    // However, we want the ID back.

    // Extract filename as default title if not provided
    let defaultTitle = title;
    if (!defaultTitle && url) {
        try {
            const pathname = new URL(url).pathname;
            defaultTitle = decodeURIComponent(pathname.substring(pathname.lastIndexOf('/') + 1));
        } catch (e) {
            defaultTitle = "Untitled Project";
        }
    }

    const { data, error } = await supabase
        .from('projects')
        .insert([
            {
                source_url: url,
                title: defaultTitle,
                status: 'active'
                // defaults: expires_at (+7d), passcode_hash (null)
            }
        ])
        .select()
        .single();

    if (error) {
        console.error("Failed to create project:", error);
        return { error };
    }

    return { id: data.id, error: null };
};

export const getProject = async (id) => {
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

    if (error) return { error };
    return { data };
};
