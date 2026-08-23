// Supabase browser configuration. Use only the public anon/publishable key here.
window.SUPABASE_CONFIG = {
    url: "https://vcsfpaemlxofgbtuksct.supabase.co",
    anonKey: "sb_publishable_0DwiZpdMj9Bjt8xUcjWg9g_HoWh71f1"
};

window.supabaseClient = null;
if (window.supabase && window.SUPABASE_CONFIG.anonKey) {
    window.supabaseClient = window.supabase.createClient(
        window.SUPABASE_CONFIG.url,
        window.SUPABASE_CONFIG.anonKey
    );
}
