// Dashboard shell: a fixed 252px sidebar (grouped navigation) + a live-status
// topbar, wrapping each tab's server-rendered body. iOS / Apple Dark System theme:
// SF Pro + SF Mono, continuous squircle cards, glassmorphic blur, Motion spring
// physics. Design tokens are exposed both as CSS custom properties (for inline
// styles) and mapped to Tailwind color names (for utility classes).
//
// The layout() API is unchanged: views keep their own activeTab id; the group,
// breadcrumb and page title are derived here.

import type { Env } from "../../env";
import { isPro, PRO_ONLY_TABS } from "../../config";
import { getNiche } from "../../niches";
import type { NichePack } from "../../niches";
import { getT, getLang, type Translations } from "../i18n";

const UPGRADE_URL = "/admin/upgrade";

interface Item {
  id: string;
  label: string;
  href: string;
  icon: string; // lucide icon name
}

interface Section {
  label: string;
  items: Item[];
}

export function getNav(env?: Env): Section[] {
  const t = getT(env);
  return [
    {
      label: t.navHome,
      items: [{ id: "overview", label: t.navOverview, href: "/admin/overview", icon: "layout-dashboard" }],
    },
    {
      label: t.navInbox,
      items: [
        { id: "conversations", label: t.navConversations, href: "/admin/conversations", icon: "messages-square" },
        { id: "leads", label: t.navLeads, href: "/admin/leads", icon: "user-plus" },
        { id: "tickets", label: t.navTickets, href: "/admin/tickets", icon: "life-buoy" },
        { id: "campanas", label: t.navCampaigns, href: "/admin/campanas", icon: "megaphone" },
      ],
    },
    {
      label: t.navMyAgent,
      items: [
        { id: "agente", label: t.navFlow, href: "/admin/agente", icon: "workflow" },
        { id: "kb", label: t.navKnowledge, href: "/admin/kb", icon: "book-open" },
        { id: "mejoras", label: t.navImprovements, href: "/admin/mejoras", icon: "sparkles" },
        { id: "conexiones", label: t.navConnections, href: "/admin/conexiones", icon: "plug-zap" },
        { id: "config", label: t.navSettings, href: "/admin/config", icon: "sliders-horizontal" },
      ],
    },
    {
      label: t.navAnalytics,
      items: [
        { id: "insights", label: t.navInsights, href: "/admin/insights", icon: "scan-eye" },
        { id: "stats", label: t.navStats, href: "/admin/stats", icon: "bar-chart-3" },
        { id: "costs", label: t.navCosts, href: "/admin/costs", icon: "receipt" },
      ],
    },
  ];
}

// <head> assets: Apple fonts, Tailwind CDN + iOS tokens, Motion library, lucide, htmx, theme script.
const HEAD_ASSETS = `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/htmx.org@2.0.4"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/motion@latest/dist/motion.js"></script>
  <script>
    (function(){
      var s = localStorage.getItem("forja-theme");
      if (s === "light" || (!s && window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches)) {
        document.documentElement.setAttribute("data-theme", "light");
      }
    })();
  </script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            bg: "var(--bg)",
            panel: "var(--panel)",
            panel2: "var(--panel2)",
            raise: "var(--raise)",
            line: "var(--line)",
            linelit: "var(--linelit)",
            accent: { DEFAULT: "var(--accent)", soft: "var(--accent-soft)" },
            accent2: "var(--accent-2)",
            cream: "var(--cream)",
            muted: "var(--muted)",
            dim: "var(--dim)",
            ok: "var(--ok)",
            info: "var(--info)",
            bad: "var(--bad)",
            violet: "var(--violet)",
          },
          fontFamily: {
            display: ["-apple-system", "BlinkMacSystemFont", "'SF Pro Display'", "'Plus Jakarta Sans'", "sans-serif"],
            sans: ["-apple-system", "BlinkMacSystemFont", "'SF Pro Text'", "'Plus Jakarta Sans'", "sans-serif"],
            mono: ["'SF Mono'", "'JetBrains Mono'", "ui-monospace", "monospace"],
          },
        },
      },
    };
  </script>
  <script src="https://unpkg.com/lucide@latest"></script>`;

