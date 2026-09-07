import type { Env } from "../../env";
import { SETTING_KEYS } from "../../db/settings";
import { renderBusinessContext } from "../../businessContext";
import { CURATED_MODELS } from "../../llm/provider";
import {
  CONTROL_LIST,
  valueToLevel,
  type ControlDef,
} from "../control-levels";
import { layout } from "./layout";
import { getT, getLang } from "../i18n";

/** Escape untrusted text before interpolating it into an HTML attribute/body. */
function esc(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]!),
  );
}

// Apple iOS Card Base with smooth hover & accent border when checked.
const CARD_BASE =
  "peer-checked:border-accent peer-checked:bg-[rgba(10,132,255,.08)] " +
  "peer-checked:[&_.card-icon]:text-accent peer-checked:[&_.card-label]:text-accent " +
  "cfgcard flex flex-col gap-1.5 h-full border border-line bg-panel2 p-4 rounded-xl cursor-pointer transition-all";

const EN_CONTROL_MAP: Record<string, {
  title: string;
  help: string;
  options: Record<string, { label: string; desc: string }>;
}> = {
  [SETTING_KEYS.tone]: {
    title: "Conversation Tone",
    help: "How your AI assistant speaks when chatting with customers.",
    options: {
      "cálido y cercano": { label: "Friendly", desc: "Warm, empathetic, and accessible" },
      "formal y profesional": { label: "Professional", desc: "Direct, courteous, and business-focused" },
      "divertido y relajado": { label: "Enthusiastic", desc: "Energetic, engaging, and celebratory" },
    },
  },
  [SETTING_KEYS.bufferSeconds]: {
    title: "Response Delay & Buffer",
    help: "Seconds the bot waits for multiple customer messages before replying.",
    options: {
      "5": { label: "Fast", desc: "Replies almost immediately (5s)" },
      "15": { label: "Normal", desc: "Feels like real human typing (15s)" },
      "30": { label: "Patient", desc: "Waits for long thoughtful bursts (30s)" },
    },
  },
  [SETTING_KEYS.maxChunks]: {
    title: "Message Delivery Style",
    help: "How many chat bubbles to split long replies across.",
    options: {
      "1": { label: "Single Bubble", desc: "Sends complete response in 1 message" },
      "3": { label: "2-3 Bubbles", desc: "Breaks response into a few natural parts" },
      "5": { label: "Short Bursts", desc: "Multiple short conversational bubbles" },
    },
  },
  [SETTING_KEYS.modelOverride]: {
    title: "AI Brain & Reasoning",
    help: "Cost efficiency vs maximum intelligence.",
    options: {
      haiku: { label: "Economical", desc: "Lowest cost, ideal for simple questions" },
      auto: { label: "Balanced", desc: "Automatically selects fast or smart per query" },
      sonnet: { label: "Maximum", desc: "Highest intelligence for complex sales and consults" },
    },
  },
  [SETTING_KEYS.botPaused]: {
    title: "Bot Live Status",
    help: "Turn the bot on or off (e.g. during holidays or for manual testing).",
    options: {
      "0": { label: "Active", desc: "The bot automatically replies to customers" },
      "1": { label: "Paused", desc: "The bot is paused; human staff take over" },
    },
  },
};

/** Render one card group (radio cards) for a level-based control. */
function renderCardGroup(control: ControlDef, settings: Record<string, string>, isEs: boolean): string {
  const currentLevel = valueToLevel(control.key, settings[control.key]);
  const enMeta = EN_CONTROL_MAP[control.key];
  const groupTitle = isEs ? control.title : (enMeta?.title ?? control.title);
  const groupHelp = isEs ? control.help : (enMeta?.help ?? control.help);

  const cards = control.options
    .map((opt) => {
      const id = `${control.key}__${opt.value}`;
      const checked = opt.label === currentLevel ? "checked" : "";
      const label = isEs ? opt.label : (enMeta?.options[opt.value]?.label ?? opt.label);
      const desc = isEs ? opt.desc : (enMeta?.options[opt.value]?.desc ?? opt.desc);

      return `
        <div class="relative">
          <input type="radio" id="${esc(id)}" name="${esc(control.key)}" value="${esc(opt.value)}"
                 class="peer sr-only absolute" ${checked}>
          <label for="${esc(id)}" class="${CARD_BASE}">
            <span class="card-icon text-dim">${opt.svg}</span>
            <span class="card-label font-display font-semibold text-[13px] text-cream">${esc(label)}</span>
            <span class="text-dim text-[11px] leading-snug">${esc(desc)}</span>
          </label>
        </div>`;
    })
    .join("");

  return `
    <fieldset class="flex flex-col gap-2">
      <legend class="font-display font-semibold text-[14px] text-cream">${esc(groupTitle)}</legend>
      <p class="text-muted text-[12px] m-0">${esc(groupHelp)}</p>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">${cards}</div>
    </fieldset>`;
}

