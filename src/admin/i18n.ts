import type { Env } from "../env";

export type Lang = "en" | "es";

/**
 * Returns the effective UI language.
 * Default is English ("en") unless explicitly configured with a Spanish locale ("es").
 */
export function getLang(env?: Env): Lang {
  const l = (env?.BOT_LANGUAGE ?? "").toLowerCase().trim();
  if (l.startsWith("es")) return "es";
  return "en";
}

export interface Translations {
  // Navigation sections & items
  navHome: string;
  navOverview: string;
  navInbox: string;
  navConversations: string;
  navLeads: string;
  navTickets: string;
  navCampaigns: string;
  navMyAgent: string;
  navFlow: string;
  navKnowledge: string;
  navImprovements: string;
  navConnections: string;
  navSettings: string;
  navAnalytics: string;
  navInsights: string;
  navStats: string;
  navCosts: string;

  // Header / footer
  botOnline: string;
  botDashboard: string;
  activeSession: string;
  dashboardTier: (pro: boolean) => string;
  availableInPro: string;
  upgradeToPro: string;

  // Overview KPIs
  messagesToday: string;
  last24h: string;
  uniqueCustomers: string;
  distinctConvsToday: string;
  kpiNewToday: string;
  monthCost: string;
  monthMsgsClaude30d: (msgs: number) => string;

  // Overview health
  botHealth: string;
  viewTickets: string;
  ticketsOpen: (n: number) => string;
  zeroTicketsOpen: string;
  handoffNotifiesVia: (channels: string) => string;
  handoffNoNotice: string;
  channelsConnected: (connected: number, total: number) => string;

  // Overview activity & status
  activity7d: string;
  msgsProcessedPerDay: string;
  todayLabel: string;
  agentStatus: string;
  activeModel: string;
  activeTools: string;
  ofTools: (total: number) => string;
  knowledgeDocs: string;
  preloadedDocs: (n: number) => string;
  resolvedWithoutHuman: string;
  adjustMyAgent: string;

  // Overview recent conversations & improvements
  recentConversations: string;
  viewAll: string;
  noConversationsYet: string;
  suggestedImprovements: string;
  suggestionsDetected: (n: number) => string;
  noPendingImprovements: string;

  // Time formatting
  timeJustNow: string;
  timeMinutesAgo: (m: number) => string;
  timeHoursAgo: (h: number) => string;
  timeDaysAgo: (d: number) => string;
  dowLetters: string[];

  // Connections (Conexiones)
  connTitle: string;
  connSubtitle: string;
  connConnected: string;
  connNotConnected: string;
  connMissingConfig: string;
  connCopy: string;
  connCopied: string;
  connWebhookUrl: string;
  connSetupGuide: string;

  // Knowledge Base (KB)
  kbTitle: string;
  kbSubtitle: string;
  kbNewDoc: string;
  kbSaveDoc: string;
  kbDeleteDoc: string;
  kbEditDoc: string;
  kbCancel: string;
  kbTitlePlaceholder: string;
  kbContentPlaceholder: string;
  kbNoDocsYet: string;
  kbSavedBanner: string;
  kbDeletedBanner: string;
  kbChars: (chars: number, chunks: number) => string;

  // Tickets
  ticketsTitle: string;
  ticketsNoOpen: string;
  ticketsResolve: string;
  ticketsYourEmail: string;

  // Leads
  leadsTitle: string;
  leadsDate: string;
  leadsName: string;
  leadsContact: string;
  leadsSummary: string;
  leadsStatus: string;
  leadsNoName: string;
  leadsSaveNotes: string;
  leadsNotesPlaceholder: string;

  // Quick Start Onboarding Guide
  qsTitle: string;
  qsSubtitle: string;
  qsStep1Title: string;
  qsStep1Desc: string;
  qsStep1Cta: string;
  qsStep2Title: string;
  qsStep2Desc: string;
  qsStep2Cta: string;
  qsStep3Title: string;
  qsStep3Desc: string;
  qsStep3Cta: string;
  qsStep4Title: string;
  qsStep4Desc: string;
  qsStep4Cta: string;
  qsDismiss: string;

  // Theme
  themeLight: string;
  themeDark: string;
  themeToggle: string;
}

