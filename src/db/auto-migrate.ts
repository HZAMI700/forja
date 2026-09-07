import type { D1Database } from "@cloudflare/workers-types";

export const SCHEMA_STATEMENTS: string[] = [
  // Conversations
  `CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    channel TEXT NOT NULL,
    channel_user_id TEXT NOT NULL,
    display_name TEXT,
    started_at INTEGER NOT NULL,
    last_message_at INTEGER NOT NULL,
    paused_until INTEGER,
    open_ticket_id TEXT,
    metadata TEXT
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_conv_unique ON conversations(channel, channel_user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_conv_last_msg ON conversations(last_message_at)`,

  // Messages
  `CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    tool_calls TEXT,
    model_used TEXT,
    input_tokens INTEGER,
    output_tokens INTEGER,
    cached_input_tokens INTEGER,
    audio_seconds REAL,
    image_count INTEGER,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS idx_msg_conv_created ON messages(conversation_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_msg_created ON messages(created_at)`,

  // Leads
  `CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    conversation_id TEXT,
    name TEXT,
    contact TEXT,
    channel_user_id TEXT,
    intent TEXT NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'new',
    exported_to TEXT,
    external_id TEXT,
    metadata TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)`,
  `CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at)`,

  // Tickets
  `CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    conversation_id TEXT,
    category TEXT,
    summary TEXT NOT NULL,
    transcript TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    resolved_at INTEGER,
    resolved_by TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status)`,

  // Admin emails & magic links
  `CREATE TABLE IF NOT EXISTS admin_emails (
    email TEXT PRIMARY KEY,
    role TEXT DEFAULT 'owner',
    added_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS magic_links (
    token TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    used_at INTEGER
  )`,
  `CREATE INDEX IF NOT EXISTS idx_magic_email ON magic_links(email)`,
  `CREATE INDEX IF NOT EXISTS idx_magic_expires ON magic_links(expires_at)`,

  // Settings
  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  )`,

  // Conversation insights
  `CREATE TABLE IF NOT EXISTS conversation_insights (
    conversation_id TEXT PRIMARY KEY,
    analyzed_at INTEGER NOT NULL,
    sentiment TEXT,
    resolution TEXT,
    bot_score INTEGER,
    topics TEXT,
    summary TEXT,
    missed_kb TEXT,
    sale_opportunity INTEGER DEFAULT 0,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS idx_insights_analyzed ON conversation_insights(analyzed_at)`,

  // KB Docs
  `CREATE TABLE IF NOT EXISTS kb_docs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  )`,

  // Improvement suggestions (flywheel)
  `CREATE TABLE IF NOT EXISTS improvement_suggestions (
    id TEXT PRIMARY KEY,
    kind TEXT NOT NULL,
    fingerprint TEXT NOT NULL,
    title TEXT NOT NULL,
    payload TEXT NOT NULL,
    evidence TEXT,
    status TEXT DEFAULT 'proposed',
    created_at INTEGER NOT NULL,
    applied_at INTEGER
  )`,
  `CREATE INDEX IF NOT EXISTS idx_sugg_status ON improvement_suggestions(status)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_sugg_fp ON improvement_suggestions(kind, fingerprint)`,

  // Follow-up sends
  `CREATE TABLE IF NOT EXISTS followup_sends (
    conversation_id TEXT PRIMARY KEY,
    reason TEXT NOT NULL,
    sent_at INTEGER NOT NULL
  )`,

  // Customer facts
  `CREATE TABLE IF NOT EXISTS customer_facts (
    conversation_id TEXT NOT NULL,
    fact TEXT NOT NULL,
    learned_at INTEGER NOT NULL,
    PRIMARY KEY (conversation_id, fact)
  )`,

  // Tracked links
  `CREATE TABLE IF NOT EXISTS tracked_links (
    code TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    target TEXT NOT NULL,
    target_url TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    clicks INTEGER NOT NULL DEFAULT 0,
    last_click_at INTEGER
  )`,
  `CREATE INDEX IF NOT EXISTS idx_tracked_links_conv ON tracked_links(conversation_id)`,

  // Keyword hits
  `CREATE TABLE IF NOT EXISTS keyword_hits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword TEXT NOT NULL,
    conversation_id TEXT NOT NULL,
    phase TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_keyword_hits_kw ON keyword_hits(keyword)`,

  // Conversation labels
  `CREATE TABLE IF NOT EXISTS conv_labels (
    conversation_id TEXT PRIMARY KEY,
    variant TEXT,
    interest TEXT,
    objection TEXT,
    summary TEXT,
    labeled_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_conv_labels_interest ON conv_labels(interest)`,

  // Template sends
  `CREATE TABLE IF NOT EXISTS template_sends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_key TEXT NOT NULL,
    conversation_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    template_sid TEXT,
    sent_at INTEGER NOT NULL,
    UNIQUE (campaign_key, conversation_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_template_sends_time ON template_sends(sent_at)`,
];

let schemaInitialized = false;

/**
 * Ensures that the required D1 database tables and indexes exist.
 * Runs once per isolate cold-start, or immediately if tables are missing.
 */
export async function ensureDbSchema(d1: D1Database): Promise<void> {
  if (schemaInitialized) return;

  try {
    // Quick check to see if tables already exist
    await d1.prepare("SELECT 1 FROM settings LIMIT 1").first();
    schemaInitialized = true;
    return;
  } catch {
    // Table missing or first run -> execute schema statements
  }

  for (const stmt of SCHEMA_STATEMENTS) {
    const cleanStmt = stmt.replace(/\s+/g, " ").trim();
    if (!cleanStmt) continue;
    try {
      if (typeof d1.exec === "function") {
        await d1.exec(cleanStmt);
      } else {
        await d1.prepare(cleanStmt).run();
      }
    } catch {
      try {
        await d1.prepare(cleanStmt).run();
      } catch (err2) {
        console.warn("Schema initialization statement warning:", cleanStmt, err2);
      }
    }
  }

  schemaInitialized = true;
}

/** Reset initialized flag (primarily for tests) */
export function resetSchemaInitialized(): void {
  schemaInitialized = false;
}
