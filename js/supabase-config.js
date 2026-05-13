/* ============================================
   ICONMIC - Supabase Configuration
   ============================================ */

// Replace these with your actual Supabase project credentials
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

let supabaseClient = null;

function getSupabase() {
  if (!supabaseClient && typeof supabase !== 'undefined') {
    if (SUPABASE_URL.startsWith('http') && SUPABASE_ANON_KEY.length > 20) {
      try {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      } catch {
        return null;
      }
    }
  }
  return supabaseClient;
}

/* ---------- Auth Helpers ---------- */

async function getCurrentUser() {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data: { user } } = await sb.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

async function signUp(email, password, displayName) {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase not initialized');

  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName }
    }
  });

  if (error) throw error;

  if (data.user) {
    await sb.from('profiles').upsert({
      id: data.user.id,
      display_name: displayName,
      email: email,
      created_at: new Date().toISOString()
    });
  }

  return data;
}

async function signIn(email, password) {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase not initialized');

  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function signOut() {
  const sb = getSupabase();
  if (!sb) return;
  await sb.auth.signOut();
  window.location.href = 'login.html';
}

async function resetPassword(email) {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase not initialized');

  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/login.html'
  });
  if (error) throw error;
}

/* ---------- Auth State Listener ---------- */

function onAuthStateChange(callback) {
  const sb = getSupabase();
  if (!sb) return;
  sb.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}

/* ---------- Auth Guard ---------- */

async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    const currentPage = window.location.pathname + window.location.search;
    sessionStorage.setItem('iconmic_redirect', currentPage);
    window.location.href = 'login.html';
    return null;
  }
  return user;
}

/* ---------- Database Helpers ---------- */

async function getBooks(genre = null, limit = 20, offset = 0) {
  const sb = getSupabase();
  if (!sb) return [];

  let query = sb.from('books').select('*').eq('is_published', true);
  if (genre && genre !== 'all') {
    query = query.eq('genre', genre);
  }
  query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) { console.error('Error fetching books:', error); return []; }
  return data || [];
}

async function getBookById(bookId) {
  const sb = getSupabase();
  if (!sb) return null;

  const { data, error } = await sb.from('books').select('*').eq('id', bookId).single();
  if (error) { console.error('Error fetching book:', error); return null; }
  return data;
}

async function getBookContent(bookId) {
  const user = await requireAuth();
  if (!user) return null;

  const sb = getSupabase();
  const { data, error } = await sb.from('book_content')
    .select('*')
    .eq('book_id', bookId)
    .order('chapter_number', { ascending: true });

  if (error) { console.error('Error fetching content:', error); return null; }

  await logReadingActivity(user.id, bookId);
  return data;
}

async function logReadingActivity(userId, bookId) {
  const sb = getSupabase();
  if (!sb) return;

  await sb.from('reading_history').upsert({
    user_id: userId,
    book_id: bookId,
    last_read_at: new Date().toISOString()
  }, { onConflict: 'user_id,book_id' });
}

async function getUserReadingHistory(userId) {
  const sb = getSupabase();
  if (!sb) return [];

  const { data, error } = await sb.from('reading_history')
    .select('*, books(*)')
    .eq('user_id', userId)
    .order('last_read_at', { ascending: false });

  if (error) return [];
  return data || [];
}

async function searchBooks(query) {
  const sb = getSupabase();
  if (!sb) return [];

  const { data, error } = await sb.from('books')
    .select('*')
    .eq('is_published', true)
    .or(`title.ilike.%${query}%,author.ilike.%${query}%,description.ilike.%${query}%`)
    .limit(20);

  if (error) return [];
  return data || [];
}

async function getGenres() {
  const sb = getSupabase();
  if (!sb) return [];

  const { data, error } = await sb.from('genres').select('*').order('name');
  if (error) return [];
  return data || [];
}

async function getUserProfile(userId) {
  const sb = getSupabase();
  if (!sb) return null;

  const { data, error } = await sb.from('profiles').select('*').eq('id', userId).single();
  if (error) return null;
  return data;
}

async function updateUserProfile(userId, updates) {
  const sb = getSupabase();
  if (!sb) return null;

  const { data, error } = await sb.from('profiles').update(updates).eq('id', userId).select().single();
  if (error) throw error;
  return data;
}