const INPUT_STYLE =
  "background:var(--bg);border:1px solid var(--line);color:var(--cream);padding:11px 14px;font-size:12.5px;outline:none;width:100%;border-radius:12px";

/** Render a labeled single-line text field. */
function renderTextField(opts: {
  name: string;
  label: string;
  help: string;
  value: string;
  placeholder?: string;
}): string {
  return `
    <div class="flex flex-col gap-1.5">
      <label for="${esc(opts.name)}" class="font-display font-semibold text-[13px] text-cream">${esc(opts.label)}</label>
      <p class="text-dim text-[11.5px] m-0">${esc(opts.help)}</p>
      <input type="text" id="${esc(opts.name)}" name="${esc(opts.name)}"
             value="${esc(opts.value)}" placeholder="${esc(opts.placeholder ?? "")}"
             style="${INPUT_STYLE}">
    </div>`;
}

/** Render a labeled multi-line textarea. */
function renderTextArea(opts: {
  name: string;
  label: string;
  help: string;
  value: string;
  placeholder?: string;
  rows?: number;
}): string {
  return `
    <div class="flex flex-col gap-1.5">
      <label for="${esc(opts.name)}" class="font-display font-semibold text-[13px] text-cream">${esc(opts.label)}</label>
      <p class="text-dim text-[11.5px] m-0">${esc(opts.help)}</p>
      <textarea id="${esc(opts.name)}" name="${esc(opts.name)}" rows="${opts.rows ?? 4}"
                placeholder="${esc(opts.placeholder ?? "")}"
                style="${INPUT_STYLE};resize:vertical;line-height:1.5">${esc(opts.value)}</textarea>
    </div>`;
}

const SELECT_STYLE =
  "background:var(--bg);border:1px solid var(--line);color:var(--cream);padding:10px 14px;font-size:12.5px;outline:none;width:100%;border-radius:12px;cursor:pointer";

