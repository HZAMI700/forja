// Tab "Conocimiento" — Editable Bot Knowledge Base.
// Business owners can create and edit documents (hours, policies, FAQ, pricing).
// Documents are indexed into Vectorize upon saving.
import type { Env } from "../../env";
import { Db } from "../../db/client";
import { KbDocsRepo, FIXTURE_CHUNKS, MAX_DOC_CHARS, chunkContent, type KbDoc } from "../../kb/docs";
import { layout } from "./layout";
import { getT, getLang, type Translations } from "../i18n";

function esc(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]!),
  );
}

function ago(ms: number, t: Translations): string {
  const min = Math.floor((Date.now() - ms) / 60_000);
  if (min < 1) return t.timeJustNow;
  if (min < 60) return t.timeMinutesAgo(min);
  const h = Math.floor(min / 60);
  if (h < 24) return t.timeHoursAgo(h);
  return t.timeDaysAgo(Math.floor(h / 24));
}

/** Callout banner styled with iOS frosted alert colors. */
function banner(tone: "ok" | "bad" | "neutral", text: string): string {
  const color = tone === "ok" ? "var(--ok)" : tone === "bad" ? "var(--bad)" : "var(--dim)";
  const bg = tone === "ok" ? "rgba(48,209,88,.12)" : tone === "bad" ? "rgba(255,69,58,.12)" : "var(--panel2)";
  const border = tone === "ok" ? "rgba(48,209,88,.3)" : tone === "bad" ? "rgba(255,69,58,.3)" : "var(--line)";
  return `<div style="border:1px solid ${border};background:${bg};color:${tone === "neutral" ? "var(--muted)" : color};padding:12px 16px;border-radius:12px;font-size:12.5px;font-weight:500;margin-bottom:18px">${text}</div>`;
}

export async function renderKbList(
  env: Env,
  flash?: { saved?: boolean; deleted?: boolean; reindexed?: string },
): Promise<string> {
  const t = getT(env);
  const isEs = getLang(env) === "es";
  const docs = await new KbDocsRepo(new Db(env.DB)).list();

  const bannerHtml = flash?.saved
    ? banner("ok", t.kbSavedBanner)
    : flash?.deleted
      ? banner("neutral", t.kbDeletedBanner)
      : flash?.reindexed
        ? banner("ok", isEs ? `✓ Reindexado: ${esc(flash.reindexed)} fragmentos actualizados.` : `✓ Reindexed: ${esc(flash.reindexed)} chunks updated.`)
        : "";

  const rows = docs.length
    ? docs
        .map((d) => {
          const chunks = chunkContent(d.content).length;
          return `
      <div class="kbrow flex items-center gap-3 p-4 border-t border-line hover:bg-[rgba(255,255,255,.03)] transition-colors">
        <div style="min-width:0;flex:1">
          <a href="/admin/kb/${encodeURIComponent(d.id)}/edit" class="font-display font-semibold text-[13.5px] text-cream block hover:text-accent transition-colors">${esc(d.title)}</a>
          <div class="text-dim text-[11.5px] mt-0.5 truncate">${esc(d.content.replace(/\s+/g, " ").slice(0, 95))}</div>
        </div>
        <div class="text-dim text-[11px] text-right whitespace-nowrap flex-none">
          <div>${t.kbChars(d.content.length, chunks)}</div>
          <div class="mt-0.5">${ago(d.updated_at, t)}</div>
        </div>
        <a href="/admin/kb/${encodeURIComponent(d.id)}/edit" class="apple-btn-secondary text-[11.5px] px-3 py-1.5 rounded-lg flex-none" style="text-decoration:none">
          ${t.kbEditDoc}
        </a>
      </div>`;
        })
        .join("")
    : `<div class="text-dim text-[13px] py-12 px-4 text-center">
         ${t.kbNoDocsYet}
       </div>`;

  const body = `
    ${bannerHtml}
    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div>
        <h2 class="font-display font-semibold text-[16px] text-cream">${t.kbTitle}</h2>
        <p class="text-muted text-[12.5px] mt-0.5">${t.kbSubtitle}</p>
      </div>
      <a href="/admin/kb/new" class="apple-btn-primary font-display font-semibold text-[13px] flex items-center gap-2" style="text-decoration:none">
        <i data-lucide="plus" width="15" height="15"></i> ${t.kbNewDoc}
      </a>
    </div>

    <div class="card bg-panel border border-line rounded-2xl mb-4 overflow-hidden">
      ${rows}
    </div>

    <div class="flex flex-wrap items-center justify-between gap-3 text-dim text-[12px] px-1">
      <span>${isEs ? `Además, tu bot incluye <b class="text-cream">${FIXTURE_CHUNKS.length}</b> fragmentos precargados del sistema.` : `Your bot also comes with <b class="text-cream">${FIXTURE_CHUNKS.length}</b> preloaded system fragments.`}</span>
      <form method="POST" action="/admin/kb/reindex">
        <button class="apple-btn-secondary text-[11.5px] flex items-center gap-1.5 cursor-pointer">
          <i data-lucide="refresh-cw" width="13" height="13"></i> ${isEs ? "Reindexar todo" : "Reindex all"}
        </button>
      </form>
    </div>`;

  return layout({ title: t.navKnowledge, activeTab: "kb", body, env });
}

