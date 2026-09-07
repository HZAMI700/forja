// "Conexiones" tab — Messaging Channels Hub.
// Each channel card displays its connection status (CONNECTED / NOT CONNECTED),
// missing configuration variables/secrets, step-by-step setup guide,
// and the live webhook URL ready to copy with 1 click.
import type { Env } from "../../env";
import { layout } from "./layout";
import { getT, getLang } from "../i18n";

interface ChannelStatus {
  id: string;
  name: string;
  icon: string; // lucide icon name
  desc: string;
  ok: boolean;
  missing: string[];
  webhookPath?: string;
  securityNote?: string;
  howToSteps: string[];
}

function channelStatuses(env: Env): ChannelStatus[] {
  const isEs = getLang(env) === "es";
  const has = (v?: string) => Boolean(v && v.trim() !== "");

  const telegramMissing = [!has(env.TELEGRAM_BOT_TOKEN) && "TELEGRAM_BOT_TOKEN"].filter(
    Boolean,
  ) as string[];
  const twilioMissing = [
    !has(env.TWILIO_ACCOUNT_SID) && "TWILIO_ACCOUNT_SID",
    !has(env.TWILIO_AUTH_TOKEN) && "TWILIO_AUTH_TOKEN",
    !has(env.TWILIO_WA_FROM) && "TWILIO_WA_FROM",
  ].filter(Boolean) as string[];
  const metaMissing = [
    !has(env.META_PAGE_ACCESS_TOKEN) && "META_PAGE_ACCESS_TOKEN",
    !has(env.META_VERIFY_TOKEN) && "META_VERIFY_TOKEN",
    !has(env.META_APP_SECRET) && "META_APP_SECRET",
  ].filter(Boolean) as string[];
  const manychatMissing = [!has(env.MANYCHAT_API_KEY) && "MANYCHAT_API_KEY"].filter(
    Boolean,
  ) as string[];
  const whatsappCloudMissing = [
    !has(env.WHATSAPP_PHONE_NUMBER_ID) && "WHATSAPP_PHONE_NUMBER_ID",
    !has(env.WHATSAPP_ACCESS_TOKEN) && "WHATSAPP_ACCESS_TOKEN",
    !has(env.WHATSAPP_VERIFY_TOKEN || env.META_VERIFY_TOKEN) && "WHATSAPP_VERIFY_TOKEN",
    !has(env.WHATSAPP_APP_SECRET || env.META_APP_SECRET) && "WHATSAPP_APP_SECRET",
  ].filter(Boolean) as string[];

  if (isEs) {
    return [
      {
        id: "telegram",
        name: "Telegram",
        icon: "send",
        desc: "Bot de Telegram oficial — gratuito y el más rápido de conectar.",
        ok: telegramMissing.length === 0,
        missing: telegramMissing,
        webhookPath: "/webhooks/telegram",
        howToSteps: [
          "Abre @BotFather en Telegram y envía /newbot para obtener tu token.",
          "Guarda el secret: wrangler secret put TELEGRAM_BOT_TOKEN",
          "Registra el webhook visitando en tu navegador: https://api.telegram.org/bot<TOKEN>/setWebhook?url=<URL_DEL_WEBHOOK>",
        ],
      },
      {
        id: "whatsapp",
        name: "WhatsApp (Twilio)",
        icon: "phone",
        desc: "WhatsApp Business vía Twilio — ideal para números comerciales consolidados.",
        ok: twilioMissing.length === 0,
        missing: twilioMissing,
        webhookPath: "/webhooks/twilio",
        securityNote:
          twilioMissing.length === 0 && !has(env.TWILIO_HANDOFF_CONTENT_SID)
            ? "Sin TWILIO_HANDOFF_CONTENT_SID: el aviso de handoff por WhatsApp requiere una plantilla (HSM) aprobada."
            : undefined,
        howToSteps: [
          "En Twilio Console: ve a Messaging → Senders → WhatsApp senders.",
          "Configura el webhook de mensajes entrantes (HTTP POST) con la URL de abajo.",
          "Guarda TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN y TWILIO_WA_FROM en wrangler.",
        ],
      },
      {
        id: "whatsapp-cloud",
        name: "WhatsApp (Oficial · Cloud API)",
        icon: "message-circle",
        desc: "WhatsApp directo con Meta, sin intermediarios — máximo margen y velocidad.",
        ok: whatsappCloudMissing.length === 0,
        missing: whatsappCloudMissing,
        webhookPath: "/webhooks/whatsapp",
        howToSteps: [
          "En developers.facebook.com → Tu App → WhatsApp → Configuration.",
          "Apunta la URL de devolución de llamada al webhook de abajo e ingresa tu WHATSAPP_VERIFY_TOKEN.",
          "En campos de webhook, suscríbete a 'messages' y guarda tu Phone Number ID y token.",
        ],
      },
      {
        id: "meta",
        name: "Instagram + Messenger (Meta)",
        icon: "instagram",
        desc: "DMs de Instagram y Facebook Messenger con la API oficial de Graph.",
        ok: metaMissing.length === 0,
        missing: metaMissing,
        webhookPath: "/webhooks/meta",
        howToSteps: [
          "En Meta for Developers → Tu App → Webhooks → Página / Instagram.",
          "Apunta Callback URL a la URL de abajo con tu META_VERIFY_TOKEN.",
          "Suscríbete al campo 'messages' y 'messaging_postbacks'.",
        ],
      },
      {
        id: "manychat",
        name: "ManyChat",
        icon: "bot",
        desc: "Conecta tu bot inteligente detrás de tus automatizaciones existentes de ManyChat.",
        ok: manychatMissing.length === 0,
        missing: manychatMissing,
        webhookPath: "/webhooks/manychat",
        howToSteps: [
          "En el Flow Builder de ManyChat: agrega una acción 'External Request'.",
          "Configura la petición HTTP POST hacia la URL del webhook de abajo.",
          "Guarda tu MANYCHAT_API_KEY en los secrets del Worker.",
        ],
      },
    ];
  }

  return [
    {
      id: "telegram",
      name: "Telegram",
      icon: "send",
      desc: "Official Telegram Bot API — completely free and takes 1 minute to connect.",
      ok: telegramMissing.length === 0,
      missing: telegramMissing,
      webhookPath: "/webhooks/telegram",
      howToSteps: [
        "Open @BotFather on Telegram and send /newbot to create your bot.",
        "Save your bot token: wrangler secret put TELEGRAM_BOT_TOKEN",
        "Register the webhook by opening in your browser: https://api.telegram.org/bot<TOKEN>/setWebhook?url=<WEBHOOK_URL>",
      ],
    },
    {
      id: "whatsapp",
      name: "WhatsApp (Twilio)",
      icon: "phone",
      desc: "WhatsApp Business messaging powered by Twilio API.",
      ok: twilioMissing.length === 0,
      missing: twilioMissing,
      webhookPath: "/webhooks/twilio",
      securityNote:
        twilioMissing.length === 0 && !has(env.TWILIO_HANDOFF_CONTENT_SID)
          ? "Without TWILIO_HANDOFF_CONTENT_SID: WhatsApp handoff alerts require an approved template (HSM)."
          : undefined,
      howToSteps: [
        "In Twilio Console: go to Messaging → Senders → WhatsApp senders.",
        "Set the incoming webhook URL (HTTP POST) to the link below.",
        "Configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WA_FROM via wrangler secret put.",
      ],
    },
    {
      id: "whatsapp-cloud",
      name: "WhatsApp (Official · Cloud API)",
      icon: "message-circle",
      desc: "Direct Meta Cloud API integration — no intermediary fees, highest reliability.",
      ok: whatsappCloudMissing.length === 0,
      missing: whatsappCloudMissing,
      webhookPath: "/webhooks/whatsapp",
      howToSteps: [
        "In developers.facebook.com → Your App → WhatsApp → Configuration.",
        "Set Callback URL to the webhook below and enter your WHATSAPP_VERIFY_TOKEN.",
        "Under Webhook fields, subscribe to 'messages' and save your Phone Number ID and access token.",
      ],
    },
    {
      id: "meta",
      name: "Instagram + Messenger (Meta)",
      icon: "instagram",
      desc: "Instagram Direct Messages and Facebook Messenger via official Graph API.",
      ok: metaMissing.length === 0,
      missing: metaMissing,
      webhookPath: "/webhooks/meta",
      howToSteps: [
        "In Meta App Dashboard → Webhooks → Page / Instagram.",
        "Set Callback URL to the webhook below along with your META_VERIFY_TOKEN.",
        "Subscribe to 'messages' and 'messaging_postbacks' fields.",
      ],
    },
    {
      id: "manychat",
      name: "ManyChat",
      icon: "bot",
      desc: "Power your existing ManyChat flows with intelligent AI agent responses.",
      ok: manychatMissing.length === 0,
      missing: manychatMissing,
      webhookPath: "/webhooks/manychat",
      howToSteps: [
        "In ManyChat Flow Builder: add an 'External Request' action block.",
        "Set the request method to POST targeting the webhook URL below.",
        "Save your MANYCHAT_API_KEY in the worker secrets.",
      ],
    },
  ];
}

