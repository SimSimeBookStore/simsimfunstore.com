// Supabase browser configuration. Use only the public anon/publishable key here.
window.SUPABASE_CONFIG = {
    url: "https://vcsfpaemlxofgbtuksct.supabase.co",
    anonKey: ""
};

window.supabaseClient = null;
if (window.supabase && window.SUPABASE_CONFIG.anonKey) {
    window.supabaseClient = window.supabase.createClient(
        window.SUPABASE_CONFIG.url,
        window.SUPABASE_CONFIG.anonKey
    );
}