export const en: Translations = {
  navHome: "Home",
  navOverview: "Overview",
  navInbox: "Inbox",
  navConversations: "Conversations",
  navLeads: "Leads",
  navTickets: "Tickets",
  navCampaigns: "Campaigns",
  navMyAgent: "My Agent",
  navFlow: "Flow",
  navKnowledge: "Knowledge",
  navImprovements: "Improvements",
  navConnections: "Connections",
  navSettings: "Settings",
  navAnalytics: "Analytics",
  navInsights: "Insights",
  navStats: "Statistics",
  navCosts: "Costs",

  botOnline: "BOT ONLINE",
  botDashboard: "Bot Dashboard",
  activeSession: "active session",
  dashboardTier: (pro: boolean) => `Panel · ${pro ? "Pro" : "Free"}`,
  availableInPro: "Available in Pro",
  upgradeToPro: "Upgrade to Pro",

  messagesToday: "MESSAGES TODAY",
  last24h: "last 24 hours",
  uniqueCustomers: "UNIQUE CUSTOMERS",
  distinctConvsToday: "distinct conversations today",
  kpiNewToday: "new today",
  monthCost: "MONTHLY COST",
  monthMsgsClaude30d: (msgs: number) => `${msgs} messages · Claude · 30 days`,

  botHealth: "Bot Health",
  viewTickets: "view tickets",
  ticketsOpen: (n: number) => `⚠ ${n} open tickets`,
  zeroTicketsOpen: "✓ 0 open tickets",
  handoffNotifiesVia: (channels: string) => `✓ handoff notifies via ${channels}`,
  handoffNoNotice: "⚠ HANDOFF WITHOUT NOTIFICATION — bot creates tickets but NO ONE receives alerts",
  channelsConnected: (c: number, t: number) => `${c}/${t} channels connected`,

  activity7d: "Activity — last 7 days",
  msgsProcessedPerDay: "messages processed per day",
  todayLabel: "TODAY",
  agentStatus: "Agent Status",
  activeModel: "Active model",
  activeTools: "Active tools",
  ofTools: (total: number) => `of ${total}`,
  knowledgeDocs: "Knowledge docs",
  preloadedDocs: (n: number) => `(${n} preloaded)`,
  resolvedWithoutHuman: "Resolved without human",
  adjustMyAgent: "Adjust my agent",

  recentConversations: "Recent conversations",
  viewAll: "view all",
  noConversationsYet: "No conversations yet.",
  suggestedImprovements: "Suggested Improvements",
  suggestionsDetected: (n: number) => `${n} ${n === 1 ? "suggestion detected" : "suggestions detected"} by AI from your conversations`,
  noPendingImprovements: "No pending improvements.",

  timeJustNow: "just now",
  timeMinutesAgo: (m: number) => `${m}m ago`,
  timeHoursAgo: (h: number) => `${h}h ago`,
  timeDaysAgo: (d: number) => `${d}d ago`,
  dowLetters: ["S", "M", "T", "W", "T", "F", "S"],

  connTitle: "Messaging Channels",
  connSubtitle: "Connect messaging channels to bring your AI agent live. Each channel uses its own webhook URL ready to paste.",
  connConnected: "● CONNECTED",
  connNotConnected: "○ NOT CONNECTED",
  connMissingConfig: "Missing configuration:",
  connCopy: "copy",
  connCopied: "copied ✓",
  connWebhookUrl: "Webhook URL",
  connSetupGuide: "How to connect:",

  kbTitle: "📚 Bot Knowledge Base",
  kbSubtitle: "Everything your bot knows about your business. Every document is automatically indexed upon saving.",
  kbNewDoc: "New document",
  kbSaveDoc: "Save document",
  kbDeleteDoc: "Delete document",
  kbEditDoc: "Edit",
  kbCancel: "Cancel",
  kbTitlePlaceholder: "e.g. Business Hours & Location",
  kbContentPlaceholder: "Write plain text: pricing, services, FAQ, return policies...",
  kbNoDocsYet: "No custom documents yet. Create your first document — hours, prices, policies, promos...",
  kbSavedBanner: "✓ Saved and indexed — your bot can use it immediately.",
  kbDeletedBanner: "Document deleted (also removed from the bot's index).",
  kbChars: (chars: number, chunks: number) => `${chars.toLocaleString()} characters · ${chunks} ${chunks === 1 ? "chunk" : "chunks"}`,

  ticketsTitle: "Support Tickets",
  ticketsNoOpen: "No open tickets.",
  ticketsResolve: "Resolve",
  ticketsYourEmail: "your email",

  leadsTitle: "Leads & Prospects",
  leadsDate: "Date",
  leadsName: "Name",
  leadsContact: "Contact",
  leadsSummary: "Summary · click for details",
  leadsStatus: "Status",
  leadsNoName: "(no name)",
  leadsSaveNotes: "Save notes",
  leadsNotesPlaceholder: "Internal notes about this customer or follow-up...",

  qsTitle: "🚀 Quick Start Guide",
  qsSubtitle: "Get your AI bot up and running in 4 easy steps:",
  qsStep1Title: "1. Test in Sandbox",
  qsStep1Desc: "Chat with your bot and inspect live AI reasoning in the Agent Flow.",
  qsStep1Cta: "Open Agent Flow",
  qsStep2Title: "2. Add Knowledge",
  qsStep2Desc: "Upload your business hours, FAQs, pricing, or catalog.",
  qsStep2Cta: "Add Knowledge",
  qsStep3Title: "3. Connect Channels",
  qsStep3Desc: "Link WhatsApp, Telegram, or Messenger to receive real customer chats.",
  qsStep3Cta: "Connect Channels",
  qsStep4Title: "4. Customize Personality",
  qsStep4Desc: "Adjust tone, response speed, and customer handover settings.",
  qsStep4Cta: "Configure Settings",
  qsDismiss: "Dismiss guide",

  themeLight: "Light Mode",
  themeDark: "Dark Mode",
  themeToggle: "Toggle Theme",
};

