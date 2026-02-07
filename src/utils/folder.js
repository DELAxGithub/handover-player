import { supabase } from '../supabase';

// Extract filename from URL as default title
const extractFilename = (url) => {
  try {
    const pathname = new URL(url).pathname;
    return decodeURIComponent(pathname.substring(pathname.lastIndexOf('/') + 1));
  } catch {
    return 'Untitled Episode';
  }
};

export const createFolder = async (title) => {
  const { data, error } = await supabase
    .from('folders')
    .insert([{ title: title || 'Untitled Folder' }])
    .select()
    .single();

  if (error) {
    console.error('Failed to create folder:', error);
    return { error };
  }
  return { id: data.id, error: null };
};

export const getFolder = async (folderId) => {
  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .eq('id', folderId)
    .single();

  if (error) return { data: null, error };
  return { data, error: null };
};

export const updateFolderTitle = async (folderId, newTitle) => {
  const { error } = await supabase
    .from('folders')
    .update({ title: newTitle })
    .eq('id', folderId);

  if (error) console.error('Failed to update folder title:', error);
  return { error };
};

export const getFolderEpisodes = async (folderId) => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('folder_id', folderId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch episodes:', error);
    return { data: [], error };
  }
  return { data: data || [], error: null };
};

export const createEpisode = async (folderId, url, title = null) => {
  const episodeTitle = title || extractFilename(url);

  const { data, error } = await supabase
    .from('projects')
    .insert([{
      source_url: url,
      title: episodeTitle,
      folder_id: folderId,
      status: 'active',
    }])
    .select()
    .single();

  if (error) {
    console.error('Failed to create episode:', error);
    return { id: null, error };
  }
  return { id: data.id, error: null };
};

export const deleteEpisode = async (episodeId) => {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', episodeId);

  if (error) console.error('Failed to delete episode:', error);
  return { error };
};