/** Sección "Modelo de IA": proveedor + API key propia + modelo concreto. */
function renderLlmSection(settings: Record<string, string>, isEs: boolean, llmTest?: string): string {
  const provider = settings[SETTING_KEYS.llmProvider] ?? "";
  const model = settings[SETTING_KEYS.llmModel] ?? "";
  const hasKey = (settings[SETTING_KEYS.llmApiKey] ?? "").trim() !== "";
  const keyTail = hasKey ? (settings[SETTING_KEYS.llmApiKey] ?? "").trim().slice(-4) : "";

  const autoLabel = isEs ? "Automático (recomendado)" : "Automatic (recommended)";
  const providerOpts = [
    { v: "", l: autoLabel },
    { v: "anthropic", l: "Claude (Anthropic)" },
    { v: "openai", l: "ChatGPT (OpenAI)" },
    { v: "xai", l: "Grok (xAI)" },
  ]
    .map((o) => `<option value="${o.v}" ${provider === o.v ? "selected" : ""}>${o.l}</option>`)
    .join("");

  const anthropicOpts = CURATED_MODELS.filter((m) => m.provider === "anthropic")
    .map((m) => `<option value="${esc(m.id)}" ${model === m.id ? "selected" : ""}>${esc(m.label)}</option>`)
    .join("");
  const openaiOpts = CURATED_MODELS.filter((m) => m.provider === "openai")
    .map((m) => `<option value="${esc(m.id)}" ${model === m.id ? "selected" : ""}>${esc(m.label)}</option>`)
    .join("");
  const xaiOpts = CURATED_MODELS.filter((m) => m.provider === "xai")
    .map((m) => `<option value="${esc(m.id)}" ${model === m.id ? "selected" : ""}>${esc(m.label)}</option>`)
    .join("");

  let testBanner = "";
  if (llmTest?.startsWith("ok:")) {
    testBanner = `<div class="p-3 rounded-xl border border-[rgba(48,209,88,.3)] text-ok text-[12px] font-semibold" style="background:rgba(48,209,88,.1)">✓ ${isEs ? `Conexión exitosa — respondió ${esc(llmTest.slice(3))}` : `Connection successful — replied ${esc(llmTest.slice(3))}`}</div>`;
  } else if (llmTest?.startsWith("err:")) {
    testBanner = `<div class="p-3 rounded-xl border border-[rgba(255,69,58,.3)] text-bad text-[12px] font-semibold" style="background:rgba(255,69,58,.1)">✕ ${isEs ? `Falló la prueba: ${esc(llmTest.slice(4, 200))}` : `Test failed: ${esc(llmTest.slice(4, 200))}`}</div>`;
  }

  const sectionTitle = isEs ? "🧠 Modelo de IA" : "🧠 AI Model";
  const sectionHelp = isEs
    ? "Elige qué inteligencia artificial usa tu bot. Puedes usar tu propia API key para pagar tú el consumo directamente. Si lo dejas en automático, el bot usa la configuración incluida (rápido para lo simple, inteligente para lo difícil)."
    : "Choose which AI intelligence powers your bot. You can bring your own API key to bill usage directly. If left on automatic, the bot uses the built-in configuration (fast for simple chats, intelligent for complex questions).";
  const providerLabel = isEs ? "Proveedor" : "Provider";
  const modelLabel = isEs ? "Modelo" : "Model";
  const autoModelText = isEs ? "Automático (rápido ⇄ inteligente)" : "Automatic (fast ⇄ smart)";
  const apiKeyLabel = isEs ? "Tu API key (opcional)" : "Your API Key (Optional)";
  const apiKeyHelp = hasKey
    ? (isEs ? `Hay una key guardada (termina en …${esc(keyTail)}). Escribe una nueva para reemplazarla, o marca la casilla para quitarla.` : `A key is currently saved (ends in …${esc(keyTail)}). Enter a new key to replace it, or check below to remove.`)
    : (isEs ? "Pégala aquí para que el consumo se cobre a tu cuenta. Vacío = usar la key incluida del sistema." : "Paste here to bill LLM usage directly to your account. Empty = use built-in system key.");
  const clearKeyLabel = isEs ? "Quitar mi API key y volver a la del sistema" : "Remove my API key and revert to system key";
  const testBtnLabel = isEs ? "⚡ Probar mi configuración (guarda primero)" : "⚡ Test configuration (save first)";

  return `
    <div class="card bg-panel border border-line p-6 rounded-2xl flex flex-col gap-4">
      <div class="flex flex-col gap-1">
        <h3 class="font-display font-semibold text-[14.5px] text-cream">${sectionTitle}</h3>
        <p class="text-dim text-[12px] m-0">${sectionHelp}</p>
      </div>
      ${testBanner}
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div class="flex flex-col gap-1.5">
          <label class="font-display font-semibold text-[13px] text-cream">${providerLabel}</label>
          <select name="${SETTING_KEYS.llmProvider}" style="${SELECT_STYLE}">${providerOpts}</select>
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="font-display font-semibold text-[13px] text-cream">${modelLabel}</label>
          <select name="${SETTING_KEYS.llmModel}" style="${SELECT_STYLE}">
            <option value="" ${model === "" ? "selected" : ""}>${autoModelText}</option>
            <optgroup label="Claude (Anthropic)">${anthropicOpts}</optgroup>
            <optgroup label="ChatGPT (OpenAI)">${openaiOpts}</optgroup>
            <optgroup label="Grok (xAI)">${xaiOpts}</optgroup>
          </select>
        </div>
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="font-display font-semibold text-[13px] text-cream">${apiKeyLabel}</label>
        <p class="text-dim text-[11.5px] m-0">${apiKeyHelp}</p>
        <input type="password" name="${SETTING_KEYS.llmApiKey}" value="" autocomplete="off"
               placeholder="${hasKey ? "••••••••••••" : "sk-ant-… or sk-…"}" style="${INPUT_STYLE}">
        ${hasKey ? `<label class="text-dim text-[11.5px] flex items-center gap-2 cursor-pointer mt-1"><input type="checkbox" name="llm_api_key_clear" value="1"> ${clearKeyLabel}</label>` : ""}
      </div>
      <div>
        <a href="/admin/config/llm-test" class="apple-btn-secondary text-[12px] inline-flex items-center gap-1.5 font-semibold"
           style="text-decoration:none">${testBtnLabel}</a>
      </div>
    </div>`;
}

/**
 * Render the Config tab.
 */
