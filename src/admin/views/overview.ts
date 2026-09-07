import type { Env } from "../../env";
import { Db } from "../../db/client";
import { layout } from "./layout";
import { costOfUsage, type ModelId } from "../../pricing";
import { resolveAgentConfig, type AgentConfig } from "../../settings-loader";
import { buildTools } from "../../tools";
import { resolveProvider, modelIdFor } from "../../llm/provider";
import { handoffNotifyStatus } from "../../tools/handoffHuman";
import { connectionsSummary } from "./conexiones";
import { KbDocsRepo, FIXTURE_CHUNKS } from "../../kb/docs";
import { InsightsRepo } from "../../db/insights";
import { SuggestionsRepo } from "../../db/suggestions";
import { channelLabel } from "../../channels/labels";
import { getNiche } from "../../niches";
import { getT, type Translations } from "../i18n";

function esc(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]!),
  );
}

/** Short relative time with i18n support. */
function ago(ms: number | null | undefined, t: Translations): string {
  if (!ms) return "—";
  const min = Math.floor((Date.now() - ms) / 60_000);
  if (min < 1) return t.timeJustNow;
  if (min < 60) return t.timeMinutesAgo(min);
  const h = Math.floor(min / 60);
  if (h < 24) return t.timeHoursAgo(h);
  return t.timeDaysAgo(Math.floor(h / 24));
}

/** Two-letter avatar initials from a display name (or channel-id fallback). */
function initialsOf(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts.slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";
}

/** "auto" or the concrete model id the agent is pinned to. */
function agentModelLabel(env: Env, cfg: AgentConfig): string {
  if (cfg.modelOverride === "auto") return "auto";
  const provider = resolveProvider(env);
  return modelIdFor(env, provider, cfg.modelOverride === "haiku" ? "fast" : "smart");
}

