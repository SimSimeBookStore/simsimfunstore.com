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
    return data.map(row => {
        const item = row.product_data || {};
        const catalogProduct = (typeof SIMSIM_PRODUCTS !== "undefined" && Array.isArray(SIMSIM_PRODUCTS))
            ? SIMSIM_PRODUCTS.find(p => p.id === item.id)
            : null;
        return catalogProduct ? { ...catalogProduct, ...item } : item;
    });
}

async function getUserLibraryMerged(userEmail) {
    let email = userEmail;
    if (!email && hasSupabaseConnection()) {
        try {
            const sbUser = await getSupabaseUser();
            if (sbUser?.email) email = sbUser.email;
        } catch (e) {}
    }
    if (!email) {
        email = localStorage.getItem("simsim_user");
    }

    const localKey = email ? `simsim_library_${email}` : null;

    if (hasSupabaseConnection()) {
        try {
            const onlineLibrary = await loadLibraryFromSupabase();
            if (onlineLibrary !== null) {
                if (localKey) {
                    localStorage.setItem(localKey, JSON.stringify(onlineLibrary));
                }
                return onlineLibrary;
            }
        } catch (error) {
            console.error("Could not load online library, using local storage fallback.", error);
        }
    }

    let localLibrary = localKey ? (JSON.parse(localStorage.getItem(localKey)) || []) : [];
    return localLibrary.map(item => {
        const catalogProduct = (typeof SIMSIM_PRODUCTS !== "undefined" && Array.isArray(SIMSIM_PRODUCTS))
            ? SIMSIM_PRODUCTS.find(p => p.id === item.id)
            : null;
        return catalogProduct ? { ...catalogProduct, ...item } : item;
    });
}