export function renderConfig(
  env: Env,
  settings: Record<string, string>,
  saved = false,
  llmTest?: string,
): string {
  const t = getT(env);
  const isEs = getLang(env) === "es";
  const cardGroups = CONTROL_LIST.map((c) => renderCardGroup(c, settings, isEs)).join("");
  const hasPromptOverride = (settings[SETTING_KEYS.systemPromptOverride] ?? "").trim() !== "";

  const savedBanner = saved
    ? `<div class="p-3.5 rounded-xl border border-[rgba(48,209,88,.35)] text-ok text-[12.5px] font-semibold" style="background:rgba(48,209,88,.12)">${isEs ? "Guardado ✓" : "Saved ✓"}</div>`
    : "";

  const pageTitle = isEs ? `Panel de control de ${esc(env.BUSINESS_NAME)}` : `Settings & Controls · ${esc(env.BUSINESS_NAME)}`;
  const pageSubtitle = isEs ? "Ajuste cómo se comporta su bot. Los cambios se aplican de inmediato al guardar." : "Customize how your AI bot behaves. Changes take effect immediately upon saving.";
  const saveBtnText = isEs ? "Guardar cambios" : "Save Changes";

  const body = `
    <form method="POST" action="/admin/config" class="flex flex-col gap-6">
      ${savedBanner}

      <div class="flex flex-col gap-1">
        <h2 class="font-display font-semibold text-[16px] text-cream">${pageTitle}</h2>
        <p class="text-muted text-[12.5px]">${pageSubtitle}</p>
      </div>

      <!-- Card-based controls (tono, velocidad, estilo, cerebro, estado) -->
      <div class="card bg-panel border border-line p-6 rounded-2xl flex flex-col gap-6">
        ${cardGroups}
      </div>

      <!-- Modelo de IA (BYO provider/key/model) -->
      ${renderLlmSection(settings, isEs, llmTest)}

      <!-- Free-text settings -->
      <div class="card bg-panel border border-line p-6 rounded-2xl flex flex-col gap-5">
        ${renderTextField({
          name: SETTING_KEYS.botName,
          label: isEs ? "Nombre del bot" : "Bot Name",
          help: isEs ? "Cómo se presenta su asistente con los clientes." : "How your AI assistant introduces itself to customers.",
          value: settings[SETTING_KEYS.botName] ?? "",
          placeholder: env.BOT_NAME ?? (isEs ? "Mi asistente" : "My Assistant"),
        })}

        ${renderTextArea({
          name: SETTING_KEYS.businessContext,
          label: isEs ? "Información del negocio" : "Business Information",
          help: isEs
            ? "Horarios, servicios, precios, ubicación. El bot responde con esto. Editable en vivo — se aplica al guardar, sin re-desplegar."
            : "Hours, services, pricing, location. The bot uses this context to answer customer questions live without redeploying.",
          value: settings[SETTING_KEYS.businessContext] || renderBusinessContext(),
          placeholder: isEs
            ? "Ej. Abrimos lunes a sábado de 9 a 7. Corte $150, barba $100. Estamos en Av. Reforma 123."
            : "e.g. Open Monday through Saturday 9am-7pm. Haircut $25, beard trim $15. Located at 123 Main St.",
          rows: 6,
        })}

        ${renderTextArea({
          name: SETTING_KEYS.systemPromptOverride,
          label: isEs ? "Prompt del agente (avanzado)" : "Agent System Prompt (Advanced)",
          help: hasPromptOverride
            ? (isEs
                ? "✍ Modo manual: su bot está usando este texto como prompt completo, en lugar del automático. Para verlo entero o volver al automático: Mi Agente → Flujo → Agente."
                : "✍ Manual Mode: your bot is using this text as its complete system prompt instead of the automated one. To inspect or revert: My Agent → Flow → Agent.")
            : (isEs
                ? "⚠️ Lo que escriba aquí REEMPLAZA el prompt completo del bot — incluida la información del negocio de arriba, su base de conocimiento y sus reglas de seguridad. No agrega instrucciones: las sustituye. Déjelo vacío para usar el prompt automático. Para editar sobre el prompt real, vaya a Mi Agente → Flujo → Agente."
                : "⚠️ Any text entered here REPLACES the bot's complete system prompt — including business info above, knowledge base, and guardrails. It does not add instructions: it substitutes them. Leave empty to use standard automated prompt. To edit on top of the real prompt, go to My Agent → Flow → Agent."),
          value: settings[SETTING_KEYS.systemPromptOverride] ?? "",
          placeholder: isEs
            ? "Vacío = el bot usa su prompt automático completo: información del negocio, base de conocimiento y reglas de seguridad."
            : "Empty = bot uses standard automated prompt with business context, knowledge base, and guardrails.",
          rows: 4,
        })}

        ${renderTextField({
          name: SETTING_KEYS.escalationKeywords,
          label: isEs ? "Palabras que piden un humano" : "Human Handoff Keywords",
          help: isEs
            ? "Si el cliente escribe alguna, el bot avisa a una persona. Sepárelas con comas."
            : "If a customer sends any of these words, the bot alerts a human agent. Separate with commas.",
          value: settings[SETTING_KEYS.escalationKeywords] ?? "",
          placeholder: isEs ? "queja, reembolso, hablar con alguien" : "complaint, refund, human, agent, representative",
        })}
      </div>

      <button type="submit" class="apple-btn-primary font-display font-semibold text-[13px] cursor-pointer flex items-center gap-2 self-start">
        <i data-lucide="check" width="16" height="16"></i> ${saveBtnText}
      </button>
    </form>`;

  return layout({ title: t.navSettings, activeTab: "config", body, env });
}