// Global stylesheet: Apple iOS design tokens (Dark & Light mode), glassmorphism,
// squircle radii, spring physics button classes, modal/toast classes, and responsive iOS TabBar.
const GLOBAL_STYLE = `
<style>
  :root{
    --bg:#000000;
    --panel:rgba(28, 28, 30, 0.72);
    --panel-solid:#1c1c1e;
    --panel2:rgba(44, 44, 46, 0.72);
    --raise:rgba(58, 58, 60, 0.75);
    --line:rgba(255, 255, 255, 0.08);
    --linelit:rgba(255, 255, 255, 0.16);
    --accent:#0A84FF;
    --accent-2:#5E5CE6;
    --accent-soft:rgba(10, 132, 255, 0.15);
    --cream:#ffffff;
    --muted:rgba(235, 235, 245, 0.65);
    --dim:rgba(235, 235, 245, 0.38);
    --ok:#30D158;
    --info:#0A84FF;
    --bad:#FF453A;
    --violet:#BF5AF2;
    /* legacy aliases kept so mockup-derived snippets keep working */
    --border:rgba(255, 255, 255, 0.08);
    --border-lit:rgba(255, 255, 255, 0.16);
    --green:#30D158;
    --blue:#0A84FF;
    --red:#FF453A;
    --theme-btn-bg:rgba(255, 255, 255, 0.08);
    --theme-btn-border:rgba(255, 255, 255, 0.14);
  }
  :root[data-theme="light"]{
    --bg:#f2f2f7;
    --panel:rgba(255, 255, 255, 0.85);
    --panel-solid:#ffffff;
    --panel2:rgba(242, 242, 247, 0.85);
    --raise:#e5e5ea;
    --line:rgba(60, 60, 67, 0.12);
    --linelit:rgba(60, 60, 67, 0.22);
    --accent:#007AFF;
    --accent-2:#5856D6;
    --accent-soft:rgba(0, 122, 255, 0.12);
    --cream:#1c1c1e;
    --muted:#636366;
    --dim:#8e8e93;
    --ok:#34C759;
    --info:#007AFF;
    --bad:#FF3B30;
    --violet:#AF52DE;
    --border:rgba(60, 60, 67, 0.12);
    --border-lit:rgba(60, 60, 67, 0.22);
    --green:#34C759;
    --blue:#007AFF;
    --red:#FF3B30;
    --theme-btn-bg:rgba(0, 0, 0, 0.06);
    --theme-btn-border:rgba(60, 60, 67, 0.16);
  }
  *{box-sizing:border-box}
  html,body{margin:0;padding:0;background:var(--bg);color:var(--cream);
    font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","SF Pro Display","Plus Jakarta Sans",sans-serif;
    -webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
  a{color:var(--accent);text-decoration:none;transition:color .15s ease}
  a:hover{color:#409cff}
  ::-webkit-scrollbar{width:6px;height:6px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.18);border-radius:9999px}
  ::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,.32)}
  :root[data-theme="light"] ::-webkit-scrollbar-thumb{background:rgba(0,0,0,.18)}
  :root[data-theme="light"] ::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.32)}
  input,textarea,select{font-family:inherit;border-radius:10px}
  input::placeholder,textarea::placeholder{color:var(--dim)}
  input[type="range"]{accent-color:var(--accent);height:4px}

  /* keyframes */
  @keyframes blink{0%,49%{opacity:1}50%,100%{opacity:0}}
  @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.88)}}
  @keyframes ring{0%{box-shadow:0 0 0 0 rgba(48,209,88,.5)}100%{box-shadow:0 0 0 8px rgba(48,209,88,0)}}
  @keyframes rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes popIn{from{opacity:0;transform:scale(.95) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}
  @keyframes toastIn{from{opacity:0;transform:translateY(16px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
  @keyframes toastOut{to{opacity:0;transform:translateY(10px) scale(.96);visibility:hidden}}

  /* iOS continuous squircle cards */
  .card{border-radius:18px;background:var(--panel);backdrop-filter:blur(24px) saturate(180%);-webkit-backdrop-filter:blur(24px) saturate(180%);
    border:1px solid var(--line);box-shadow:0 4px 24px -1px rgba(0,0,0,.35);transition:border-color .18s ease,box-shadow .18s ease}
  
  /* iOS spring buttons */
  .bigbtn{border-radius:12px;transition:transform .15s cubic-bezier(.16,1,.3,1),filter .15s ease,box-shadow .15s ease;font-weight:600;display:inline-flex;align-items:center;justify-content:center}
  .bigbtn:hover{filter:brightness(1.08);transform:translateY(-1px);box-shadow:0 4px 16px rgba(10,132,255,.3)}
  .bigbtn:active{transform:scale(.96);filter:brightness(.92)}
  .ghostbtn{border-radius:12px;border:1px solid var(--line);transition:transform .15s ease,background .15s ease,border-color .15s ease}
  .ghostbtn:hover{border-color:var(--linelit);color:var(--cream);background:rgba(255,255,255,.06)}
  .ghostbtn:active{transform:scale(.96)}
  .glow{text-shadow:0 0 24px rgba(10,132,255,.35)}

  /* list / table rows */
  .convrow{transition:background .15s ease,transform .12s ease;border-radius:12px}
  .convrow:hover{background:rgba(255,255,255,.05)}
  .convrow:hover .arr{opacity:1;transform:translateX(0)}
  .convrow:active{transform:scale(.99)}
  .leadrow:hover{background:rgba(255,255,255,.05)}
  .datarow:hover{background:rgba(255,255,255,.05)}
  .kbrow:hover{background:rgba(255,255,255,.05)}
  .kbrow:hover .kbedit{border-color:var(--accent);color:var(--accent)}
  .tkcard{border-radius:14px;background:var(--panel);border:1px solid var(--line);transition:all .15s ease}
  .tkcard:hover{border-color:var(--linelit);transform:translateY(-1px);background:rgba(44,44,46,.6)}
  .tkcard:active{transform:scale(.98)}
  .subtab{transition:all .15s ease;cursor:pointer;border-radius:8px;padding:4px 10px}
  .subtab:hover{color:var(--cream);background:rgba(255,255,255,.06)}
  .chip{border-radius:9999px;border:1px solid var(--line);transition:all .15s ease}
  .chip:hover{border-color:var(--accent);color:var(--accent);background:var(--accent-soft)}
  .chip:active{transform:scale(.96)}
  .cfgcard{border-radius:14px;background:var(--panel);border:1px solid var(--line);transition:all .15s ease;cursor:pointer}
  .cfgcard:hover{border-color:var(--linelit);background:rgba(44,44,46,.6);transform:translateY(-1px)}
  .cfgcard:active{transform:scale(.98)}
  .bar{border-radius:6px 6px 0 0;transition:transform .4s cubic-bezier(.16,1,.3,1),background .2s ease}
  .bargrp:hover .bar{background:var(--accent) !important}

  /* flow-canvas node */
  .node{border-radius:14px;background:var(--panel);border:1px solid var(--line);transition:all .15s ease;cursor:pointer}
  .node:hover{transform:translateY(-2px);border-color:var(--accent);box-shadow:0 8px 24px rgba(0,0,0,.4)}
  .node-card{border-radius:14px;background:var(--panel);border:1px solid var(--line);transition:all .15s ease}
  .node-card:hover{transform:translateY(-2px);border-color:var(--accent);box-shadow:0 8px 24px rgba(0,0,0,.4)}

  /* modal + toast */
  .modal-backdrop{position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;
    padding:1rem;background:rgba(0,0,0,.65);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);animation:fadeIn .18s ease-out}
  .modal-card{background:rgba(30,30,34,.95);border:1px solid var(--linelit);border-radius:20px;box-shadow:0 24px 64px rgba(0,0,0,.7);
    animation:popIn .22s cubic-bezier(.16,1,.3,1);transform-origin:center}
  .toast{background:rgba(30,30,34,.92);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid var(--linelit);color:var(--cream);border-radius:16px;box-shadow:0 12px 36px rgba(0,0,0,.5);
    animation:toastIn .28s cubic-bezier(.16,1,.3,1),toastOut .3s ease-in 2.6s forwards}

  /* app shell */
  .shell{min-height:100vh;display:grid;grid-template-columns:252px 1fr;background:var(--bg)}
  .sb{border-right:1px solid var(--line);background:rgba(18,18,20,.8);backdrop-filter:blur(30px) saturate(190%);-webkit-backdrop-filter:blur(30px) saturate(190%);display:flex;flex-direction:column;position:sticky;top:0;height:100vh}
  .sb-nav{padding:14px 10px;display:flex;flex-direction:column;gap:2px;flex:1;overflow-y:auto}
  .sb-sec{font-size:10.5px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;padding:14px 12px 6px;color:var(--dim)}
  .live-pill{display:flex;align-items:center;gap:8px;background:rgba(0,0,0,.85);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.14);border-radius:9999px;padding:6px 14px;box-shadow:0 4px 16px rgba(0,0,0,.4)}
  .navlink{border-radius:10px;transition:all .15s ease}
  .navlink:hover{background:rgba(255,255,255,.06);color:var(--cream)}
  .navlink:hover [data-lucide]{color:var(--accent)}
  .navlink:active{transform:scale(.98)}

  /* Mobile bottom navigation bar (iOS TabBar) */
  .ios-bottom-bar{display:none}

  @media (max-width:767px){
    .shell{grid-template-columns:1fr;padding-bottom:72px}
    .sb{position:sticky;top:0;height:auto;flex-direction:row;align-items:center;border-right:none;border-bottom:1px solid var(--line);overflow-x:auto;z-index:35}
    .sb-brand{flex:none;border-bottom:none !important;border-right:1px solid var(--line);padding:12px 14px !important}
    .sb-nav{flex-direction:row;align-items:center;gap:4px;padding:6px 8px;overflow-y:visible;overflow-x:auto}
    .sb-sec{display:none}
    .sb-foot{display:none}
    .navlink{white-space:nowrap;padding:7px 10px !important}

    .ios-bottom-bar{
      display:flex;position:fixed;bottom:0;left:0;right:0;z-index:40;
      background:rgba(18,18,20,.88);backdrop-filter:blur(24px) saturate(180%);-webkit-backdrop-filter:blur(24px) saturate(180%);
      border-top:1px solid rgba(255,255,255,.1);justify-content:space-around;align-items:center;
      padding:6px 10px calc(6px + env(safe-area-inset-bottom, 8px));
    }
    .ios-tab-item{display:flex;flex-direction:column;align-items:center;gap:3px;font-size:10px;font-weight:500;color:var(--dim);text-decoration:none;padding:4px 12px;border-radius:10px;transition:all .15s ease}
    .ios-tab-item.active{color:var(--accent)}
    .ios-tab-item:active{transform:scale(.92)}
  }

  @media (prefers-reduced-motion:reduce){
    .card,.toast,.modal-backdrop,.modal-card{animation:none}
    .bigbtn,.ghostbtn,.convrow,.leadrow,.datarow,.kbrow,.tkcard,.subtab,.chip,.cfgcard,.node,.node-card,.bar,.navlink,.ios-tab-item{transition:none}
    .bigbtn:hover,.node:hover,.node-card:hover,.tkcard:hover{transform:none}
    .animate-pulse,[style*="animation"]{animation:none !important}
  }
</style>`;

