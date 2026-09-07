import type { Env } from "../../env";
import { Db } from "../../db/client";
import { LeadsRepo, leadMetadata, type Lead } from "../../db/leads";
import { getNiche } from "../../niches";
import { layout } from "./layout";
import { fmtDate, fmtDateTime } from "../format";

// Escapa texto del LLM/cliente antes de meterlo en HTML (el intent y las notas
// pueden traer <, &, links pegados por el cliente, etc.).
function esc(v: string | null | undefined): string {
  return (v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

interface Col {
  h: string;
  w: string;
  cell: (l: Lead, meta: Record<string, string>) => string;
}

import { getT, getLang } from "../i18n";

export async function renderLeads(env: Env): Promise<string> {
  const t = getT(env);
  const isEs = getLang(env) === "es";
  const niche = getNiche(env);
  const leads = new LeadsRepo(new Db(env.DB));
  const list = await leads.list(100);

  const statusLabel = (s: Lead["status"]) => niche.statusLabels[s] ?? s;

  // Columns: core (date, name, contact) + niche columns or summary + status.
  const cols: Col[] = [
    { h: t.leadsDate, w: "94px", cell: (l) => `<span class="text-dim">${fmtDate(l.created_at)}</span>` },
    { h: t.leadsName, w: "minmax(120px,1.1fr)", cell: (l) => `<span class="text-cream" style="display:flex;align-items:center;gap:7px"><i data-lucide="chevron-right" width="13" height="13" class="chev" style="flex:none;transition:transform .12s ease"></i>${esc(l.name) || t.leadsNoName}</span>` },
    { h: t.leadsContact, w: "minmax(110px,1fr)", cell: (l) => `<span class="text-muted">${esc(l.contact) || "—"}</span>` },
  ];
  if (niche.columns.length) {
    for (const c of niche.columns) {
      cols.push({ h: c.label, w: "minmax(78px,.85fr)", cell: (_l, meta) => `<span class="text-muted truncate">${esc(meta[c.key]) || "—"}</span>` });
    }
  } else {
    cols.push({ h: t.leadsSummary, w: "minmax(200px,1.8fr)", cell: (l) => `<span class="text-muted truncate">${esc(l.intent)}</span>` });
  }
  cols.push({
    h: t.leadsStatus,
    w: "132px",
    cell: (l) => `<form method="POST" action="/admin/leads/${l.id}/status" onclick="event.stopPropagation()">
      <select name="status" onchange="this.form.submit()"
              class="rounded-lg"
              style="width:100%;background:var(--bg);border:1px solid var(--line);color:var(--cream);padding:6px 8px;font-size:11.5px;outline:none;cursor:pointer">
        ${(["new", "contacted", "sold", "lost"] as const)
          .map((s) => `<option ${l.status === s ? "selected" : ""} value="${s}">${esc(statusLabel(s))}</option>`)
          .join("")}
      </select>
    </form>`,
  });

  const gridCols = cols.map((c) => c.w).join(" ");
  const minWidth = 640 + niche.columns.length * 90;

  const rows = list
    .map((l) => {
      const meta = leadMetadata(l);
      const fullDate = fmtDateTime(l.created_at);
      const convLink = l.conversation_id
        ? `<a href="/admin/conversations?c=${encodeURIComponent(l.conversation_id)}" class="text-accent flex items-center gap-1.5 text-[12px]" style="text-decoration:none">
             <i data-lucide="messages-square" width="13" height="13"></i> ${isEs ? "Ver conversación completa" : "View full conversation"}
           </a>`
        : `<span class="text-dim text-[11.5px]">${isEs ? "Sin conversación ligada" : "No linked conversation"}</span>`;

      const metaRows = Object.entries(meta)
        .map(([k, v]) => `<span class="text-muted text-[12px]"><span class="text-dim">${esc(k)}:</span> ${esc(v)}</span>`)
        .join("");
      return `<div class="lead border-t border-line">
        <div class="leadrow hover:bg-[rgba(255,255,255,.03)] transition-colors" onclick="var d=this.parentNode.querySelector('.lead-detail');var open=d.style.display==='block';d.style.display=open?'none':'block';this.querySelector('.chev').style.transform=open?'rotate(0deg)':'rotate(90deg)'"
             style="display:grid;grid-template-columns:${gridCols};gap:12px;padding:13px 18px;font-size:12.5px;align-items:center;cursor:pointer">
          ${cols.map((c) => c.cell(l, meta)).join("")}
        </div>
        <div class="lead-detail" style="display:none;padding:4px 18px 20px 18px;background:var(--bg)">
          <div style="max-width:760px;display:flex;flex-direction:column;gap:14px;padding-top:14px">
            ${metaRows ? `<div><div style="font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--dim);margin-bottom:6px">${isEs ? "Datos" : "Data"}</div><div style="display:flex;flex-wrap:wrap;gap:6px 18px">${metaRows}</div></div>` : ""}
            <div>
              <div style="font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--dim);margin-bottom:6px">${isEs ? "Resumen de la IA" : "AI Summary"}</div>
              <div class="text-cream" style="font-size:13px;line-height:1.55;white-space:pre-wrap">${esc(l.intent)}</div>
            </div>
            ${l.notes ? `<div>
              <div style="font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--dim);margin-bottom:6px">${isEs ? "Notas" : "Notes"}</div>
              <div class="text-muted" style="font-size:12.5px;line-height:1.5;white-space:pre-wrap">${esc(l.notes)}</div>
            </div>` : ""}
            <div style="display:flex;align-items:center;gap:18px;flex-wrap:wrap;padding-top:2px">
              ${convLink}
              <span class="text-dim" style="font-size:11.5px;display:inline-flex;align-items:center;gap:6px"><i data-lucide="clock" width="12" height="12"></i>${fullDate}</span>
            </div>
          </div>
        </div>
      </div>`;
    })
    .join("");

  const empty = `<div style="padding:40px 18px;text-align:center" class="text-dim text-[12.5px]">${isEs ? `Aún no hay ${esc(niche.recordPlural.toLowerCase())}.` : `No ${esc(niche.recordPlural.toLowerCase())} yet.`}</div>`;
  const header = cols
    .map((c) => `<span>${esc(c.h)}</span>`)
    .join("");

  const body = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
      <h2 class="font-display font-semibold text-[16px] text-cream">${esc(niche.recordPlural)}</h2>
      <a href="/admin/leads/export.csv" class="apple-btn-secondary text-[12px] flex items-center gap-1.5" style="text-decoration:none">
        <i data-lucide="download" width="14" height="14"></i> ${isEs ? "Exportar CSV" : "Export CSV"}
      </a>
    </div>
    <div class="card bg-panel border border-line rounded-2xl" style="overflow-x:auto">
      <div style="min-width:${minWidth}px">
        <div style="display:grid;grid-template-columns:${gridCols};gap:12px;padding:12px 18px;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--dim);border-bottom:1px solid var(--line)">
          ${header}
        </div>
        ${list.length ? rows : empty}
      </div>
    </div>`;
  return layout({ title: niche.recordPlural, activeTab: "leads", body, env });
}

export async function exportLeadsCsv(env: Env): Promise<string> {
  const leads = new LeadsRepo(new Db(env.DB));
  const list = await leads.list(10_000);
  const header = "fecha,nombre,contacto,intent,status,notas,metadata\n";
  const rows = list.map((l) => {
    const date = new Date(l.created_at).toISOString();
    const esc = (v: string | null) => `"${(v ?? "").replace(/"/g, '""')}"`;
    return `${date},${esc(l.name)},${esc(l.contact)},${esc(l.intent)},${l.status},${esc(l.notes)},${esc(l.metadata)}`;
  }).join("\n");
  return header + rows;
}