function esc(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]!),
  );
}

export function renderConexiones(env: Env): string {
  const t = getT(env);
  const channels = channelStatuses(env);
  const connected = channels.filter((ch) => ch.ok).length;
  const base = (env.DASHBOARD_BASE_URL ?? "").replace(/\/$/, "");

  const cards = channels
    .map((ch) => {
      const badge = ch.ok
        ? `<span style="font-size:10.5px;font-weight:700;letter-spacing:.04em;color:var(--ok);border:1px solid rgba(48,209,88,.3);background:rgba(48,209,88,.1);border-radius:9999px;padding:3px 10px">${t.connConnected}</span>`
        : `<span style="font-size:10.5px;font-weight:600;letter-spacing:.04em;color:var(--dim);border:1px solid var(--line);background:rgba(255,255,255,.04);border-radius:9999px;padding:3px 10px">${t.connNotConnected}</span>`;

      const missing = ch.ok
        ? ""
        : `<div class="p-3 rounded-xl border border-[rgba(255,69,58,.25)]" style="background:rgba(255,69,58,.08)">
             <div class="text-[11.5px] font-medium" style="color:var(--bad)">${t.connMissingConfig}</div>
             <div class="font-mono text-[11px] text-cream mt-1">${ch.missing.map(esc).join(", ")}</div>
           </div>`;

      const guide = `
        <div class="flex flex-col gap-1.5 mt-1">
          <span class="text-[11px] font-semibold text-cream">${t.connSetupGuide}</span>
          <ol class="flex flex-col gap-1 list-decimal list-inside text-muted text-[11.5px] leading-relaxed" style="padding-left:2px;margin:0">
            ${ch.howToSteps.map((step) => `<li>${esc(step)}</li>`).join("")}
          </ol>
        </div>`;

      const webhook = ch.webhookPath
        ? `<div class="webhook-box flex flex-col gap-1.5 p-3 rounded-xl border border-line mt-auto" style="background:var(--bg)">
             <div class="flex items-center justify-between text-[11px] text-muted font-medium">
               <span>${t.connWebhookUrl}</span>
               <button type="button" class="apple-btn-secondary text-[10.5px] cursor-pointer"
                       onclick="copyWebhook(this)" style="padding:2px 8px;border-radius:6px;border:1px solid var(--line);background:var(--panel2);color:var(--cream)">
                 ${t.connCopy}
               </button>
             </div>
             <code class="webhook-url font-mono text-[11px] text-cream break-all" data-path="${esc(ch.webhookPath)}" style="user-select:all">${esc(base ? base + ch.webhookPath : ch.webhookPath)}</code>
           </div>`
        : "";

      const security = ch.securityNote
        ? `<div class="text-[11px] p-2.5 rounded-lg border border-[rgba(255,159,10,.25)]" style="color:var(--warn,#e9ad4f);background:rgba(255,159,10,.08)">⚠ ${esc(ch.securityNote)}</div>`
        : "";

      return `
        <div class="card bg-panel border ${ch.ok ? "border-[rgba(48,209,88,.35)]" : "border-line"} p-5 flex flex-col gap-3.5" style="min-height:340px">
          <div class="flex items-center justify-between gap-2.5">
            <div class="font-display font-semibold text-[14.5px] text-cream flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl ${ch.ok ? "bg-[rgba(48,209,88,.15)] text-ok" : "bg-panel2 text-dim"} flex items-center justify-center flex-none">
                <i data-lucide="${ch.icon}" width="16" height="16"></i>
              </div>
              <span>${esc(ch.name)}</span>
            </div>
            ${badge}
          </div>
          <p class="text-muted text-[12px] leading-relaxed" style="margin:0">${esc(ch.desc)}</p>
          ${missing}
          ${security}
          ${guide}
          ${webhook}
        </div>`;
    })
    .join("");

  const body = `
    <div class="flex flex-col gap-[20px]">
      <div class="flex flex-col gap-1">
        <h2 class="font-display font-semibold text-[16px] text-cream">${t.connTitle} (${connected}/${channels.length} ${t.connConnected.replace("● ", "")})</h2>
        <p class="text-muted text-[12.5px]">${t.connSubtitle}</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[16px]">
        ${cards}
      </div>
    </div>
    <script>
      (function() {
        var origin = window.location.origin;
        document.querySelectorAll('.webhook-url').forEach(function(el) {
          var path = el.getAttribute('data-path');
          if (path && (!el.textContent.trim().startsWith('http'))) {
            el.textContent = origin + path;
          }
        });
      })();
      function copyWebhook(btn) {
        var box = btn.closest('.webhook-box');
        var code = box ? box.querySelector('.webhook-url') : null;
        if (!code) return;
        var text = code.textContent.trim();
        navigator.clipboard.writeText(text).then(function() {
          var orig = btn.textContent;
          btn.textContent = '✓';
          setTimeout(function() { btn.textContent = orig; }, 1500);
        });
      }
    </script>`;

  return layout({ title: t.navConnections, activeTab: "conexiones", body, env });
}

/** Resumen corto para el badge de salud del Resumen. */
export function connectionsSummary(env: Env): { connected: number; total: number } {
  const channels = channelStatuses(env);
  return { connected: channels.filter((ch) => ch.ok).length, total: channels.length };
}