export async function renderOverview(env: Env): Promise<string> {
  const db = new Db(env.DB);
  const niche = getNiche(env);
  const t = getT(env);
  const oneDay = Date.now() - 86_400_000;
  const sevenDays = Date.now() - 7 * 86_400_000;
  const thirtyDays = Date.now() - 30 * 86_400_000;

  let todayMsgs = 0;
  let todayConvs = 0;
  let todayLeads = 0;
  let monthMsgs = 0;
  let totalCost = 0;
  let openTickets = 0;
  let activityRows: Array<{ day: string; msgs: number }> = [];
  let recentConvs: Array<{
    id: string;
    display_name: string | null;
    channel_user_id: string | null;
    channel: string;
    last_message_at: number | null;
    last_msg: string | null;
  }> = [];
  let proposedSuggestions: Array<any> = [];
  let kbDocsCount = 0;
  let resolvedPct7d: number | null = null;

  try {
    todayMsgs = (await db.first<{ n: number }>(
      "SELECT COUNT(*) as n FROM messages WHERE created_at > ?", [oneDay],
    ))?.n ?? 0;
    todayConvs = (await db.first<{ n: number }>(
      "SELECT COUNT(DISTINCT conversation_id) as n FROM messages WHERE created_at > ?", [oneDay],
    ))?.n ?? 0;
    todayLeads = (await db.first<{ n: number }>(
      "SELECT COUNT(*) as n FROM leads WHERE created_at > ?", [oneDay],
    ))?.n ?? 0;
    monthMsgs = (await db.first<{ n: number }>(
      "SELECT COUNT(*) as n FROM messages WHERE created_at > ?", [thirtyDays],
    ))?.n ?? 0;

    const tokenUsage = await db.all<{ model_used: string; input: number; output: number; cached: number }>(
      `SELECT model_used,
              SUM(COALESCE(input_tokens, 0)) as input,
              SUM(COALESCE(output_tokens, 0)) as output,
              SUM(COALESCE(cached_input_tokens, 0)) as cached
       FROM messages WHERE created_at > ? GROUP BY model_used`,
      [thirtyDays],
    );
    for (const row of tokenUsage) {
      if (!row.model_used) continue;
      totalCost += costOfUsage(row.model_used as ModelId, {
        input: row.input,
        output: row.output,
        cached: row.cached,
      });
    }

    openTickets = (await db.first<{ n: number }>(
      "SELECT COUNT(*) as n FROM tickets WHERE status != 'resolved'",
    ))?.n ?? 0;

    activityRows = await db.all<{ day: string; msgs: number }>(
      `SELECT date(created_at / 1000, 'unixepoch') as day, COUNT(*) as msgs
       FROM messages WHERE created_at > ? GROUP BY day ORDER BY day ASC`,
      [sevenDays],
    );

    const docs = await new KbDocsRepo(db).list();
    kbDocsCount = docs.length;

    const insight7d = await new InsightsRepo(db).stats(sevenDays);
    resolvedPct7d =
      insight7d.analyzed > 0 ? Math.round((insight7d.resolvedNoHuman / insight7d.analyzed) * 100) : null;

    recentConvs = await db.all<{
      id: string;
      display_name: string | null;
      channel_user_id: string | null;
      channel: string;
      last_message_at: number | null;
      last_msg: string | null;
    }>(
      `SELECT c.id, c.display_name, c.channel_user_id, c.channel, c.last_message_at,
         (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_msg
       FROM conversations c ORDER BY c.last_message_at DESC LIMIT 5`,
    );

    proposedSuggestions = await new SuggestionsRepo(db).listProposed();
  } catch (e) {
    console.warn("renderOverview: DB query warning:", e);
  }

  // --- Actividad 7 días ---------------------------------------------------------
  const activityByDay = new Map(activityRows.map((r) => [r.day, r.msgs]));
  const activityDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86_400_000);
    const key = d.toISOString().slice(0, 10);
    return { dow: d.getUTCDay(), msgs: activityByDay.get(key) ?? 0, isToday: i === 6 };
  });
  const activityMax = Math.max(...activityDays.map((d) => d.msgs), 1);

  // --- Estado del agente ----------------------------------------------------------
  const toolNames = Object.keys(buildTools({ env, getConversationId: () => null }));
  const agentCfg = await resolveAgentConfig(env, toolNames);
  const totalKbDocs = kbDocsCount + FIXTURE_CHUNKS.length;

  // --- Markup: actividad + estado del agente -----------------------------------------
  const activityChart = `
    <div class="card bg-panel border border-line p-5" style="animation-delay:.22s">
      <div class="font-display font-semibold text-[15px] text-cream flex items-center gap-2 mb-0.5">
        <div class="w-7 h-7 rounded-lg bg-[rgba(10,132,255,.14)] text-info flex items-center justify-center flex-none">
          <i data-lucide="bar-chart-3" width="16" height="16"></i>
        </div>
        <span>${t.activity7d}</span>
      </div>
      <div class="text-[11.5px] text-dim mb-2">${t.msgsProcessedPerDay}</div>
      <div class="flex items-end gap-3" style="height:150px;padding-top:16px">
        ${activityDays
          .map((d) => {
            const pct = d.msgs === 0 ? 4 : Math.max(8, Math.round((d.msgs / activityMax) * 90));
            const label = d.isToday ? t.todayLabel : t.dowLetters[d.dow];
            const barBg = d.isToday
              ? "linear-gradient(180deg, #0A84FF 0%, rgba(10,132,255,0.7) 100%)"
              : "rgba(255,255,255,0.12)";
            const numClass = d.isToday ? "text-accent font-semibold" : "text-muted";
            const labelClass = d.isToday ? "text-accent font-semibold" : "text-dim";
            return `
            <div class="bargrp flex-1 flex flex-col items-center gap-2" style="height:100%;justify-content:flex-end">
              <div class="text-[10px] ${numClass}">${d.msgs}</div>
              <div class="bar" style="width:100%;height:${pct}%;background:${barBg};border-radius:6px 6px 0 0"></div>
              <div class="text-[10.5px] ${labelClass}">${label}</div>
            </div>`;
          })
          .join("")}
      </div>
    </div>`;

  const agentStatus = `
    <div class="card bg-panel border border-line p-5 flex flex-col" style="animation-delay:.26s">
      <div class="font-display font-semibold text-[15px] text-cream flex items-center gap-2 mb-3.5">
        <div class="w-7 h-7 rounded-lg bg-[rgba(48,209,88,.14)] text-ok flex items-center justify-center flex-none">
          <i data-lucide="activity" width="16" height="16"></i>
        </div>
        <span>${t.agentStatus}</span>
      </div>
      <div class="flex flex-col gap-[11px] text-[12.5px]">
        <div class="flex items-center justify-between">
          <span class="text-muted">${t.activeModel}</span>
          <span class="font-semibold font-mono text-[11.5px] bg-[rgba(255,255,255,.06)] border border-line px-2.5 py-0.5 rounded-full">${esc(agentModelLabel(env, agentCfg))}</span>
        </div>
        <div style="height:1px;background:var(--line)"></div>
        <div class="flex items-center justify-between">
          <span class="text-muted">${t.activeTools}</span>
          <span class="font-semibold">${agentCfg.enabledToolNames.length} <span class="text-dim font-normal">${t.ofTools(toolNames.length)}</span></span>
        </div>
        <div style="height:1px;background:var(--line)"></div>
        <div class="flex items-center justify-between">
          <span class="text-muted">${t.knowledgeDocs}</span>
          <span class="font-semibold">${totalKbDocs} <span class="text-dim font-normal">${t.preloadedDocs(FIXTURE_CHUNKS.length)}</span></span>
        </div>
        <div style="height:1px;background:var(--line)"></div>
        <div class="flex items-center justify-between">
          <span class="text-muted">${t.resolvedWithoutHuman}</span>
          <span class="font-semibold ${resolvedPct7d === null ? "text-dim" : "text-ok"}">${resolvedPct7d === null ? "—" : `${resolvedPct7d}%`}</span>
        </div>
      </div>
      <a href="/admin/agente" class="bigbtn font-display font-semibold text-[13px] cursor-pointer flex items-center justify-center gap-2"
         style="background:var(--accent);color:#ffffff;border:none;border-radius:12px;box-shadow:0 4px 16px rgba(10,132,255,.35);padding:12px;margin-top:18px">
        <i data-lucide="sliders" width="16" height="16"></i> ${t.adjustMyAgent}
      </a>
    </div>`;

  // --- Markup: conversaciones recientes + mejoras sugeridas --------------------------
  const convRows =
    recentConvs
      .map((c) => {
        const label = c.display_name ?? c.channel_user_id ?? "—";
        const name = esc(label);
        const initials = initialsOf(label);
        const preview = esc((c.last_msg ?? "").replace(/\s+/g, " ").slice(0, 60)) || "—";
        const chanColor = c.channel === "twilio" || c.channel === "whatsapp" ? "var(--info)" : "var(--accent-2)";
        return `
        <a href="/admin/conversations?c=${encodeURIComponent(c.id)}" class="convrow flex items-center gap-3" style="padding:12px 18px;border-top:1px solid var(--line);cursor:pointer">
          <div class="flex items-center justify-center flex-none rounded-xl" style="width:36px;height:36px;background:var(--raise);border:1px solid var(--linelit);font-size:12px;font-weight:700;color:var(--accent)">${initials}</div>
          <div class="flex-1" style="min-width:0">
            <div class="flex items-center gap-2">
              <span class="text-[13px] font-semibold text-cream">${name}</span>
              <span style="font-size:9.5px;letter-spacing:.03em;color:${chanColor};background:rgba(255,255,255,.04);border:1px solid ${chanColor};border-radius:9999px;padding:1px 7px">${esc(channelLabel(c.channel))}</span>
            </div>
            <div class="text-[12px] text-muted mt-0.5" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${preview}</div>
          </div>
          <div class="text-[10.5px] text-dim flex-none">${ago(c.last_message_at, t)}</div>
          <i data-lucide="chevron-right" width="16" height="16" class="arr flex-none" style="color:var(--accent);opacity:0;transform:translateX(-4px);transition:all .15s ease"></i>
        </a>`;
      })
      .join("") || `<div class="text-center text-[12.5px] text-dim" style="padding:32px 16px">${t.noConversationsYet}</div>`;

  const recentConversations = `
    <div class="card bg-panel border border-line" style="animation-delay:.3s">
      <div class="flex items-center justify-between" style="padding:16px 18px 12px">
        <div class="font-display font-semibold text-[15px] text-cream flex items-center gap-2">
          <div class="w-7 h-7 rounded-lg bg-[rgba(10,132,255,.14)] text-info flex items-center justify-center flex-none">
            <i data-lucide="messages-square" width="16" height="16"></i>
          </div>
          <span>${t.recentConversations}</span>
        </div>
        <a href="/admin/conversations" class="flex items-center gap-1 text-[12px] font-medium text-accent hover:text-[#409cff]">${t.viewAll} <i data-lucide="chevron-right" width="14" height="14"></i></a>
      </div>
      <div>${convRows}</div>
    </div>`;

  const suggestionItems =
    proposedSuggestions.length === 0
      ? `<p class="text-[12px] text-dim">${t.noPendingImprovements}</p>`
      : proposedSuggestions
          .slice(0, 2)
          .map(
            (s) =>
              `<div class="text-[12.5px] text-cream mb-2" style="border:1px solid var(--line);border-radius:12px;background:rgba(255,255,255,.04);padding:10px 14px;line-height:1.45">${esc(s.title)}</div>`,
          )
          .join("");

  const suggestedImprovements = `
    <div class="card bg-panel border border-line p-5 relative overflow-hidden" style="animation-delay:.34s;background:linear-gradient(155deg, rgba(94,92,230,.12), var(--panel));border-color:var(--linelit)">
      <div class="flex items-center gap-2 mb-1">
        <div class="w-7 h-7 rounded-lg bg-[rgba(94,92,230,.2)] text-accent2 flex items-center justify-center flex-none">
          <i data-lucide="sparkles" width="16" height="16"></i>
        </div>
        <span class="font-display font-semibold text-[15px] text-cream">${t.suggestedImprovements}</span>
      </div>
      <div class="text-[11.5px] text-dim mb-3.5">
        ${t.suggestionsDetected(proposedSuggestions.length)}
      </div>
      ${suggestionItems}
      <a href="/admin/mejoras" class="flex items-center gap-1 text-[12px] font-medium text-accent2 mt-3">${t.viewAll} <i data-lucide="chevron-right" width="14" height="14"></i></a>
    </div>`;

  const body = `
    <div class="flex flex-col gap-[22px]">
      <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[14px]">
        <div class="card bg-panel border border-line p-4 relative overflow-hidden" style="animation-delay:.02s">
          <div class="flex items-center justify-between text-muted">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-[rgba(10,132,255,.14)] text-info flex items-center justify-center">
                <i data-lucide="message-circle" width="15" height="15"></i>
              </div>
              <span class="text-[11px] font-semibold tracking-wider text-muted">${t.messagesToday}</span>
            </div>
            <span class="text-[10px] font-mono text-dim">01</span>
          </div>
          <div class="glow font-display font-bold text-[34px] leading-none mt-3.5 text-cream">${todayMsgs}</div>
          <div class="text-[11px] text-dim mt-2">${t.last24h}</div>
        </div>

        <div class="card bg-panel border border-line p-4 relative overflow-hidden" style="animation-delay:.06s">
          <div class="flex items-center justify-between text-muted">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-[rgba(94,92,230,.14)] text-accent2 flex items-center justify-center">
                <i data-lucide="users" width="15" height="15"></i>
              </div>
              <span class="text-[11px] font-semibold tracking-wider text-muted">${t.uniqueCustomers}</span>
            </div>
            <span class="text-[10px] font-mono text-dim">02</span>
          </div>
          <div class="glow font-display font-bold text-[34px] leading-none mt-3.5 text-cream">${todayConvs}</div>
          <div class="text-[11px] text-dim mt-2">${t.distinctConvsToday}</div>
        </div>

        <div class="card bg-panel border border-line p-4 relative overflow-hidden" style="animation-delay:.1s">
          <div class="flex items-center justify-between text-muted">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-[rgba(48,209,88,.14)] text-ok flex items-center justify-center">
                <i data-lucide="${niche.navIcon}" width="15" height="15"></i>
              </div>
              <span class="text-[11px] font-semibold tracking-wider text-muted">${niche.kpiLabel.toUpperCase()}</span>
            </div>
            <span class="text-[10px] font-mono text-dim">03</span>
          </div>
          <div class="glow font-display font-bold text-[34px] leading-none mt-3.5 text-ok">${todayLeads}</div>
          <div class="text-[11px] text-dim mt-2">${t.kpiNewToday}</div>
        </div>

        <div class="card bg-panel border border-line p-4 relative overflow-hidden" style="animation-delay:.14s">
          <div class="flex items-center justify-between text-muted">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-[rgba(255,159,10,.14)] text-[#FF9F0A] flex items-center justify-center">
                <i data-lucide="coins" width="15" height="15"></i>
              </div>
              <span class="text-[11px] font-semibold tracking-wider text-muted">${t.monthCost}</span>
            </div>
            <span class="text-[10px] font-mono text-dim">04</span>
          </div>
          <div class="glow font-display font-bold text-[34px] leading-none mt-3.5 text-cream">$${totalCost.toFixed(2)}</div>
          <div class="text-[11px] text-dim mt-2">${t.monthMsgsClaude30d(monthMsgs)}</div>
        </div>
      </section>

      <section class="card bg-panel border border-line p-5" style="animation-delay:.18s">
        <div class="flex items-center justify-between">
          <div class="font-display font-semibold text-[15px] text-cream flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg bg-[rgba(48,209,88,.14)] text-ok flex items-center justify-center flex-none">
              <i data-lucide="heart-pulse" width="16" height="16"></i>
            </div>
            <span>${t.botHealth}</span>
          </div>
          <a href="/admin/tickets" class="flex items-center gap-1 text-[12px] font-medium text-accent hover:text-[#409cff]">
            ${t.viewTickets} <i data-lucide="chevron-right" width="14" height="14"></i>
          </a>
        </div>
        <div class="mt-3.5" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          ${
            openTickets > 0
              ? `<span style="font-size:11px;font-weight:600;color:var(--bad);background:rgba(255,69,58,.12);border:1px solid rgba(255,69,58,.25);border-radius:9999px;padding:3px 10px">${t.ticketsOpen(openTickets)}</span>`
              : `<span style="font-size:11px;font-weight:600;color:var(--ok);background:rgba(48,209,88,.12);border:1px solid rgba(48,209,88,.25);border-radius:9999px;padding:3px 10px">${t.zeroTicketsOpen}</span>`
          }
          ${(() => {
            const notify = handoffNotifyStatus(env);
            return notify.ok
              ? `<span style="font-size:11px;font-weight:600;color:var(--ok);background:rgba(48,209,88,.12);border:1px solid rgba(48,209,88,.25);border-radius:9999px;padding:3px 10px">${t.handoffNotifiesVia(notify.channels.join(" + "))}</span>`
              : `<span style="font-size:11px;font-weight:600;color:var(--bad);background:rgba(255,69,58,.12);border:1px solid rgba(255,69,58,.25);border-radius:9999px;padding:3px 10px">${t.handoffNoNotice}</span>`;
          })()}
          ${(() => {
            const conn = connectionsSummary(env);
            const ok = conn.connected > 0;
            const color = ok ? "var(--ok)" : "var(--bad)";
            const bg = ok ? "rgba(48,209,88,.12)" : "rgba(255,69,58,.12)";
            const border = ok ? "rgba(48,209,88,.25)" : "rgba(255,69,58,.25)";
            return `<a href="/admin/conexiones" style="font-size:11px;font-weight:600;color:${color};background:${bg};border:1px solid ${border};border-radius:9999px;padding:3px 10px;text-decoration:none">${ok ? "✓" : "⚠"} ${t.channelsConnected(conn.connected, conn.total)}</a>`;
          })()}
        </div>
      </section>

      <section class="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-[14px]">
        ${activityChart}
        ${agentStatus}
      </section>

      <section class="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-[14px]">
        ${recentConversations}
        ${suggestedImprovements}
      </section>
    </div>`;

  return layout({ title: "Overview", activeTab: "overview", body, env });
}
