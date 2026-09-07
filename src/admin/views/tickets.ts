import type { Env } from "../../env";
import { Db } from "../../db/client";
import { TicketsRepo } from "../../db/tickets";
import { layout } from "./layout";
import { fmtDateTime } from "../format";
import { getT } from "../i18n";

const STATUS_PILL: Record<string, { color: string; bg: string }> = {
  open: { color: "var(--bad)", bg: "rgba(255,69,58,.12)" },
  in_progress: { color: "var(--info)", bg: "rgba(10,132,255,.12)" },
};

export async function renderTickets(env: Env): Promise<string> {
  const t = getT(env);
  const repo = new TicketsRepo(new Db(env.DB));
  const open = await repo.listOpen();

  const list = open
    .map((tk) => {
      const date = fmtDateTime(tk.created_at);
      const pill = STATUS_PILL[tk.status] ?? { color: "var(--muted)", bg: "rgba(255,255,255,.05)" };
      return `<div class="card bg-panel border border-line p-5 rounded-2xl mb-3 flex flex-col gap-3">
        <div class="flex items-center justify-between gap-2.5">
          <div class="flex items-center gap-2 min-w-0">
            <span style="font-size:10px;letter-spacing:.05em;text-transform:uppercase;color:${pill.color};background:${pill.bg};border:1px solid ${pill.color};border-radius:9999px;padding:2px 8px;font-weight:700;flex:none">${tk.status.toUpperCase()}</span>
            <span class="font-display font-semibold text-[14px] text-cream truncate">${tk.category}</span>
          </div>
          <span class="text-dim text-[11px] flex-none">${date}</span>
        </div>
        <p class="text-muted text-[12.5px] leading-relaxed m-0">${tk.summary}</p>
        <form method="POST" action="/admin/tickets/${tk.id}/resolve" class="flex gap-2 mt-1">
          <input name="resolved_by" placeholder="${t.ticketsYourEmail}" required
                 class="rounded-xl flex-1"
                 style="background:var(--bg);border:1px solid var(--line);color:var(--cream);padding:9px 12px;font-size:12.5px;outline:none">
          <button class="apple-btn-primary font-display font-semibold text-[12px] cursor-pointer whitespace-nowrap">
            ${t.ticketsResolve}
          </button>
        </form>
      </div>`;
    })
    .join("");

  const body =
    open.length === 0
      ? `<div class="card bg-panel border border-line rounded-2xl py-12 px-4 text-center">
           <p class="text-dim text-[13px] m-0">${t.ticketsNoOpen}</p>
         </div>`
      : `<div class="flex flex-col gap-1 mb-4">
           <h2 class="font-display font-semibold text-[16px] text-cream">${t.ticketsTitle} (${open.length})</h2>
         </div>
         <div>${list}</div>`;

  return layout({ title: t.navTickets, activeTab: "tickets", body, env });
}
