/* js/auth.js */
const AUTH = (() => {
  const SUPABASE_URL = 'https://hsxnjgvcvdvjzgxzztov.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzeG5qZ3ZjdmR2anpneHp6dG92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2ODYzMTYsImV4cCI6MjA5NjI2MjMxNn0.2pw3uKMHRl8l9PAsrGOsk-MnuZtZ-ZwV-tFgg5glIWA';

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  let currentUser = null;
  let currentEnrollment = null;
  let authListeners = [];
  let initialized = false;

  function notify() {
    authListeners.forEach(fn => fn(currentUser, currentEnrollment));
  }

  async function loadEnrollment() {
    if (!currentUser) { currentEnrollment = null; return; }
    const { data } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', currentUser.id)
      .single();
    currentEnrollment = data || null;
  }

  return {
    async init() {
      if (initialized) return;
      initialized = true;
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        currentUser = session.user;
        await loadEnrollment();
      }
      notify();

      supabase.auth.onAuthStateChange(async (event, session) => {
        if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          currentUser = session.user;
          await loadEnrollment();
        } else if (event === 'SIGNED_OUT') {
          currentUser = null;
          currentEnrollment = null;
        }
        notify();
      });
    },

    getUser() { return currentUser; },
    getEnrollment() { return currentEnrollment; },
    isAuthenticated() { return !!currentUser; },

    canAccessLesson(lessonId) {
      if (!currentEnrollment) return false;
      if (currentEnrollment.access_type === 'admin') return true;
      if (currentEnrollment.access_type === 'full') {
        if (currentEnrollment.access_expires_at) {
          return new Date(currentEnrollment.access_expires_at) > new Date();
        }
        return true;
      }
      if (currentEnrollment.access_type === 'demo') {
        return lessonId === 1;
      }
      return false;
    },

    async register(email, password) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      return { data, error };
    },

    async login(email, password) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      return { data, error };
    },

    async logout() {
      await supabase.auth.signOut();
    },

    onChange(fn) {
      authListeners.push(fn);
      if (currentUser !== null) {
        setTimeout(() => fn(currentUser, currentEnrollment), 0);
      }
      return () => { authListeners = authListeners.filter(f => f !== fn); };
    },

    getAccessType() {
      return currentEnrollment ? currentEnrollment.access_type : null;
    }
  };
})();
