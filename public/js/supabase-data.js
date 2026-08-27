function hasSupabaseConnection() {
    return Boolean(window.supabaseClient);
}

async function getSupabaseUser() {
    if (!hasSupabaseConnection()) return null;
    const { data, error } = await window.supabaseClient.auth.getUser();
    if (error && error.name !== "AuthSessionMissingError") throw error;
    return data.user;
}

async function savePurchasedItemsToSupabase(items, paymentId) {
    const user = await getSupabaseUser();
    if (!user) return false;

    const libraryRows = items.map(item => ({
        user_id: user.id,
        product_id: item.id,
        product_data: item
    }));
    const purchaseRows = items.map(item => ({
        user_id: user.id,
        product_id: item.id,
        product_data: item,
        paypal_transaction_id: paymentId || null,
        payment_status: "completed"
    }));

    const { error: libraryError } = await window.supabaseClient
        .from("library_items")
        .upsert(libraryRows, { onConflict: "user_id,product_id", ignoreDuplicates: true });
    if (libraryError) throw libraryError;

    const { error: purchaseError } = await window.supabaseClient
        .from("purchases")
        .insert(purchaseRows);
    if (purchaseError && purchaseError.code !== "23505") throw purchaseError;
    return true;
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

async function migrateLocalLibraryToSupabase(localItems) {
    if (!hasSupabaseConnection() || !Array.isArray(localItems) || !localItems.length) return false;
    const onlineItems = await loadLibraryFromSupabase() || [];
    const missingItems = localItems.filter(localItem =>
        !onlineItems.some(onlineItem => onlineItem.id === localItem.id)
    );
    if (missingItems.length) await savePurchasedItemsToSupabase(missingItems);
    return missingItems.length > 0;
}

async function migrateAllLocalPurchasesToSupabase(email) {
    if (!hasSupabaseConnection()) return false;

    const localLibrary = JSON.parse(localStorage.getItem(`simsim_library_${email}`)) || [];
    const allItems = localLibrary.filter((item, index, items) =>
        item && item.id && items.findIndex(candidate => candidate.id === item.id) === index
    );

    if (!allItems.length) return false;
    await migrateLocalLibraryToSupabase(allItems);
    return true;
}