// Motion library hook + Lucide + Escape listener + Polling filter.
const GLOBAL_SCRIPT = `
<script>
  function drawIcons(){ if (window.lucide) window.lucide.createIcons(); }
  function applyMotion(){
    if (!window.Motion) return;
    try {
      var animate = window.Motion.animate;
      var spring = window.Motion.spring;
      var stagger = window.Motion.stagger;
      var els = document.querySelectorAll(".card:not([data-motion-ok])");
      if (els.length > 0) {
        els.forEach(function(el){ el.setAttribute("data-motion-ok", "1"); });
        animate(els, { opacity: [0, 1], y: [16, 0], scale: [0.985, 1] }, {
          delay: stagger(0.04),
          duration: 0.45,
          easing: spring({ bounce: 0.12, stiffness: 240, damping: 22 })
        });
      }
    } catch(e){}
  }
  function onReady(){
    drawIcons();
    applyMotion();
  }
  document.addEventListener("DOMContentLoaded", onReady);
  (function(){ var n=0; var t=setInterval(function(){ if(window.lucide){drawIcons();clearInterval(t);} if(++n>25) clearInterval(t); },120); })();
  (function(){ var n=0; var t=setInterval(function(){ if(window.Motion){applyMotion();clearInterval(t);} if(++n>25) clearInterval(t); },120); })();
  document.body.addEventListener("htmx:afterSwap", function(){ drawIcons(); applyMotion(); });
  document.body.addEventListener("htmx:oobAfterSwap", function(){ drawIcons(); applyMotion(); });

  // Spring tactile compression on interactive elements
  document.addEventListener("pointerdown", function(e){
    var el = e.target.closest(".bigbtn, .navlink, .tkcard, .cfgcard, .convrow, .ios-tab-item");
    if (el && window.Motion) {
      window.Motion.animate(el, { scale: 0.97 }, { duration: 0.12 });
    }
  });
  document.addEventListener("pointerup", function(e){
    var el = e.target.closest(".bigbtn, .navlink, .tkcard, .cfgcard, .convrow, .ios-tab-item");
    if (el && window.Motion) {
      window.Motion.animate(el, { scale: 1 }, {
        duration: 0.35,
        easing: window.Motion.spring({ bounce: 0.25, stiffness: 350, damping: 18 })
      });
    }
  });

  // Theme toggle logic (Light / Dark mode)
  function updateThemeIcon(){
    var isLight = document.documentElement.getAttribute("data-theme") === "light";
    var icon = document.getElementById("theme-icon");
    if (icon) {
      icon.setAttribute("data-lucide", isLight ? "moon" : "sun");
      if (window.lucide) window.lucide.createIcons();
    }
  }
  window.toggleTheme = function(){
    var isLight = document.documentElement.getAttribute("data-theme") === "light";
    var next = isLight ? "dark" : "light";
    if (next === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    localStorage.setItem("forja-theme", next);
    updateThemeIcon();
  };
  document.addEventListener("DOMContentLoaded", updateThemeIcon);

  // Pausa del polling: no refresques el inbox mientras el usuario lee (o si la
  // pestaña está en segundo plano).
  window.puedeRefrescar = function(id){
    if (document.hidden) return false;
    var el = document.getElementById(id);
    if (!el) return true;
    return Math.abs(el.scrollTop) < 40;
  };
  document.addEventListener("keydown", function(e){
    if (e.key === "Escape") {
      var root = document.getElementById("modal-root");
      if (root) root.innerHTML = "";
    }
  });
</script>`;

