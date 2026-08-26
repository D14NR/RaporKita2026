import { Database } from 'sqlite3';
const db = new Database('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/xxx'); // wait, the db is likely in memory or somewhere? No, I can just use a node script to hit the D1. But wait, it's a browser sqlite? No, we use supabase in some places?
