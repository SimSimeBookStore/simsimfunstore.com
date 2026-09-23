export async function onRequestPost({ env }) {
    if (!env.DB) {
        return Response.json({ error: "Visitor counter is not configured" }, { status: 503 });
    }

    await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS site_stats (
            key TEXT PRIMARY KEY,
            visits INTEGER NOT NULL DEFAULT 0
        )
    `).run();

    await env.DB.prepare(`
        INSERT OR IGNORE INTO site_stats (key, visits) VALUES ('homepage', 0)
    `).run();

    await env.DB.prepare(`
        UPDATE site_stats SET visits = visits + 1 WHERE key = 'homepage'
    `).run();

    const result = await env.DB.prepare(`
        SELECT visits FROM site_stats WHERE key = 'homepage'
    `).first();

    return Response.json({ visits: result.visits });
}