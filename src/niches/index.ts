import type { Env } from "../env";
import type { NichePack } from "./types";
import { generico } from "./generico";

export type { NichePack, NicheColumn } from "./types";

// Registro de packs. Agregar un nicho = importar su archivo y sumarlo aquí.
const PACKS: Record<string, NichePack> = {
  generico,
};

/** Resuelve el pack activo desde BOT_NICHE. Nicho ausente/desconocido → genérico. */
export function getNiche(env: Env): NichePack {
  const id = (env.BOT_NICHE ?? "").trim().toLowerCase();
  const pack = PACKS[id] ?? generico;
  const lang = (env.BOT_LANGUAGE ?? "").toLowerCase().trim();
  if (lang.startsWith("es")) return pack;
  if (pack.id === "generico") {
    return {
      ...pack,
      kpiLabel: "Leads captured",
      statusLabels: { new: "New", contacted: "Contacted", sold: "Sold", lost: "Lost" },
    };
  }
  return pack;
}