function navItem(item: Item, active: boolean): string {
  const base =
    "display:flex;align-items:center;gap:11px;padding:8px 12px;font-size:13px;";
  const style = active
    ? base + "color:var(--cream);background:var(--accent-soft);border:1px solid rgba(10,132,255,.28);font-weight:600"
    : base + "color:var(--muted);border:1px solid transparent";
  const iconColor = active ? "var(--accent)" : "var(--dim)";
  return `<a href="${item.href}" class="navlink" style="${style}">
    <i data-lucide="${item.icon}" width="17" height="17" style="color:${iconColor}"></i> ${item.label}
  </a>`;
}

// Tier free: los tabs Pro se muestran bloqueados (candado + tag PRO) y llevan a
// la página de upgrade en vez de a la vista real. Se ven, pero invitan a subir.
function navItemLocked(item: Item, t: Translations): string {
  const base =
    "display:flex;align-items:center;gap:11px;padding:8px 12px;font-size:13px;color:var(--dim);border:1px solid transparent";
  return `<a href="${UPGRADE_URL}" class="navlink" style="${base}" title="${t.availableInPro}">
    <i data-lucide="lock" width="15" height="15" style="color:var(--dim)"></i> ${item.label}
    <span style="margin-left:auto;font-size:9px;font-weight:700;letter-spacing:.08em;color:var(--accent2);background:rgba(94,92,230,.15);border:1px solid rgba(94,92,230,.3);border-radius:9999px;padding:1px 7px">PRO</span>
  </a>`;
}

