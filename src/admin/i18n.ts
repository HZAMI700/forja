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
};

export function getT(env?: Env): Translations {
  return getLang(env) === "es" ? es : en;
}