export const es: Translations = {
  navHome: "Inicio",
  navOverview: "Resumen",
  navInbox: "Bandeja",
  navConversations: "Conversaciones",
  navLeads: "Leads",
  navTickets: "Tickets",
  navCampaigns: "Campañas",
  navMyAgent: "Mi Agente",
  navFlow: "Flujo",
  navKnowledge: "Conocimiento",
  navImprovements: "Mejoras",
  navConnections: "Conexiones",
  navSettings: "Configuración",
  navAnalytics: "Análisis",
  navInsights: "Insights",
  navStats: "Estadísticas",
  navCosts: "Costos",

  botOnline: "BOT EN LÍNEA",
  botDashboard: "Panel del bot",
  activeSession: "sesión activa",
  dashboardTier: (pro: boolean) => `Panel · ${pro ? "Pro" : "Free"}`,
  availableInPro: "Disponible en Pro",
  upgradeToPro: "Subir a Pro",

  messagesToday: "MENSAJES HOY",
  last24h: "últimas 24 horas",
  uniqueCustomers: "CLIENTES ÚNICOS",
  distinctConvsToday: "conversaciones distintas hoy",
  kpiNewToday: "nuevos hoy",
  monthCost: "COSTO DEL MES",
  monthMsgsClaude30d: (msgs: number) => `${msgs} mensajes · Claude · 30 días`,

  botHealth: "Salud del bot",
  viewTickets: "ver tickets",
  ticketsOpen: (n: number) => `⚠ ${n} tickets abiertos`,
  zeroTicketsOpen: "✓ 0 tickets abiertos",
  handoffNotifiesVia: (channels: string) => `✓ handoff avisa por ${channels}`,
  handoffNoNotice: "⚠ HANDOFF SIN AVISO — el bot crea tickets pero NADIE recibe notificación (configura Telegram, WhatsApp o email del dueño)",
  channelsConnected: (c: number, t: number) => `${c}/${t} canales conectados`,

  activity7d: "Actividad — últimos 7 días",
  msgsProcessedPerDay: "mensajes procesados por día",
  todayLabel: "HOY",
  agentStatus: "Estado del agente",
  activeModel: "Modelo activo",
  activeTools: "Tools activas",
  ofTools: (total: number) => `de ${total}`,
  knowledgeDocs: "Docs de conocimiento",
  preloadedDocs: (n: number) => `(${n} precargados)`,
  resolvedWithoutHuman: "Resueltas sin humano",
  adjustMyAgent: "Ajustar mi agente",

  recentConversations: "Conversaciones recientes",
  viewAll: "ver todas",
  noConversationsYet: "Aún no hay conversaciones.",
  suggestedImprovements: "Mejoras sugeridas",
  suggestionsDetected: (n: number) => `${n} ${n === 1 ? "sugerencia detectada" : "sugerencias detectadas"} por IA sobre tus conversaciones`,
  noPendingImprovements: "Sin mejoras pendientes.",

  timeJustNow: "ahora",
  timeMinutesAgo: (m: number) => `hace ${m} min`,
  timeHoursAgo: (h: number) => `hace ${h} h`,
  timeDaysAgo: (d: number) => `hace ${d} d`,
  dowLetters: ["D", "L", "M", "M", "J", "V", "S"],

  connTitle: "Canales de comunicación",
  connSubtitle: "Conecta tus canales de mensajería para que tu bot atienda a tus clientes. Cada canal tiene su webhook listo para copiar.",
  connConnected: "● CONECTADO",
  connNotConnected: "○ SIN CONECTAR",
  connMissingConfig: "Falta configurar:",
  connCopy: "copiar",
  connCopied: "copiado ✓",
  connWebhookUrl: "URL del webhook",
  connSetupGuide: "Cómo conectar:",

  kbTitle: "📚 Conocimiento del bot",
  kbSubtitle: "Lo que tu bot sabe del negocio. Cada documento se indexa al guardar y el bot lo usa de inmediato.",
  kbNewDoc: "Nuevo documento",
  kbSaveDoc: "Guardar documento",
  kbDeleteDoc: "Eliminar documento",
  kbEditDoc: "Editar",
  kbCancel: "Cancelar",
  kbTitlePlaceholder: "ej. Horarios y Ubicación",
  kbContentPlaceholder: "Escribe en texto plano: precios, servicios, FAQ, políticas...",
  kbNoDocsYet: "Aún no tienes documentos propios. Crea el primero — horarios, precios, políticas, promociones…",
  kbSavedBanner: "✓ Guardado e indexado — el bot ya puede usarlo.",
  kbDeletedBanner: "Documento eliminado (también del índice del bot).",
  kbChars: (chars: number, chunks: number) => `${chars.toLocaleString("es-MX")} caracteres · ${chunks} ${chunks === 1 ? "fragmento" : "fragmentos"}`,

  ticketsTitle: "Tickets de soporte",
  ticketsNoOpen: "No hay tickets abiertos.",
  ticketsResolve: "Resolver",
  ticketsYourEmail: "tu email",

  leadsTitle: "Leads y prospectos",
  leadsDate: "Fecha",
  leadsName: "Nombre",
  leadsContact: "Contacto",
  leadsSummary: "Resumen · click para ver detalle",
  leadsStatus: "Estado",
  leadsNoName: "(sin nombre)",
  leadsSaveNotes: "Guardar notas",
  leadsNotesPlaceholder: "Notas internas sobre este cliente...",

  qsTitle: "🚀 Guía de inicio rápido",
  qsSubtitle: "Configura tu bot en 4 pasos sencillos:",
  qsStep1Title: "1. Prueba en el simulador",
  qsStep1Desc: "Chatea con tu bot y verifica cómo responde en el flujo del agente.",
  qsStep1Cta: "Abrir flujo",
  qsStep2Title: "2. Agrega conocimiento",
  qsStep2Desc: "Sube horarios, preguntas frecuentes o lista de precios.",
  qsStep2Cta: "Ir a Conocimiento",
  qsStep3Title: "3. Conecta canales",
  qsStep3Desc: "Vincula WhatsApp, Telegram o Instagram para recibir mensajes reales.",
  qsStep3Cta: "Conectar canales",
  qsStep4Title: "4. Personaliza el tono",
  qsStep4Desc: "Ajusta la velocidad de respuesta y el estilo de comunicación.",
  qsStep4Cta: "Ir a Configuración",
  qsDismiss: "Ocultar guía",

  themeLight: "Modo Claro",
  themeDark: "Modo Oscuro",
  themeToggle: "Cambiar tema",
};

export function getT(env?: Env): Translations {
  return getLang(env) === "es" ? es : en;
}