export function renderKbEditor(doc: KbDoc | null, env: Env): string {
  const t = getT(env);
  const isEs = getLang(env) === "es";
  const isNew = doc === null;
  const backLabel = isEs ? "Volver a Conocimiento" : "Back to Knowledge";
  const titleLabel = isEs ? "Título" : "Title";
  const titleHelp = isEs ? "Un nombre claro del tema (el bot lo ve como contexto)." : "A clear name for this topic (the bot sees this as context).";
  const titlePlaceholder = isEs ? "Ej. Horarios y ubicación" : "e.g. Business Hours & Location";
  const contentLabel = isEs ? "Contenido" : "Content";
  const contentHelp = isEs
    ? `Escribe en lenguaje natural, como se lo explicarías a un empleado nuevo. Máximo ${MAX_DOC_CHARS.toLocaleString("es-MX")} caracteres.`
    : `Write in plain natural language, as you would explain to a new team member. Max ${MAX_DOC_CHARS.toLocaleString()} characters.`;
  const contentPlaceholder = isEs
    ? "Ej. Abrimos de lunes a sábado de 9am a 7pm. Los domingos cerramos. Estamos en Av. Reforma 123…"
    : "e.g. We are open Monday through Saturday from 9am to 7pm. Closed on Sundays. Located at 123 Main Street...";
  const saveLabel = isEs ? "Guardar e indexar" : "Save & Index";
  const deleteSummary = isEs ? "Eliminar documento…" : "Delete document…";
  const deleteConfirmText = isEs ? "¿Seguro? El bot dejará de saber esto." : "Are you sure? The bot will stop knowing this.";
  const deleteButton = isEs ? "Sí, eliminar" : "Yes, delete";

  const body = `
    <div class="mb-4">
      <a href="/admin/kb" class="text-[12.5px] text-accent flex items-center gap-1.5" style="text-decoration:none">
        <i data-lucide="arrow-left" width="14" height="14"></i> ${backLabel}
      </a>
    </div>
    <form method="POST" action="/admin/kb/save" class="card bg-panel border border-line p-6 flex flex-col gap-4">
      <h2 class="font-display font-semibold text-[16px] text-cream">${isNew ? (isEs ? "＋ Nuevo documento" : "＋ New Document") : (isEs ? "Editar documento" : "Edit Document")}</h2>
      ${isNew ? "" : `<input type="hidden" name="id" value="${esc(doc.id)}">`}

      <div class="flex flex-col gap-1.5">
        <label for="title" class="font-display font-semibold text-[13px] text-cream">${titleLabel}</label>
        <p class="text-dim text-[11.5px]">${titleHelp}</p>
        <input type="text" id="title" name="title" required maxlength="200"
               value="${esc(doc?.title ?? "")}" placeholder="${titlePlaceholder}"
               class="rounded-xl"
               style="background:var(--bg);border:1px solid var(--line);color:var(--cream);padding:10px 14px;font-size:13px;outline:none">
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="content" class="font-display font-semibold text-[13px] text-cream">${contentLabel}</label>
        <p class="text-dim text-[11.5px]">${contentHelp}</p>
        <textarea id="content" name="content" rows="14" required maxlength="${MAX_DOC_CHARS}"
                  placeholder="${contentPlaceholder}"
                  class="rounded-xl"
                  style="background:var(--bg);border:1px solid var(--line);color:var(--cream);padding:12px 14px;font-size:13px;outline:none;resize:vertical;line-height:1.5">${esc(doc?.content ?? "")}</textarea>
      </div>

      <div class="flex flex-wrap items-center gap-3 pt-2">
        <button type="submit" class="apple-btn-primary font-display font-semibold text-[13px] cursor-pointer">
          ${saveLabel}
        </button>
        ${isNew ? "" : `
        <details class="ml-auto">
          <summary class="text-bad text-[12px] cursor-pointer" style="list-style:none">${deleteSummary}</summary>
          <span class="inline-flex items-center gap-3 mt-2">
            <span class="text-dim text-[11.5px]">${deleteConfirmText}</span>
            <button type="submit" formaction="/admin/kb/${encodeURIComponent(doc.id)}/delete" formnovalidate
                    class="cursor-pointer text-[11px] px-3 py-1.5 rounded-lg border border-[rgba(255,69,58,.4)] text-bad bg-[rgba(255,69,58,.1)]">
              ${deleteButton}
            </button>
          </span>
        </details>`}
      </div>
    </form>`;

  return layout({ title: isNew ? (isEs ? "Nuevo documento" : "New Document") : (isEs ? "Editar documento" : "Edit Document"), activeTab: "kb", body, env });
}