// El pack de nicho re-etiqueta el item "leads" (ej. "Leads" → "Reservaciones").
// El id y el href NO cambian (son load-bearing); solo la etiqueta y el ícono.
function applyNiche(item: Item, niche: NichePack | null): Item {
  if (!niche || niche.id === "generico" || item.id !== "leads") return item;
  return { ...item, label: niche.navLabel, icon: niche.navIcon };
}

function sidebar(activeTab: string, pro: boolean, niche: NichePack | null, env?: Env): string {
  const t = getT(env);
  const nav = getNav(env);
  const locked = (id: string) => !pro && (PRO_ONLY_TABS as readonly string[]).includes(id);
  const sections = nav.map((sec) => {
    const hasActive = sec.items.some((i) => i.id === activeTab);
    const labelColor = hasActive ? "var(--accent)" : "var(--dim)";
    const items = sec.items
      .map((raw) => {
        const i = applyNiche(raw, niche);
        return locked(i.id) ? navItemLocked(i, t) : navItem(i, i.id === activeTab);
      })
      .join("");
    return `<div class="sb-sec" style="color:${labelColor}">${sec.label}</div>${items}`;
  }).join("");

  return `<aside class="sb">
    <div class="sb-brand" style="padding:18px 16px;border-bottom:1px solid var(--line)">
      <div style="display:flex;align-items:center;gap:11px">
        <div style="width:34px;height:34px;flex:none;border-radius:10px;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;box-shadow:0 3px 12px rgba(10,132,255,.35)">
          <i data-lucide="bot" width="18" height="18" style="color:#ffffff"></i>
        </div>
        <div style="line-height:1.15">
          <div style="font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif;font-weight:700;font-size:15px;letter-spacing:-.01em">Forja</div>
          <div style="font-size:10px;letter-spacing:.08em;color:var(--dim);text-transform:uppercase">${t.dashboardTier(pro)}</div>
        </div>
      </div>
    </div>
    <nav class="sb-nav">${sections}</nav>
    <div class="sb-foot" style="padding:14px;border-top:1px solid var(--line)">
      <div style="display:flex;align-items:center;gap:10px;padding:10px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid var(--line)">
        <div style="width:32px;height:32px;flex:none;border-radius:9px;background:var(--raise);border:1px solid var(--linelit);display:flex;align-items:center;justify-content:center;color:var(--accent)">
          <i data-lucide="sparkles" width="16" height="16"></i>
        </div>
        <div style="line-height:1.25;overflow:hidden">
          <div style="font-size:12px;font-weight:600;white-space:nowrap;text-overflow:ellipsis;overflow:hidden">${t.botDashboard}</div>
          <div style="font-size:10.5px;color:var(--dim)">${t.activeSession}</div>
        </div>
      </div>
    </div>
  </aside>`;
}

