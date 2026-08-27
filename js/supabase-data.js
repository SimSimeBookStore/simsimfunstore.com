function hasSupabaseConnection() {
    return Boolean(window.supabaseClient);
}

async function getSupabaseUser() {
    if (!hasSupabaseConnection()) return null;
    const { data, error } = await window.supabaseClient.auth.getUser();
    if (error && error.name !== "AuthSessionMissingError") throw error;
    return data.user;
}

async function loadLibraryFromSupabase() {
    const user = await getSupabaseUser();
    if (!user) return null;
    const { data, error } = await window.supabaseClient
        .from("library_items")
        .select("product_data")
        .eq("user_id", user.id)
        .order("purchased_at", { ascending: false });
    if (error) throw error;
    return data.map(row => row.product_data);
}