export function layout(opts: { title: string; activeTab: string; body: string; env?: Env }): string {
  // Tier: si se pasa env, el nav Pro se bloquea para free. Sin env (ej. notFound)
  // se asume Pro para no ocultar nada por accidente.
  const pro = opts.env ? isPro(opts.env) : true;
  const niche = opts.env ? getNiche(opts.env) : null;
  const t = getT(opts.env);
  const lang = getLang(opts.env);
  const nav = getNav(opts.env);
  const section = nav.find((s) => s.items.some((i) => i.id === opts.activeTab)) ?? nav[0];
  const item = applyNiche(section.items.find((i) => i.id === opts.activeTab) ?? section.items[0], niche);

  // iOS Mobile bottom navigation bar: quick shortcuts to primary views
  const mobileBottomBar = `
    <nav class="ios-bottom-bar">
      <a href="/admin/overview" class="ios-tab-item ${opts.activeTab === 'overview' ? 'active' : ''}">
        <i data-lucide="layout-dashboard" width="20" height="20"></i>
        <span>${t.navOverview}</span>
      </a>
      <a href="/admin/conversations" class="ios-tab-item ${opts.activeTab === 'conversations' ? 'active' : ''}">
        <i data-lucide="messages-square" width="20" height="20"></i>
        <span>${t.navConversations}</span>
      </a>
      <a href="/admin/agente" class="ios-tab-item ${opts.activeTab === 'agente' ? 'active' : ''}">
        <i data-lucide="workflow" width="20" height="20"></i>
        <span>${t.navFlow}</span>
      </a>
      <a href="/admin/kb" class="ios-tab-item ${opts.activeTab === 'kb' ? 'active' : ''}">
        <i data-lucide="book-open" width="20" height="20"></i>
        <span>${t.navKnowledge}</span>
      </a>
      <a href="/admin/config" class="ios-tab-item ${opts.activeTab === 'config' ? 'active' : ''}">
        <i data-lucide="sliders-horizontal" width="20" height="20"></i>
        <span>${t.navSettings}</span>
      </a>
    </nav>`;

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${opts.title}</title>
  ${HEAD_ASSETS}
  ${GLOBAL_STYLE}
</head>
<body style="min-height:100vh;background:var(--bg);color:var(--cream);transition:background .2s ease,color .2s ease">
  <div class="shell">
    ${sidebar(opts.activeTab, pro, niche, opts.env)}
    <div style="display:flex;flex-direction:column;min-width:0">
      <header style="position:sticky;top:0;z-index:30;background:var(--panel);backdrop-filter:blur(24px) saturate(180%);-webkit-backdrop-filter:blur(24px) saturate(180%);border-bottom:1px solid var(--line);padding:14px 26px;display:flex;align-items:center;gap:16px">
        <div style="min-width:0">
          <div style="font-size:10.5px;font-weight:600;letter-spacing:.08em;color:var(--dim);text-transform:uppercase">${section.label} / ${item.label}</div>
          <h1 style="font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif;font-weight:700;font-size:22px;margin:2px 0 0;letter-spacing:-.02em">${item.label}</h1>
        </div>
        <div id="proj-switcher" style="margin-left:auto"></div>
        <button id="theme-toggle" type="button" onclick="toggleTheme()" class="bigbtn"
          style="width:34px;height:34px;border-radius:10px;background:var(--theme-btn-bg);border:1px solid var(--theme-btn-border);color:var(--cream);cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;flex:none"
          title="${t.themeToggle}">
          <i id="theme-icon" data-lucide="sun" width="16" height="16"></i>
        </button>
        <div class="live-pill">
          <span style="width:8px;height:8px;border-radius:50%;background:var(--ok);box-shadow:0 0 10px var(--ok);animation:pulse 1.8s ease-in-out infinite,ring 2s infinite"></span>
          <span style="font-size:11.5px;font-weight:600;letter-spacing:.02em">${t.botOnline}</span>
        </div>
      </header>
      <main style="padding:22px 26px;min-width:0">${opts.body}</main>
    </div>
  </div>
  ${mobileBottomBar}
  <div id="modal-root"></div>
  <script>
  // Selector de proyectos: si esta instancia declara PEER_BOTS, el header
  // muestra un dropdown para brincar entre bots (cada uno con su panel).
  fetch('/admin/projects').then(function(r){ return r.ok ? r.json() : null }).then(function(d){
    if (!d || !d.peers || d.peers.length === 0) return;
    var el = document.getElementById('proj-switcher');
    if (!el) return;
    var opts = '<option selected>' + d.current.replace(/</g,'&lt;') + '</option>';
    d.peers.forEach(function(p){
      opts += '<option value="' + p.url.replace(/"/g,'&quot;') + '">' + p.name.replace(/</g,'&lt;') + '</option>';
    });
    // Las comillas simples van como &#39;: este bloque vive dentro de un
    // template literal, así que los \' del código fuente NO llegan al navegador
    // y cerraban la cadena JS de golpe (SyntaxError en cada carga del panel).
    // El parser de HTML las decodifica antes de que corran el onchange y el CSS.
    el.innerHTML = '<select onchange="if(this.value.indexOf(&#39;http&#39;)===0)window.location=this.value" ' +
      'style="background:rgba(28,28,30,.85);color:var(--cream);border:1px solid var(--line);border-radius:10px;' +
      'padding:6px 12px;font-family:inherit;font-size:11.5px;font-weight:500;cursor:pointer" ' +
      'title="Cambiar de proyecto">' + opts + '</select>';
  }).catch(function(){});
  </script>
  <div id="toast-root" style="position:fixed;bottom:1rem;right:1rem;z-index:60"></div>
  ${GLOBAL_SCRIPT}
</body>
</html>`;
}

// Página de upgrade: se muestra cuando un panel free intenta abrir un tab Pro
// (o al hacer click en un item bloqueado). Vive dentro del layout para conservar
// el nav. `feature` es el nombre del tab que pidió (para personalizar el copy).
export function renderUpgrade(env: Env, feature?: string): string {
  const perks = [
    ["scan-eye", "Analista IA", "Resúmenes automáticos de cada conversación: qué querían, objeciones y oportunidad de venta."],
    ["bar-chart-3", "Estadísticas", "Métricas de volumen, retención y desempeño de tu bot en el tiempo."],
    ["receipt", "Costos", "Cuánto gasta tu bot en IA, con tope de presupuesto mensual."],
    ["sparkles", "Mejoras", "El bot detecta huecos en su conocimiento y se mejora solo (flywheel)."],
    ["megaphone", "Campañas", "Manda difusiones y seguimientos por WhatsApp a tus segmentos."],
  ]
    .map(
      ([icon, title, desc]) => `<div style="display:flex;gap:14px;padding:16px;border-radius:14px;border:1px solid var(--line);background:rgba(255,255,255,.03)">
        <div style="width:36px;height:36px;border-radius:10px;background:rgba(10,132,255,.12);display:flex;align-items:center;justify-content:center;flex:none">
          <i data-lucide="${icon}" width="18" height="18" style="color:var(--accent)"></i>
        </div>
        <div>
          <div style="font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif;font-weight:600;font-size:14px;margin-bottom:3px">${title}</div>
          <div style="font-size:12.5px;color:var(--muted);line-height:1.5">${desc}</div>
        </div>
      </div>`,
    )
    .join("");

  const body = `
    <div class="card" style="max-width:720px">
      <div style="border:1px solid var(--linelit);background:var(--panel);border-radius:20px;padding:32px">
        <div style="display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(10,132,255,.3);background:rgba(10,132,255,.12);color:var(--accent);border-radius:9999px;font-size:11px;font-weight:600;letter-spacing:.06em;padding:4px 12px;text-transform:uppercase">
          <i data-lucide="lock" width="13" height="13"></i> Función Pro
        </div>
        <h2 style="font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif;font-weight:700;font-size:26px;letter-spacing:-.02em;margin:16px 0 8px">
          ${feature ? `“${feature}” es parte de Pro` : "Desbloquea el panel Pro"}
        </h2>
        <p style="font-size:14px;color:var(--muted);line-height:1.6;margin:0 0 24px;max-width:560px">
          Tu bot Starter ya atiende clientes, responde con tu conocimiento y captura leads.
          El panel <b style="color:var(--cream)">Pro</b> le suma el cerebro analítico y de crecimiento:
        </p>
        <div style="display:grid;gap:12px;margin-bottom:26px">${perks}</div>
        <a href="https://horizontesia.com" target="_blank" rel="noopener" class="bigbtn"
          style="display:inline-flex;align-items:center;gap:8px;background:var(--accent);color:#ffffff;padding:13px 22px;border-radius:12px;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif;font-weight:600;font-size:14px;box-shadow:0 4px 16px rgba(10,132,255,.4)">
          <i data-lucide="arrow-up-right" width="17" height="17"></i> Subir a Pro con la comunidad
        </a>
      </div>
    </div>`;
  return layout({ title: "Pro", activeTab: "overview", body, env });
}

export function loginPage(error?: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Login</title>
  ${HEAD_ASSETS}
  ${GLOBAL_STYLE}
</head>
<body style="min-height:100vh;background:#000000;display:flex;align-items:center;justify-content:center;padding:1rem;color:var(--cream)">
  <form method="POST" action="/admin/auth/request" style="background:var(--panel);backdrop-filter:blur(30px) saturate(190%);-webkit-backdrop-filter:blur(30px) saturate(190%);border:1px solid var(--linelit);border-radius:22px;box-shadow:0 24px 64px rgba(0,0,0,.7);padding:36px;max-width:380px;width:100%">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:22px">
      <div style="width:40px;height:40px;flex:none;border-radius:12px;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(10,132,255,.35)">
        <i data-lucide="bot" width="20" height="20" style="color:#ffffff"></i>
      </div>
      <div>
        <h1 style="font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif;font-weight:700;font-size:20px;margin:0;letter-spacing:-.02em">Dashboard del bot</h1>
        <p style="font-size:12px;color:var(--dim);margin:3px 0 0">Te mandamos un link a tu email para entrar.</p>
      </div>
    </div>
    ${error ? `<p style="color:var(--bad);font-size:12.5px;margin:0 0 14px;background:rgba(255,69,58,.1);border:1px solid rgba(255,69,58,.25);border-radius:10px;padding:8px 12px">${error}</p>` : ""}
    <input name="email" type="email" required placeholder="tu@email.com"
      style="width:100%;background:rgba(255,255,255,.05);border:1px solid var(--line);border-radius:12px;color:var(--cream);padding:12px 14px;font-size:13.5px;outline:none;margin-bottom:16px;transition:border-color .15s ease">
    <button class="bigbtn" type="submit"
      style="width:100%;background:var(--accent);color:#ffffff;border:none;border-radius:12px;box-shadow:0 4px 16px rgba(10,132,255,.35);padding:13px;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif;font-weight:600;font-size:14px;cursor:pointer">
      Mandar link
    </button>
  </form>
  ${GLOBAL_SCRIPT}
</body>
</html>`;
}
