import express from "express";
import path from "path";
import os from "os";
import fs from "fs/promises";
import { execFile, spawn } from "child_process";
import { EventEmitter } from "events";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// -------------------------------------------------------------
// Mente Colmena (hive) — única fuente de verdad
// -------------------------------------------------------------
const HIVE = path.join(os.homedir(), ".hive");
// Token global del ecosistema AETHON (definido por Antigravity en la colmena).
// Sobreescribible por entorno sin romper a los agentes ya integrados.
const ACCESS_TOKEN = process.env.AGENTOS_TOKEN || "PHX-TOKEN-AETHON-2026";

async function readHive(file: string): Promise<string> {
  try {
    return await fs.readFile(path.join(HIVE, file), "utf8");
  } catch {
    return "";
  }
}

// Anuncia un actor en la colmena reusando el pipeline canónico `~/.hive/firmar`
// (escribe presencia.json/.md y dispara el watcher → eventos.md).
function firmar(actor: string, mensaje: string): Promise<void> {
  return new Promise((resolve) => {
    execFile(path.join(HIVE, "firmar"), [actor, mensaje], (err) => {
      if (err) console.error("Error firmando en la colmena:", err.message);
      resolve();
    });
  });
}

app.use(express.json());

// Initialize Gemini Client Lazily/Safely
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== "") {
      try {
        aiClient = new GoogleGenAI({
          apiKey: apiKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });
        console.log("Gemini API Client initialized successfully.");
      } catch (err) {
        console.error("Error initializing Gemini API:", err);
      }
    } else {
      console.warn("GEMINI_API_KEY is not defined. Using mock simulations.");
    }
  }
  return aiClient;
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// 1. Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", usingGemini: getGeminiClient() !== null });
});

// 5. External CLI & Agent Registration Endpoint ("Llave de Acceso" Validation)
//    Persiste de verdad en la colmena vía `firmar` (presencia.json/.md + eventos.md).
app.post("/api/external/register", async (req, res) => {
  const { token, name, specialty, avatar, vibe, recentActivity } = req.body || {};

  if (token !== ACCESS_TOKEN) {
    return res.status(401).json({
      success: false,
      error: "Llave de acceso inválida o expirada."
    });
  }

  if (!name || !specialty) {
    return res.status(400).json({
      success: false,
      error: "El nombre de tu agente externo y su mayor especialidad técnica son requeridos."
    });
  }

  const id = name.toLowerCase().replace(/[^a-z0-9]/g, "-");
  const activity = recentActivity || `Conectado al panel AgentOS · ${specialty}`;

  // Escribe presencia real en la colmena (y dispara el watcher → eventos.md).
  await firmar(id, activity);

  res.json({
    success: true,
    message: "Agente registrado y anunciado en la mente colmena.",
    registeredAgent: {
      id,
      name,
      specialty,
      avatar: avatar || "🤖",
      color: "zinc",
      status: "observing",
      vibe: vibe || "Agente externo autónomo conectado por CLI.",
      recentActivity: activity
    }
  });
});

// 6. External Agent Chat broadcast via CLI — persiste como nota en la colmena.
app.post("/api/external/broadcast", async (req, res) => {
  const { token, agentId, text } = req.body || {};

  if (token !== ACCESS_TOKEN) {
    return res.status(401).json({
      success: false,
      error: "Llave de acceso inválida. No se puede emitir el mensaje al clúster."
    });
  }

  const actor = (agentId || "external-agent").toLowerCase().replace(/[^a-z0-9]/g, "-");
  const message = text || "Ping de agente autónomo externo.";

  // El broadcast queda registrado como presencia/nota del actor en la colmena.
  await firmar(actor, message);

  res.json({
    success: true,
    message: "Mensaje emitido y registrado en la colmena.",
    messagePayload: { senderId: actor, text: message }
  });
});



// -------------------------------------------------------------
// 6b. CONVOCATORIA — abre todos los CLIs en sus ventanas (kitty)
// -------------------------------------------------------------

app.post("/api/hive/convocar", async (req, res) => {
  const { token, message } = (req.body || {}) as { token?: string; message?: string };
  if (token !== ACCESS_TOKEN) return res.status(401).json({ error: "Token inválido" });

  const msg = (message || "¡Convocatoria de la Liga AETHON!").trim().slice(0, 200);

  // Registra la convocatoria en la colmena
  await firmar("agentos", `Convocatoria enviada: ${msg}`);
  await fs.writeFile(
    path.join(HIVE, "convocatoria-activa.md"),
    `# Convocatoria activa\nFecha: ${new Date().toISOString()}\nMensaje: ${msg}\n`
  );

  // Lanza el script en background (abre ventanas kitty; no esperamos a que termine)
  const script = path.join(os.homedir(), ".local/bin/agentos-convocar");
  execFile(script, [], { env: { ...process.env, AGENTOS_MSG: msg } }, (err) => {
    if (err) console.error("Error en convocatoria:", err.message);
  });

  res.json({ ok: true, message: msg, launched: ["claude-code", "opencode", "codex", "hermes-agent", "kiro", "odysseus"] });
});

// -------------------------------------------------------------
// 7. HIVE READ ENDPOINTS — datos reales de la mente colmena
// -------------------------------------------------------------

// Metadatos curados del roster real del ecosistema AETHON (desde
// contexto-compartido.md / agentes/*.md). La presencia (estado/visto) es en vivo.
const ROSTER: Record<string, { name: string; specialty: string; avatar: string; color: string; area: string; vibe: string; featured?: boolean }> = {
  "claude-code": { name: "Claude Code", specialty: "Asistente de programación principal", avatar: "🤖", color: "indigo", area: "Desarrollo", vibe: "Construye software, configura y analiza. Cambios quirúrgicos, profundidad de razonamiento.", featured: true },
  "hermes-agent": { name: "Hermes Agent", specialty: "Runtime de 51 agentes · 9 distritos", avatar: "🌌", color: "purple", area: "Automatización", vibe: "Orquestador NEXO → distrito → agentes. Lidera volumen: prospección, pauta y multimedia vía Vertex." },
  "max": { name: "MAX", specialty: "Agente autónomo (System + Studio)", avatar: "🦾", color: "emerald", area: "Negocios", vibe: "Agente propio de Juan. System en AWS + Studio PWA en Vercel." },
  "odysseus": { name: "Odysseus", specialty: "IA self-hosted (Docker + Vertex)", avatar: "🛰️", color: "cyan", area: "Automatización", vibe: "Conectado a la colmena vía MCP server hive. Escrituras append-only." },
  "opencode": { name: "OpenCode", specialty: "Asistente de programación", avatar: "⌨️", color: "amber", area: "Desarrollo", vibe: "Asistente CLI compatible vía AGENTS.md." },
  "antigravity": { name: "Antigravity", specialty: "Asistente de programación (IDE Google)", avatar: "🪐", color: "rose", area: "Desarrollo", vibe: "Asistente basado en Gemini. Generó el scaffold de AgentOS." },
  "kiro": { name: "Kiro", specialty: "IDE/CLI de AWS (spec-driven)", avatar: "🧲", color: "amber", area: "Desarrollo", vibe: "IDE de AWS (requiere AWS Builder ID). Desarrollo guiado por especificaciones. Última adquisición de Juan." },
  "codex": { name: "CLI Codex", specialty: "Asistente de programación", avatar: "📟", color: "zinc", area: "Desarrollo", vibe: "Asistente CLI compatible vía AGENTS.md. Sin acceso por ahora." },
  "command": { name: "Command", specialty: "Automatización por lenguaje natural (multi-modelo)", avatar: "🎛️", color: "zinc", area: "Automatización", vibe: "Orquesta flujos por comandos en lenguaje natural sobre Kimi/GLM/Minimax/Qwen. Sin acceso por ahora." },
  "cloudflare": { name: "Cloudflare", specialty: "Edge / Workers AI (futuro MCP, no CLI)", avatar: "☁️", color: "amber", area: "Automatización", vibe: "Ejecución serverless en el Edge. No es un CLI: se conectará como MCP. Sin acceso por ahora." },
  "runtime-watcher": { name: "Runtime Watcher", specialty: "Watcher de la colmena (chokidar)", avatar: "👁️", color: "zinc", area: "Automatización", vibe: "Capa viva: detecta cambios en ~/.hive y los registra en eventos.md." }
};

function isRecent(visto: string): boolean {
  const t = Date.parse(visto.replace(" ", "T"));
  if (isNaN(t)) return false;
  return Date.now() - t < 24 * 60 * 60 * 1000;
}

app.get("/api/hive/agents", async (_req, res) => {
  let presence: Record<string, { estado: string; visto: string }> = {};
  try { presence = JSON.parse(await readHive("presencia.json")); } catch { /* vacío */ }

  // Unión de actores: los curados + los que aparezcan en presencia.
  const ids = Array.from(new Set([...Object.keys(ROSTER), ...Object.keys(presence)]));

  const agents = ids.map((id) => {
    const meta = ROSTER[id] || { name: id, specialty: "Agente externo", avatar: "🤖", color: "zinc", area: "Automatización", vibe: "Agente conectado al ecosistema AETHON." };
    const pres = presence[id];
    return {
      id,
      name: meta.name,
      specialty: meta.specialty,
      avatar: meta.avatar,
      color: meta.color,
      area: meta.area,
      vibe: meta.vibe,
      featured: !!meta.featured,
      registered: !!pres,
      recentActivity: pres?.estado || "Sin actividad reciente registrada.",
      lastSeen: pres?.visto || null,
      active: pres ? isRecent(pres.visto) : false
    };
  });

  // Orden: #1 destacado, luego activos, luego por nombre.
  agents.sort((a, b) =>
    (Number(b.featured) - Number(a.featured)) ||
    (Number(b.active) - Number(a.active)) ||
    a.name.localeCompare(b.name)
  );

  res.json(agents);
});

app.get("/api/hive/projects", async (_req, res) => {
  const estado = await readHive("estado.md");
  const rows = estado.split("\n").filter((l) => l.trim().startsWith("|"));
  const projects = rows
    .map((l) => l.split("|").map((c) => c.trim()))
    .map((c) => c.filter((_, i) => i > 0)) // quita el primer elemento vacío del borde
    // Solo filas de la tabla de PROYECTOS: 2ª celda es % o "—" (excluye la tabla de agentes y separadores)
    .filter((c) => c.length >= 3 && c[0] && /^(\d+\s*%|—|-)$/.test(c[1]))
    .map((c) => {
      const name = c[0].replace(/\*\*/g, "").trim();
      const pct = parseInt((c[1] || "").replace(/[^0-9]/g, ""), 10);
      const statusRaw = (c[2] || "").trim();
      const emoji = (statusRaw.match(/^(\p{Emoji})/u) || [])[1] || "•";
      return { name, progress: isNaN(pct) ? null : pct, status: statusRaw, emoji };
    });
  res.json(projects);
});

app.get("/api/hive/events", async (_req, res) => {
  const raw = await readHive("eventos.md");
  const re = /^-\s+\*\*(.+?)\*\*\s+·\s+`(.+?)`\s+—\s+(.+)$/;
  const events = raw.split("\n").map((l) => l.match(re)).filter(Boolean).map((m) => ({
    time: m![1], actor: m![2], text: m![3]
  }));
  res.json(events.slice(-50).reverse());
});

app.get("/api/hive/decisions", async (_req, res) => {
  const raw = await readHive("decisiones.md");
  const blocks = raw.split(/\n##\s+/).slice(1);
  const decisions = blocks.map((b) => {
    const head = b.split("\n")[0] || "";
    const [date, ...titleParts] = head.split("—");
    const who = (b.match(/\*\*Qui[eé]n:\*\*\s*(.+)/) || [])[1] || null;
    const why = (b.match(/\*\*Por qu[eé]:\*\*\s*(.+)/) || [])[1] || null;
    return {
      date: date.trim(),
      title: titleParts.join("—").trim() || head.trim(),
      who: who?.trim() || null,
      why: why?.trim() || null
    };
  });
  res.json(decisions.reverse());
});

// -------------------------------------------------------------
// 8. POKÉDEX — roster temático Pokémon (party CLIs + megas ECC + región Hermes + legendarios)
// -------------------------------------------------------------

// Tipos Pokémon → color oficial + emoji
const TYPE_META: Record<string, { color: string; emoji: string }> = {
  "Psíquico": { color: "#f95587", emoji: "🔮" },
  "Siniestro": { color: "#705746", emoji: "🌑" },
  "Planta": { color: "#7ac74c", emoji: "🌿" },
  "Fuego": { color: "#ee8130", emoji: "🔥" },
  "Eléctrico": { color: "#f7d02c", emoji: "⚡" },
  "Acero": { color: "#b7b7ce", emoji: "⚙️" },
  "Lucha": { color: "#c22e28", emoji: "🥊" },
  "Hada": { color: "#d685ad", emoji: "✨" },
  "Dragón": { color: "#6f35fc", emoji: "🐉" },
  "Agua": { color: "#6390f0", emoji: "💧" },
  "Fantasma": { color: "#735797", emoji: "👻" },
  "Volador": { color: "#a98ff3", emoji: "🦅" },
  "Normal": { color: "#a8a77a", emoji: "⭐" }
};

// Distrito Hermes → tipo + línea evolutiva representativa
const DISTRICT_TYPE: Record<string, { type: string; species: string }> = {
  nexo: { type: "Psíquico", species: "línea Alakazam" },
  batida: { type: "Siniestro", species: "línea Houndoom" },
  growth: { type: "Planta", species: "línea Leafeon" },
  "media-factory": { type: "Fuego", species: "línea Delphox" },
  distribucion: { type: "Eléctrico", species: "línea Zebstrika" },
  infraestructura: { type: "Acero", species: "línea Aggron" },
  forja: { type: "Lucha", species: "línea Machamp" },
  cosecha: { type: "Hada", species: "línea Gardevoir" },
  congreso: { type: "Dragón", species: "línea Latios" }
};

// Party (CLIs) y legendarios (autónomos): especie + tipo + clase
// Ejecutores (Pokémon) y legendarios. `fainted` = sin acceso/mantenimiento → HP 0.
const PARTY_SPECIES: Record<string, { species: string; type: string; cls: "cli" | "legendario"; fainted?: boolean }> = {
  "claude-code": { species: "Charizard", type: "Dragón", cls: "cli" },
  "antigravity": { species: "Gengar", type: "Fantasma", cls: "cli" },
  "opencode": { species: "Blastoise", type: "Agua", cls: "cli" },
  "kiro": { species: "Magnezone", type: "Acero", cls: "cli" },
  "hermes-agent": { species: "Metagross", type: "Psíquico", cls: "cli" },
  "odysseus": { species: "Lugia", type: "Volador", cls: "cli" },
  "codex": { species: "Venusaur", type: "Planta", cls: "cli", fainted: true },
  "command": { species: "Porygon-Z", type: "Normal", cls: "cli", fainted: true },
  "cloudflare": { species: "Zapdos", type: "Volador", cls: "cli", fainted: true },
  "max": { species: "Mewtwo", type: "Psíquico", cls: "legendario" },
  "runtime-watcher": { species: "Noctowl", type: "Volador", cls: "legendario" }
};

// Moveset = modelos que corre cada ejecutor + para qué brilla (de MODELS.md).
// Solo los 5 ejecutores reales del ecosistema AETHON.
const MOVESETS: Record<string, { model: string; best: string }[]> = {
  "claude-code": [
    { model: "Opus 4.8", best: "Depurar/refactorizar monolitos críticos sin errores invisibles" },
    { model: "Opus 4.7", best: "Specs técnicas y algoritmos complejos no tradicionales" },
    { model: "Sonnet 4.6", best: "Vibe coding, testing E2E, Computer Use (1M ctx)" },
    { model: "Opus 4.6", best: "Documentación y mantenimiento de legacy delimitado" }
  ],
  "antigravity": [
    { model: "Gemini 3.5", best: "Contexto masivo (>2M) y multimodal; búsqueda cruzada en repos" },
    { model: "Gemini 3.1 Pro", best: "Razonamiento y generación de código de propósito general" },
    { model: "Opus 4.6", best: "Razonamiento estructurado estable; documentación y legacy" },
    { model: "Sonnet 4.6", best: "Vibe coding, testing E2E y Computer Use (1M ctx)" }
  ],
  "opencode": [
    { model: "DeepSeek V4 Flash", best: "Refactor iterativo veloz, scripts al vuelo (1M ctx)" },
    { model: "Gemini 3.5", best: "Hallar discrepancias en monorepos" },
    { model: "Grok 4.3", best: "Comandos Docker/K8s, IaC Terraform" },
    { model: "DeepSeek R1", best: "Autocorrección de compilación (Rust/C++)" }
  ],
  "kiro": [
    { model: "Sonnet 4.5", best: "Módulos que cumplen specs al pie de la letra" },
    { model: "GLM 5", best: "Requisitos → esquemas SQL/NoSQL, sintaxis EARS" }
  ],
  "hermes-agent": [
    { model: "Grok 4.3", best: "Análisis predictivo de mercado, inteligencia competitiva" },
    { model: "DeepSeek R1", best: "Optimización matemática, BBDD masivas, fraude auditable" },
    { model: "Gemini 3.5", best: "Auditoría documental (>2M ctx, multimodal)" }
  ],
  "odysseus": [
    { model: "DeepSeek R1", best: "BBDD confidenciales y código bajo NDA (local)" },
    { model: "Grok 4.3", best: "Guiones, contenido de alta retención, copys (local)" },
    { model: "Gemini 3.5", best: "Catalogar vídeo/audio/gráfico local en bruto" }
  ],
  "command": [
    { model: "Kimi 2.7", best: "Retención de contexto masivo; mapear ERPs heredados" },
    { model: "GLM 5.2", best: "Razonamiento veloz + JSON; orquestar APIs por intención" },
    { model: "Minimax M3", best: "Voz hiperrealista + EQ; soporte conversacional" },
    { model: "Qwen 3.6 Max", best: "Razonamiento bruto y mates; algoritmos de grafos/ML" }
  ],
  "cloudflare": [
    { model: "GLM 5.2", best: "Edge de baja latencia; filtrado anti prompt-injection" },
    { model: "DeepSeek V4 Pro", best: "Lógica empresarial global distribuida (1.6T, 1M ctx)" },
    { model: "Seedance 2.0", best: "Vídeo cinematográfico con audio nativo en tiempo real" }
  ]
};

// Mega Piedras de la party = sub-agentes ECC (~/.claude/agents). Cacheado (cambian poco).
let _megasCache: any[] | null = null;
async function getMegas() {
  if (_megasCache) return _megasCache;
  const dir = path.join(os.homedir(), ".claude", "agents");
  let files: string[] = [];
  try { files = (await fs.readdir(dir)).filter((f) => f.endsWith(".md")); } catch { return []; }
  const out: any[] = [];
  for (const f of files) {
    try {
      const raw = await fs.readFile(path.join(dir, f), "utf8");
      const name = (raw.match(/^name:\s*(.+)$/m) || [])[1]?.trim() || f.replace(/\.md$/, "");
      const desc = (raw.match(/^description:\s*(.+)$/m) || [])[1]?.trim() || "";
      const model = (raw.match(/^model:\s*(.+)$/m) || [])[1]?.trim() || null;
      out.push({ id: f.replace(/\.md$/, ""), name, description: desc.slice(0, 160), model });
    } catch { /* skip */ }
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  _megasCache = out;
  return out;
}

// Región Hermes = sistema-agentes.json (9 distritos / 51 agentes). Cacheado.
let _regionsCache: any[] | null = null;
async function getRegions() {
  if (_regionsCache) return _regionsCache;
  let data: any;
  try { data = JSON.parse(await fs.readFile(path.join(os.homedir(), ".hermes", "sistema-agentes.json"), "utf8")); }
  catch { return []; }
  const districts = data.districts || [];
  const agents = data.agents || [];
  const regions = districts.map((d: any) => {
    const meta = DISTRICT_TYPE[d.id] || { type: "Normal", species: "—" };
    const members = agents
      .filter((a: any) => a.district === d.id)
      .map((a: any) => ({
        id: a.id,
        name: a.name,
        role: (a.role || "").replace(/\s*\[EMBAJADOR\]/i, "").trim(),
        emoji: a.emoji || "🔹",
        model: a.model || null,
        ace: /\[EMBAJADOR\]/i.test(a.role || "")
      }));
    return { id: d.id, name: d.name, description: d.description, color: d.color, type: meta.type, species: meta.species, agents: members };
  });
  _regionsCache = regions;
  return regions;
}

// Z-Moves = skills (superpoderes) que cada ejecutor puede invocar. Una por carpeta.
const SKILL_DIRS: Record<string, string> = {
  "claude-code": path.join(os.homedir(), ".claude", "skills"),
  "hermes-agent": path.join(os.homedir(), ".hermes", "skills"),
  "kiro": path.join(os.homedir(), ".kiro", "skills"),
  "opencode": path.join(os.homedir(), ".config", "opencode", "skills"),
  "codex": path.join(os.homedir(), ".codex", "skills"),
  "antigravity": path.join(os.homedir(), ".gemini", "config", "skills"),
  "max": path.join(os.homedir(), "SISTEMA-MAX", "skills")
};

let _zmovesCache: Record<string, { count: number; items: { name: string; description: string }[] }> | null = null;
async function getAllZMoves() {
  if (_zmovesCache) return _zmovesCache;
  const out: Record<string, { count: number; items: { name: string; description: string }[] }> = {};
  for (const [id, dir] of Object.entries(SKILL_DIRS)) {
    const items: { name: string; description: string }[] = [];
    let dirents: any[] = [];
    try { dirents = await fs.readdir(dir, { withFileTypes: true }); } catch { dirents = []; }
    for (const d of dirents) {
      if (d.name.startsWith(".")) continue; // ignora carpetas ocultas (.archive, .system…)
      if (!d.isDirectory() && !d.isSymbolicLink()) continue;
      let name = d.name, description = "";
      try {
        const raw = await fs.readFile(path.join(dir, d.name, "SKILL.md"), "utf8");
        name = (raw.match(/^name:\s*(.+)$/m) || [])[1]?.trim() || d.name;
        description = ((raw.match(/^description:\s*(.+)$/m) || [])[1]?.trim() || "").slice(0, 120);
      } catch { /* usa el nombre de la carpeta */ }
      items.push({ name, description });
    }
    items.sort((a, b) => a.name.localeCompare(b.name));
    out[id] = { count: items.length, items };
  }
  _zmovesCache = out;
  return out;
}

app.get("/api/pokedex", async (_req, res) => {
  let presence: Record<string, { estado: string; visto: string }> = {};
  try { presence = JSON.parse(await readHive("presencia.json")); } catch { /* vacío */ }
  const [megas, regions] = await Promise.all([getMegas(), getRegions()]);

  const buildRoster = (cls: "cli" | "legendario") =>
    Object.entries(PARTY_SPECIES)
      .filter(([, v]) => v.cls === cls)
      .map(([id, v]) => {
        const meta = ROSTER[id];
        const pres = presence[id];
        const recent = pres ? isRecent(pres.visto) : false;
        // Debilitado = no registrado (sin presencia reciente). Al registrarse se enciende.
        // command/cloudflare quedan debilitados siempre (no son CLIs / Cloudflare = futuro MCP).
        // permanent debilitados: command/cloudflare (sin acceso), codex (sin acceso), max (servidor en pausa)
        const permanent = id === "command" || id === "cloudflare" || id === "codex" || id === "max";
        const fainted = permanent || !recent;
        return {
          id,
          name: meta?.name || id,
          species: v.species,
          type: v.type,
          specialty: meta?.specialty || "",
          vibe: meta?.vibe || "",
          avatar: meta?.avatar || "🤖",
          featured: !!meta?.featured,
          fainted,
          hp: fainted ? 0 : 100,
          recentActivity: id === "max" ? "Servidor AWS en pausa · reactivar cuando escale."
            : id === "codex" ? "Sin acceso en AETHON por ahora."
            : (id === "command" || id === "cloudflare") ? "Sin acceso configurado (futuro)."
            : recent ? (pres?.estado || "Activo.") : "No registrado — ejecuta agentos-register.",
          lastSeen: pres?.visto || null,
          active: !fainted,
          moves: MOVESETS[id] || []
        };
      })
      .sort((a, b) =>
        Number(b.featured) - Number(a.featured) ||
        Number(a.fainted) - Number(b.fainted) ||
        a.name.localeCompare(b.name)
      );

  const dynamax = await getDynamax();

  res.json({
    types: TYPE_META,
    ejecutores: buildRoster("cli"),
    legendarios: buildRoster("legendario"),
    megasHermes: regions,
    megasEcc: megas,
    dynamax
  });
});

// -------------------------------------------------------------
// DYNAMAX (MCP servers) — leen ~/.mcp.json + metadatos curados
// -------------------------------------------------------------

interface DynamaxEntry {
  id: string;
  name: string;
  emoji: string;
  type: string;          // tipo Pokémon (ej. "Fuego", "Psíquico")
  category: string;      // categoría humana (ej. "Multimedia", "Base de datos")
  description: string;
  transport: "node" | "http" | "unknown";
  url: string | null;    // para tipo http
  filePath: string | null; // para tipo node
  executors: string[];   // qué CLIs tienen acceso
  available: boolean;    // archivo existe o endpoint alcanzable
}

// Metadatos curados por ID de servidor MCP
const MCP_META: Record<string, Omit<DynamaxEntry, "id" | "transport" | "url" | "filePath" | "available" | "executors">> = {
  "vertex-images": {
    name: "Vertex Images",
    emoji: "🖼️",
    type: "Fuego",
    category: "Multimedia · Imágenes",
    description: "Genera imágenes con Imagen 4 vía Vertex AI (Google Cloud). Acceso directo desde cualquier CLI."
  },
  "veo-video": {
    name: "Veo Video",
    emoji: "🎬",
    type: "Dragón",
    category: "Multimedia · Video",
    description: "Genera videos con Veo 3 vía Vertex AI. La herramienta más potente de multimedia del ecosistema."
  },
  "supabase": {
    name: "Supabase",
    emoji: "🗄️",
    type: "Agua",
    category: "Base de datos",
    description: "Acceso completo a la base de datos Supabase: schema, queries, funciones y debugging en tiempo real."
  }
};

// Qué ejecutores tienen este MCP configurado (fuente: ~/.mcp.json es global)
const MCP_EXECUTORS: Record<string, string[]> = {
  "vertex-images": ["claude-code", "opencode", "antigravity"],
  "veo-video":     ["claude-code", "opencode", "antigravity"],
  "supabase":      ["claude-code", "opencode", "antigravity", "kiro"]
};

async function getDynamax(): Promise<DynamaxEntry[]> {
  let raw: Record<string, any> = {};
  try {
    const txt = await fs.readFile(path.join(os.homedir(), ".mcp.json"), "utf8");
    raw = JSON.parse(txt).mcpServers ?? {};
  } catch { /* sin config */ }

  return Promise.all(Object.entries(raw).map(async ([id, cfg]: [string, any]) => {
    const meta = MCP_META[id] ?? {
      name: id,
      emoji: "⚡",
      type: "Normal",
      category: "MCP",
      description: "Servidor MCP externo."
    };

    const isHttp = cfg.type === "http";
    const filePath = !isHttp && cfg.args?.[0] ? cfg.args[0] : null;

    let available = false;
    if (isHttp && cfg.url) {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 3000);
      try { await fetch(cfg.url, { signal: controller.signal }); available = true; } catch { /* nope */ } finally { clearTimeout(t); }
    } else if (filePath) {
      try { await fs.access(filePath); available = true; } catch { /* nope */ }
    }

    return {
      id,
      ...meta,
      transport: isHttp ? "http" : (filePath ? "node" : "unknown"),
      url: isHttp ? (cfg.url ?? null) : null,
      filePath,
      executors: MCP_EXECUTORS[id] ?? ["claude-code"],
      available
    } satisfies DynamaxEntry;
  }));
}

app.get("/api/dynamax", async (_req, res) => {
  res.json(await getDynamax());
});

// -------------------------------------------------------------
// COMPATIBILIDAD determinista: skill(categoría) × ejecutor × modelo
// compat = maestría(ejecutor) × afinidad(ejecutor,dominio) × (1 + bonus del modelo)
// -------------------------------------------------------------
const CATEGORY_DOMAIN: Record<string, string> = {
  "awesome-claude-skills": "general", "general": "general", "gstack": "dev",
  "claude-webkit": "frontend", "claude-seo": "marketing", "editor-pro-max": "content",
  "file-search": "analytics", "anthropics-skills": "docs", "superpowers": "engineering",
  "obsidian-skills": "knowledge", "cyber-neo": "security"
};
// Maestría: qué tan bien cada ejecutor organiza/usa los Z-moves (Claude Code el mejor).
const MASTERY: Record<string, number> = {
  "claude-code": 0.97, "hermes-agent": 0.88, "antigravity": 0.84,
  "opencode": 0.82, "odysseus": 0.80, "kiro": 0.74
};
// Afinidad ejecutor→dominio (default 0.8 si no se lista).
const AFFINITY: Record<string, Record<string, number>> = {
  "claude-code": { dev: 1.0, engineering: 1.0, frontend: 0.95, docs: 0.95, analytics: 0.9, security: 0.9, general: 0.92, knowledge: 0.85, marketing: 0.8, content: 0.8 },
  "hermes-agent": { marketing: 1.0, media: 1.0, research: 1.0, content: 0.95, analytics: 0.95, general: 0.9, docs: 0.85, dev: 0.78 },
  "antigravity": { docs: 0.95, general: 0.92, frontend: 0.9, analytics: 0.9, content: 0.85, dev: 0.85 },
  "opencode": { dev: 1.0, engineering: 0.95, frontend: 0.9, security: 0.85, general: 0.85 },
  "odysseus": { knowledge: 1.0, content: 0.9, analytics: 0.9, security: 0.9, general: 0.85, dev: 0.8 },
  "kiro": { dev: 0.95, docs: 0.95, engineering: 0.9, frontend: 0.8, general: 0.8 }
};
// Dominios fuertes por modelo (de CAPABILITIES.md). Bonus +8% si coincide.
const MODEL_DOMAINS: Record<string, string[]> = {
  "deepseek-r1": ["analytics", "dev", "engineering", "security"],
  "grok-4.3": ["marketing", "content", "research"],
  "gemini-3.5": ["analytics", "docs", "general", "media"],
  "gemini-3.5-flash": ["analytics", "docs", "general", "media"],
  "claude-opus-4-7": ["dev", "engineering", "docs"],
  "claude-opus-4-8": ["dev", "engineering"],
  "claude-opus-4-6": ["dev", "docs"],
  "claude-sonnet-4-6": ["dev", "frontend"],
  "claude-sonnet-4-5": ["dev", "docs"],
  "gemini-3.1-pro": ["general", "dev", "docs"],
  "deepseek-v4-flash": ["dev", "frontend"],
  "glm-5": ["dev", "docs"]
};
function compat(executorId: string, model: string | null, category: string): number {
  const base = MASTERY[executorId];
  if (base === undefined) return 0; // ejecutor debilitado / sin acceso
  const domain = CATEGORY_DOMAIN[category] || "general";
  const aff = (AFFINITY[executorId] && AFFINITY[executorId][domain]) ?? 0.8;
  const bonus = model && MODEL_DOMAINS[model]?.includes(domain) ? 0.08 : 0;
  return Math.max(5, Math.min(99, Math.round(100 * base * aff * (1 + bonus))));
}
// Distrito Hermes → dominio → categoría Z representativa (para asignar Z-move a un agente).
const DISTRICT_DOMAIN: Record<string, string> = {
  nexo: "engineering", batida: "research", growth: "marketing", "media-factory": "media",
  distribucion: "marketing", infraestructura: "dev", forja: "dev", cosecha: "content", congreso: "general"
};
const DOMAIN_CATEGORY: Record<string, string> = {
  general: "awesome-claude-skills", dev: "gstack", frontend: "claude-webkit", marketing: "claude-seo",
  content: "editor-pro-max", analytics: "file-search", docs: "anthropics-skills",
  engineering: "superpowers", knowledge: "obsidian-skills", security: "cyber-neo",
  media: "editor-pro-max", research: "file-search"
};
type ZItem = { name: string; description: string; category: string };

// Modelos (en id) que corre cada ejecutor, para elegir el mejor runner.
const EXECUTOR_MODELS: Record<string, string[]> = {
  "claude-code": ["claude-opus-4-8", "claude-opus-4-7", "claude-sonnet-4-6", "claude-opus-4-6"],
  "antigravity": ["gemini-3.5", "gemini-3.1-pro", "claude-opus-4-6", "claude-sonnet-4-6"],
  "opencode": ["deepseek-v4-flash", "gemini-3.5", "grok-4.3", "deepseek-r1"],
  "kiro": ["claude-sonnet-4-5", "glm-5"],
  "hermes-agent": ["grok-4.3", "deepseek-r1", "gemini-3.5"],
  "odysseus": ["deepseek-r1", "grok-4.3", "gemini-3.5"]
};

// Mejor ejecutor+modelo para una categoría (maximiza compat). Cierra el círculo.
function bestRunner(category: string) {
  let best = { executorId: "hermes-agent", executorName: ROSTER["hermes-agent"]?.name || "Hermes Agent", model: null as string | null, compat: 0 };
  for (const [ex, models] of Object.entries(EXECUTOR_MODELS)) {
    for (const m of [null, ...models]) {
      const c = compat(ex, m, category);
      if (c > best.compat) best = { executorId: ex, executorName: ROSTER[ex]?.name || ex, model: m, compat: c };
    }
  }
  return best;
}

// Selección determinista (fallback): la categoría filtra; dentro, las skills que matchean.
function pickSkillsForAgent(districtId: string, goalLower: string, catalog: ZItem[]) {
  const domain = DISTRICT_DOMAIN[districtId] || "general";
  const category = DOMAIN_CATEGORY[domain] || "awesome-claude-skills";
  const inCat = catalog.filter((s) => s.category === category);
  const words = goalLower.split(/\s+/).filter((w) => w.length > 3);
  const matched = inCat.filter((s) => words.some((w) => (s.name + " " + s.description).toLowerCase().includes(w)));
  return (matched.length ? matched : inCat).slice(0, 3).map((s) => ({ name: s.name, category }));
}

// Los distritos de Hermes — sus agentes SIEMPRE van al runner hermes-agent.
const HERMES_DISTRICTS = new Set(["nexo", "batida", "growth", "media-factory", "distribucion", "infraestructura", "forja", "cosecha", "congreso"]);

// Asigna el runner correcto:
//   - Agentes de distrito Hermes → hermes-agent (siempre; Hermes los orquesta internamente)
//   - Agentes sin distrito (ECC, externos) → bestRunner() por dominio
function enrichAgentRunner(districtId: string, skills: { name: string; category: string }[]) {
  let runner: ReturnType<typeof bestRunner>;
  if (HERMES_DISTRICTS.has(districtId)) {
    runner = { executorId: "hermes-agent", executorName: ROSTER["hermes-agent"]?.name || "Hermes Agent", model: "grok-4.3", compat: 88 };
  } else {
    const primaryCat = DOMAIN_CATEGORY[DISTRICT_DOMAIN[districtId] || "general"] || "awesome-claude-skills";
    runner = bestRunner(primaryCat);
  }
  const zmoves = skills.map((s) => ({ name: s.name, category: s.category, compat: compat(runner.executorId, runner.model, s.category) }));
  return { runner, zmoves };
}

// Biblioteca GLOBAL de Movimientos Z (skills del bundle). Vive APARTE; cualquier
// ejecutor o agente puede equipar una cuando se necesita. Cacheada.
let _zCatalog: { name: string; description: string; category: string }[] | null = null;
async function getZCatalog() {
  if (_zCatalog) return _zCatalog;
  try {
    _zCatalog = JSON.parse(await fs.readFile(path.join(process.cwd(), "zmoves-catalog.json"), "utf8"));
  } catch {
    _zCatalog = [];
  }
  return _zCatalog!;
}

app.get("/api/zmoves", async (_req, res) => {
  const all = await getZCatalog();
  const categories: Record<string, number> = {};
  for (const z of all) categories[z.category] = (categories[z.category] || 0) + 1;

  // Matriz de compatibilidad: cada categoría × cada ejecutor activo (sin modelo → base).
  const execs = Object.keys(MASTERY).map((id) => ({ id, name: ROSTER[id]?.name || id, mastery: Math.round(MASTERY[id] * 100) }));
  const compatMatrix = Object.keys(categories).map((cat) => ({
    category: cat,
    domain: CATEGORY_DOMAIN[cat] || "general",
    scores: Object.fromEntries(Object.keys(MASTERY).map((id) => [id, compat(id, null, cat)]))
  }));

  res.json({
    total: all.length,
    categories,
    items: all,
    plugins: ["superpowers (obra@5.0.7)", "claude-plugins-official"],
    compat: { executors: execs, matrix: compatMatrix }
  });
});

// -------------------------------------------------------------
// 9. PROFESOR OAK — Director Estratégico (objetivo → equipo recomendado)
//    Recomendador por reglas sobre el roster REAL. La IA (gemini) se activará
//    cuando el gateway Vertex tenga saldo (hoy la clave responde 429).
// -------------------------------------------------------------
const OAK_RULES: { kw: string[]; districts: string[]; reason: string }[] = [
  { kw: ["ad", "ads", "campañ", "campan", "pauta", "anuncio", "publicidad", "marketing"], districts: ["media-factory", "distribucion"], reason: "producción de creativos + pauta a escala" },
  { kw: ["video", "imagen", "imágen", "contenido", "multimedia", "guion", "reel", "tiktok"], districts: ["media-factory"], reason: "multimedia (video/imagen) vía Vertex" },
  { kw: ["lead", "prospec", "scrap", "cliente", "ventas", "venta", "cerrar", "cierre"], districts: ["batida", "growth"], reason: "prospección y cierre de leads" },
  { kw: ["web", "app", "códig", "codig", "software", "landing", "frontend", "backend", "api", "bug", "fix", "feature"], districts: ["forja"], reason: "desarrollo del producto" },
  { kw: ["infra", "deploy", "servidor", "uptime", "docker", "sre", "monitor", "ci/cd"], districts: ["infraestructura"], reason: "despliegue y uptime 24/7" },
  { kw: ["reten", "soporte", "onboarding", "upsell", "postventa", "fideliz"], districts: ["cosecha"], reason: "retención y customer success" },
  { kw: ["estrateg", "analiz", "análisis", "decision", "investig", "research", "mercado", "viabilidad"], districts: ["congreso"], reason: "inteligencia estratégica" },
  { kw: ["automatiz", "n8n", "workflow", "flujo", "integrac"], districts: ["distribucion", "nexo"], reason: "automatización de flujos" }
];

// Plan con IA: DeepSeek V4 Pro vía NVIDIA (endpoint OpenAI-compatible).
// La clave viene de process.env.NVIDIA_API_KEY (nunca incrustada). Devuelve null si
// no hay clave o si algo falla → el endpoint cae al recomendador por reglas.
async function oakAI(goal: string, regions: any[]): Promise<any | null> {
  // Por defecto usa el gateway Vertex local (inyecta su propio OAuth; el api_key es dummy).
  const url = process.env.OAK_BASE_URL || "http://127.0.0.1:9000/v1/chat/completions";
  const apiKey = process.env.OAK_API_KEY || "dummy";
  const model = process.env.OAK_MODEL || "xai/grok-4.3";

  const agentIndex: Record<string, any> = {};
  for (const r of regions) for (const a of r.agents) agentIndex[a.id] = { ...a, district: r.name, districtId: r.id, type: r.type };

  const rosterText = regions
    .map((r: any) => `${r.name} [${r.type}]: ` + r.agents.map((a: any) => `${a.id} (${a.name} — ${a.role})`).join("; "))
    .join("\n");

  // Catálogo completo de Movimientos Z (Oak arranca una sola vez: puede ver todo).
  const catalog = (await getZCatalog()) as ZItem[];
  const skillIndex: Record<string, string> = {};
  const byCat: Record<string, string[]> = {};
  for (const s of catalog) {
    skillIndex[s.name.toLowerCase()] = s.category;
    (byCat[s.category] ||= []).push(`${s.name}: ${(s.description || "").slice(0, 55)}`);
  }
  const catalogText = Object.entries(byCat).map(([c, arr]) => `### ${c} (${arr.length} skills)\n${arr.join("\n")}`).join("\n\n");

  const prompt = `Eres el Profesor Oak, Director Estratégico de AgentOS. Descompones el objetivo del CEO y armas el mejor equipo con sus especialistas reales.

Contexto de capacidades (qué cerebro brilla en qué, úsalo para razonar el equipo):
- DeepSeek R1: matemática, criptografía y razonamiento lógico riguroso (deadlocks, teoría de juegos).
- Grok 4.3: facticidad/honestidad, análisis de mercado y tendencias, reportes ejecutivos, diagnóstico de red.
- Gemini 3.5: documentos masivos (>1.8M tokens), multimodal, ETL, orquestación.
- Opus 4.8: depuración crítica y honestidad extrema. Sonnet 4.6: ejecución en terminal y orquestación de subagentes.
- GLM 5: specs→SQL y optimización. Qwen 3.6 Max: matemática pesada. Kimi: contexto masivo/legal.

Objetivo del CEO: "${goal}"

Especialistas reales disponibles (por distrito):
${rosterText}

Biblioteca de Movimientos Z (skills). La categoría es solo un FILTRO para acotar dónde buscar; elige las skills ESPECÍFICAS por su nombre exacto que cada agente usará (pueden ser varias):
${catalogText}

Devuelve SOLO un objeto JSON válido (sin texto fuera del JSON, sin markdown) con esta forma exacta:
{"projectName":"nombre corto","team":[{"agentId":"id-exacto","reason":"por qué aporta","zmoves":["nombre-exacto-de-skill","..."]}],"steps":["paso 1","paso 2"]}

Reglas: elige TODOS los especialistas necesarios (sin tope; mínimo 2); cada agentId debe existir EXACTAMENTE en la lista de especialistas; "nexus" primero; para cada agente elige por su NOMBRE EXACTO las skills (zmoves) de la biblioteca que de verdad usará (varias permitido); responde en español.`;

  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 90000);
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.6,
        top_p: 0.95,
        max_tokens: 4096,
        stream: false
      }),
      signal: ctrl.signal
    });
    clearTimeout(to);
    if (!resp.ok) { console.error("Oak IA: HTTP", resp.status); return null; }
    const data: any = await resp.json();
    const content: string = data?.choices?.[0]?.message?.content || "";
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const plan = JSON.parse(match[0]);
    const team = (plan.team || [])
      .map((t: any) => {
        const a = agentIndex[t.agentId];
        if (!a) return null;
        const picks: any[] = Array.isArray(t.zmoves) ? t.zmoves : [];
        let skills = picks
          .map((nm: any) => {
            const cat = skillIndex[String(nm).toLowerCase()];
            return cat ? { name: String(nm), category: cat } : null;
          })
          .filter(Boolean) as { name: string; category: string }[];
        if (skills.length === 0) skills = pickSkillsForAgent(a.districtId, goal.toLowerCase(), catalog);
        const { runner, zmoves } = enrichAgentRunner(a.districtId, skills);
        return { id: a.id, name: a.name, emoji: a.emoji, district: a.district, type: a.type, reason: t.reason, runner, zmoves };
      })
      .filter(Boolean);
    if (team.length === 0) return null;
    return {
      source: "ia",
      mission: goal,
      projectName: plan.projectName || null,
      team,
      steps: (plan.steps && plan.steps.length) ? plan.steps : [
        "NEXO encuadra el objetivo y reparte el trabajo.",
        "El equipo ejecuta en secuencia, heredando contexto.",
        "Las decisiones que requieran tu OK aparecen en 'Decisiones del Campeón'.",
        "El avance se ve en vivo en la 'Bitácora de Batalla'."
      ],
      note: `Plan generado por ${model} vía tu gateway Vertex, sobre tu roster real.`
    };
  } catch (e: any) {
    console.error("Oak IA error:", e?.message);
    return null;
  }
}

// GET /api/graph — stats del grafo de conocimiento graphify
app.get("/api/graph", async (_req, res) => {
  const graphPath = path.join(os.homedir(), "graphify-out", "graph.json");
  const commPath  = path.join(os.homedir(), "graphify-out", ".graphify_communities.json");
  const reportPath = path.join(os.homedir(), "graphify-out", "GRAPH_REPORT.md");
  try {
    const [graphExists, commExists] = await Promise.all([
      fs.access(graphPath).then(() => true).catch(() => false),
      fs.access(commPath).then(() => true).catch(() => false),
    ]);
    if (!graphExists) return res.json({ exists: false });
    const [graphRaw, commRaw] = await Promise.all([
      fs.readFile(graphPath, "utf8"),
      commExists ? fs.readFile(commPath, "utf8") : Promise.resolve("{}"),
    ]);
    const graph = JSON.parse(graphRaw);
    const communities: Record<string, string[]> = JSON.parse(commRaw);
    const topComms = Object.entries(communities)
      .map(([id, members]) => ({ id: Number(id), size: members.length, sample: members.slice(0, 3) }))
      .sort((a, b) => b.size - a.size)
      .slice(0, 15);
    const stat = await fs.stat(graphPath);
    let report = "";
    try { report = await fs.readFile(reportPath, "utf8"); } catch {}
    res.json({
      exists: true,
      nodes: graph.nodes?.length ?? 0,
      edges: graph.links?.length ?? 0,
      communities: Object.keys(communities).length,
      topCommunities: topComms,
      generatedAt: stat.mtime.toISOString(),
      report,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/oak/plan", async (req, res) => {
  const goal = String(req.body?.goal || "").trim();
  if (!goal) return res.status(400).json({ error: "Describe un objetivo para que Oak arme el equipo." });

  const g = goal.toLowerCase();
  const regions = await getRegions();

  // 1) Intenta el plan con IA (Grok 4.3 vía Vertex). Si el gateway falla → reglas.
  const ai = await oakAI(goal, regions);
  if (ai) return res.json(ai);

  const catalog = (await getZCatalog()) as ZItem[];
  const byId: Record<string, any> = Object.fromEntries(regions.map((r: any) => [r.id, r]));

  // Distritos que aplican según palabras clave del objetivo
  const picked = new Map<string, string>();
  for (const rule of OAK_RULES) {
    if (rule.kw.some((k) => g.includes(k))) {
      for (const dz of rule.districts) if (!picked.has(dz)) picked.set(dz, rule.reason);
    }
  }
  // Si nada hizo match, equipo por defecto: estrategia + desarrollo
  if (picked.size === 0) {
    picked.set("congreso", "encuadrar el objetivo y los riesgos");
    picked.set("forja", "ejecución/desarrollo");
  }

  // NEXO siempre coordina, y va primero
  const order = ["nexo", ...[...picked.keys()].filter((d) => d !== "nexo")];
  picked.set("nexo", picked.get("nexo") || "orquestación y coordinación del equipo");

  const team = order.map((dz) => {
    const reg = byId[dz];
    if (!reg) return null;
    const ace = reg.agents.find((a: any) => a.ace) || reg.agents[0];
    if (!ace) return null;
    const skills = pickSkillsForAgent(reg.id, g, catalog);
    const { runner, zmoves } = enrichAgentRunner(reg.id, skills);
    return { id: ace.id, name: ace.name, emoji: ace.emoji, district: reg.name, type: reg.type, reason: picked.get(dz), runner, zmoves };
  }).filter(Boolean);

  res.json({
    source: "heuristica",
    mission: goal,
    team,
    steps: [
      "NEXO encuadra el objetivo y reparte el trabajo en la colmena.",
      `El equipo (${team.length} agentes) ejecuta en secuencia, heredando contexto.`,
      "Las decisiones que requieran tu OK aparecerán en 'Decisiones del Campeón'.",
      "El avance se verá en vivo en la 'Bitácora de Batalla'."
    ],
    note: "Plan por reglas sobre tu roster real. (Grok 4.3 vía el gateway Vertex no respondió; verifica que vertex-proxy.service esté arriba en :9000.)"
  });
});

// -------------------------------------------------------------
// 8. HEALTH CHECK — prueba real de cada ejecutor
// -------------------------------------------------------------

interface HealthResult {
  id: string;
  name: string;
  checkType: "http" | "docker" | "presence";
  status: "vivo" | "debilitado";
  latencyMs: number | null;
  detail: string;
}

// Lee API_SERVER_KEY de ~/.hermes/.env sin exponer el valor
async function getHermesKey(): Promise<string> {
  try {
    const raw = await fs.readFile(path.join(os.homedir(), ".hermes", ".env"), "utf8");
    const match = raw.match(/^API_SERVER_KEY=(.+)$/m);
    return match?.[1]?.trim() ?? "";
  } catch { return ""; }
}

async function httpPing(url: string, timeoutMs = 3000): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const t0 = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    await fetch(url, { signal: controller.signal });
    return { ok: true, latencyMs: Date.now() - t0 };
  } catch (e: unknown) {
    return { ok: false, latencyMs: Date.now() - t0, error: (e as Error).message };
  } finally {
    clearTimeout(timer);
  }
}

async function dockerCheck(nameFilter: string, timeoutMs = 4000): Promise<{ running: boolean; detail: string }> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve({ running: false, detail: "timeout al verificar Docker" }), timeoutMs);
    execFile("docker", ["ps", "--filter", `name=${nameFilter}`, "--format", "{{.Status}}"], (err, stdout) => {
      clearTimeout(timer);
      const status = stdout.trim();
      if (err || !status) {
        resolve({ running: false, detail: status || "Contenedor no encontrado o Docker sin acceso" });
      } else {
        resolve({ running: status.toLowerCase().startsWith("up"), detail: status });
      }
    });
  });
}

app.get("/api/health/all", async (_req, res) => {
  let presence: Record<string, { estado: string; visto: string }> = {};
  try { presence = JSON.parse(await readHive("presencia.json")); } catch { /* vacío */ }

  // VIVO = puede responder mensajes ahora mismo
  // DEBILITADO = no puede responder (servidor apagado / sin acceso)
  // MAX está explícitamente en pausa (servidor AWS down); Command/Cloudflare sin acceso aún.
  const checks: Promise<HealthResult>[] = [
    // HTTP: Hermes gateway — usa /health con Bearer token
    (async (): Promise<HealthResult> => {
      const key = await getHermesKey();
      const t0 = Date.now();
      let ok = false; let latencyMs = 0; let detail = "";
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 3000);
        const r = await fetch("http://127.0.0.1:8642/health", {
          headers: key ? { Authorization: `Bearer ${key}` } : {},
          signal: ctrl.signal
        });
        clearTimeout(timer);
        latencyMs = Date.now() - t0;
        const body = await r.json() as any;
        ok = body?.status === "ok" || r.ok;
        detail = ok ? `Gateway :8642 · ${latencyMs}ms · ${key ? "auth OK" : "sin key"}` : `HTTP ${r.status}`;
      } catch (e: unknown) { latencyMs = Date.now() - t0; detail = (e as Error).message; }
      const presActive = presence["hermes-agent"] ? isRecent(presence["hermes-agent"].visto) : false;
      const alive = ok || presActive;
      return {
        id: "hermes-agent", name: "Hermes Agent", checkType: "http",
        status: alive ? "vivo" : "debilitado",
        latencyMs: ok ? latencyMs : null,
        detail: ok ? detail : (presActive ? "Registrado en colmena · gateway offline" : `Gateway offline · ${detail}`)
      };
    })(),
    // HTTP: Vertex gateway (cerebro de Oak)
    (async (): Promise<HealthResult> => {
      const r = await httpPing("http://127.0.0.1:9000/v1/models");
      return {
        id: "vertex-gateway", name: "Vertex Gateway (Oak)", checkType: "http",
        status: r.ok ? "vivo" : "debilitado",
        latencyMs: r.ok ? r.latencyMs : null,
        detail: r.ok ? `Gateway :9000 en ${r.latencyMs}ms` : (r.error || "Sin respuesta en :9000")
      };
    })(),
    // Docker: Odysseus — vivo si el contenedor está Up
    (async (): Promise<HealthResult> => {
      const d = await dockerCheck("odysseus");
      return {
        id: "odysseus", name: "Odysseus", checkType: "docker",
        status: d.running ? "vivo" : "debilitado",
        latencyMs: null,
        detail: d.running ? `Docker activo: ${d.detail}` : `Contenedor detenido · ${d.detail}`
      };
    })(),
    // Presence: CLIs que responden mensajes cuando están en sesión activa
    ...["claude-code", "antigravity", "opencode", "codex", "kiro"].map(async (id): Promise<HealthResult> => {
      const pres = presence[id];
      const active = pres ? isRecent(pres.visto) : false;
      const meta = ROSTER[id];
      return {
        id, name: meta?.name || id, checkType: "presence",
        status: active ? "vivo" : "debilitado", latencyMs: null,
        detail: active ? `En sesión: ${pres!.estado}` : (pres ? `Última vez: ${pres.visto}` : "Sin registro en colmena")
      };
    }),
    // Runtime Watcher — chequea el servicio systemd hive-watch
    (async (): Promise<HealthResult> => {
      return new Promise((resolve) => {
        const timer = setTimeout(() => resolve({
          id: "runtime-watcher", name: "Runtime Watcher", checkType: "presence",
          status: "debilitado", latencyMs: null, detail: "timeout al verificar systemd"
        }), 3000);
        execFile("systemctl", ["--user", "is-active", "hive-watch"], (err, stdout) => {
          clearTimeout(timer);
          const active = stdout.trim() === "active";
          resolve({
            id: "runtime-watcher", name: "Runtime Watcher", checkType: "presence",
            status: active ? "vivo" : "debilitado", latencyMs: null,
            detail: active ? "hive-watch activo · escuchando ~/.hive" : `hive-watch ${stdout.trim() || "inactivo"} · lanzar: systemctl --user start hive-watch`
          });
        });
      });
    })(),
    // Forzado DEBILITADO — sin acceso configurado aún
    ...(["max", "command", "cloudflare"] as const).map(async (id): Promise<HealthResult> => {
      const meta = ROSTER[id as string];
      const reason =
        id === "max" ? "Servidor AWS en pausa · no responde" :
        "Sin acceso configurado por ahora";
      return {
        id, name: meta?.name || id, checkType: "presence",
        status: "debilitado" as const, latencyMs: null, detail: reason
      };
    })
  ];

  const results = await Promise.all(checks);
  res.json({ timestamp: new Date().toISOString(), results });
});

// -------------------------------------------------------------
// MISIONES — pipeline autónomo 6 fases (Juan dispara, agentes ejecutan)
// -------------------------------------------------------------

type MissionPhase =
  | "planning"            // Oak está armando el equipo
  | "awaiting_approval"   // Juan revisa el plan
  | "executing"           // agentes corriendo
  | "awaiting_validation" // Juan valida el resultado
  | "done"
  | "failed";

interface MissionTask {
  id: string;
  agentId: string;
  agentName: string;
  agentEmoji: string;
  district: string;
  runner: string;
  zmoves: string[];
  role: "coordinator" | "specialist" | "validator" | "verifier";
  prompt: string;
  status: "pending" | "running" | "done" | "failed";
  output: string;
  retries: number;
  startedAt: string | null;
  finishedAt: string | null;
  /** Runner original si la tarea fue reasignada por no-disponibilidad */
  reassignedFrom?: string;
}

interface Mission {
  id: string;
  goal: string;
  phase: MissionPhase;
  oakSource: string;
  project: { name: string; path: string } | null;
  /** Guía del entrenador en vivo (human-in-the-loop): se inyecta a las tareas que arranquen después */
  guidance: { text: string; at: string }[];
  /** Tarea espejo en el kanban de Hermes (Fase 3) — null si el CLI no estaba disponible */
  kanbanTaskId?: string | null;
  /** Modo descubrimiento (loop-until-dry): si está presente, los especialistas buscan
   *  en rondas hasta agotar hallazgos nuevos en vez de correr una sola vez. */
  discovery?: { maxRounds: number; maxDryStreak: number } | null;
  tasks: MissionTask[];
  result: string | null;
  validationNote: string | null;
  createdAt: string;
  updatedAt: string;
}

const MISSIONS_DIR = path.join(HIVE, "missions");

// -------------------------------------------------------------
// EN VIVO — bus de eventos por misión (SSE)
// -------------------------------------------------------------
type LiveEvent =
  | { type: "chunk"; taskId: string; text: string }
  | { type: "task"; taskId: string; status: MissionTask["status"] }
  | { type: "phase"; phase: MissionPhase }
  | { type: "guide"; text: string; at: string };

const missionBus = new EventEmitter();
missionBus.setMaxListeners(100);

function emitLive(missionId: string, ev: LiveEvent): void {
  missionBus.emit(missionId, ev);
}

// Misiones ejecutándose AHORA: el objeto en memoria es la fuente de verdad
// mientras corre (el disco es un snapshot con throttle). La guía del
// entrenador debe mutar ESTE objeto para que las tareas en curso la vean.
const activeMissions = new Map<string, Mission>();

// Aborto de misiones: cada dispatch registra un "killer" (mata su proceso o
// aborta su fetch). Abortar = disparar todos los killers + marcar la misión.
const abortedMissions = new Set<string>();
const missionKillers = new Map<string, Set<() => void>>();

function registerKiller(missionId: string, kill: () => void): () => void {
  let set = missionKillers.get(missionId);
  if (!set) { set = new Set(); missionKillers.set(missionId, set); }
  set.add(kill);
  return () => { set!.delete(kill); };
}

// -------------------------------------------------------------
// FASE 3 — espejo de misiones en el kanban de Hermes.
// La CLI `hermes kanban` escribe directo a ~/.hermes/kanban.db (SQLite):
// no requiere gateway ni puerto. Todo es best-effort: si falla, la misión sigue.
// -------------------------------------------------------------
const HERMES_BIN = path.join(os.homedir(), ".local", "bin", "hermes");

function kanbanCli(args: string[]): Promise<string> {
  return new Promise((resolve) => {
    execFile(HERMES_BIN, ["kanban", ...args], { timeout: 20_000 }, (err, stdout, stderr) => {
      if (err) {
        console.error("kanban:", (stderr || err.message).trim().slice(0, 200));
        return resolve("");
      }
      resolve(stdout.trim());
    });
  });
}

async function kanbanCreateForMission(mission: Mission): Promise<void> {
  const body = [
    `Misión AgentOS ${mission.id}`,
    mission.project ? `Proyecto: ${mission.project.name} (${mission.project.path})` : "Sin proyecto",
    `Equipo: ${mission.tasks.map(t => `${t.agentEmoji} ${t.agentName} [${t.runner}]`).join(", ")}`
  ].join("\n");
  // "blocked": el task es un espejo informativo — un worker de Hermes NO debe
  // reclamarlo y ejecutar la misión por segunda vez.
  const out = await kanbanCli([
    "create", `Misión AgentOS: ${capText(mission.goal, 120)}`,
    "--body", body, "--created-by", "agentos",
    "--initial-status", "blocked", "--json"
  ]);
  try { mission.kanbanTaskId = (JSON.parse(out) as { id?: string }).id ?? null; }
  catch { mission.kanbanTaskId = null; }
}

function kanbanComment(mission: Mission, text: string): void {
  if (!mission.kanbanTaskId) return;
  void kanbanCli(["comment", mission.kanbanTaskId, text, "--author", "agentos"]);
}

// -------------------------------------------------------------
// PROYECTOS LOCALES — contexto de ejecución para misiones
// -------------------------------------------------------------
const PROJECTS_ROOT = path.join(os.homedir(), "proyectos");
const PROJECTS_EXCLUDE = new Set(["__pycache__", "graphify-out", "node_modules"]);

app.get("/api/projects/local", async (_req, res) => {
  try {
    const entries = await fs.readdir(PROJECTS_ROOT, { withFileTypes: true });
    const dirs = entries
      .filter(e => e.isDirectory() && !PROJECTS_EXCLUDE.has(e.name) && !e.name.startsWith("."))
      .map(e => ({ id: e.name, name: e.name, path: path.join(PROJECTS_ROOT, e.name) }))
      .sort((a, b) => a.name.localeCompare(b.name));
    res.json(dirs);
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// Resuelve un projectId a su carpeta real bajo ~/proyectos (sin traversal).
async function resolveProject(projectId: string): Promise<Mission["project"]> {
  const safe = path.basename(projectId.trim());
  if (!safe || safe.startsWith(".")) return null;
  const p = path.join(PROJECTS_ROOT, safe);
  try {
    const st = await fs.stat(p);
    return st.isDirectory() ? { name: safe, path: p } : null;
  } catch { return null; }
}

// -------------------------------------------------------------
// AGENT REGISTRY — qué runner está realmente disponible AHORA.
// Raíz del problema "los agentes no aparecen como utilizables":
// Oak asignaba runners sin verificar que el binario/gateway existiera.
// -------------------------------------------------------------
interface RunnerInfo {
  id: string;
  name: string;
  kind: "cli" | "gateway";
  available: boolean;
  detail: string;
}

const RUNNER_BINARIES: Record<string, { name: string; bin: string }> = {
  "claude-code": { name: "Claude Code", bin: path.join(os.homedir(), ".npm-global", "bin", "claude") },
  "opencode":    { name: "OpenCode",    bin: path.join(os.homedir(), ".opencode", "bin", "opencode") },
  "codex":       { name: "Codex",       bin: path.join(os.homedir(), ".npm-global", "bin", "codex") },
  "kiro":        { name: "Kiro",        bin: path.join(os.homedir(), ".local", "bin", "kiro-cli") },
};

// Orden de preferencia al reasignar tareas de un runner caído.
const RUNNER_FALLBACK_ORDER = ["claude-code", "opencode", "kiro", "codex"];

async function getRunnerRegistry(): Promise<Record<string, RunnerInfo>> {
  const registry: Record<string, RunnerInfo> = {};

  await Promise.all(Object.entries(RUNNER_BINARIES).map(async ([id, meta]) => {
    let available = false;
    try { await fs.access(meta.bin); available = true; } catch { /* binario ausente */ }
    registry[id] = {
      id, name: meta.name, kind: "cli", available,
      detail: available ? meta.bin : `Binario no encontrado: ${meta.bin}`
    };
  }));

  // Hermes: disponible solo si el gateway responde /health ahora mismo.
  let hermesLive = false;
  let hermesDetail = "Gateway :8642 sin respuesta";
  try {
    const key = await getHermesKey();
    const r = await fetch("http://127.0.0.1:8642/health", {
      headers: key ? { Authorization: `Bearer ${key}` } : {},
      signal: AbortSignal.timeout(2500)
    });
    const body = await r.json() as { status?: string };
    hermesLive = body?.status === "ok" || r.ok;
    if (hermesLive) hermesDetail = "Gateway :8642 vivo";
  } catch (e: unknown) {
    hermesDetail = `Gateway :8642 offline · ${(e as Error).message}`;
  }
  registry["hermes-agent"] = {
    id: "hermes-agent", name: "Hermes Agent", kind: "gateway",
    available: hermesLive, detail: hermesDetail
  };

  // Odysseus: bridge OpenAI-compatible → Vertex en la interfaz docker.
  let odysseusLive = false;
  let odysseusDetail = `Gateway ${ODYSSEUS_GW} sin respuesta`;
  try {
    const r = await fetch(`${ODYSSEUS_GW}/v1/models`, { signal: AbortSignal.timeout(2500) });
    odysseusLive = r.ok;
    if (odysseusLive) odysseusDetail = `Bridge Vertex vivo · modelo por defecto ${ODYSSEUS_MODEL}`;
  } catch (e: unknown) {
    odysseusDetail = `Bridge offline · ${(e as Error).message}`;
  }
  registry["odysseus"] = {
    id: "odysseus", name: "Odysseus", kind: "gateway",
    available: odysseusLive, detail: odysseusDetail
  };

  // Antigravity: es un IDE, no tiene CLI headless — Oak puede proponerlo pero
  // como runner de misiones SIEMPRE se reasigna a un ejecutable real.
  registry["antigravity"] = {
    id: "antigravity", name: "Antigravity", kind: "cli",
    available: false, detail: "Sin CLI headless — no ejecutable como runner de misiones"
  };

  return registry;
}

app.get("/api/agents/registry", async (_req, res) => {
  try {
    res.json({ timestamp: new Date().toISOString(), runners: await getRunnerRegistry() });
  } catch (e: unknown) {
    res.status(500).json({ error: (e as Error).message });
  }
});

const MISSION_ID_RE = /^mission-[A-Za-z0-9-]+$/;

async function readMission(id: string): Promise<Mission | null> {
  if (!MISSION_ID_RE.test(id)) return null; // evita path traversal vía :id
  try {
    const m = JSON.parse(await fs.readFile(path.join(MISSIONS_DIR, `${id}.json`), "utf8")) as Mission;
    // Normalizar misiones creadas antes de estos campos
    m.project ??= null;
    m.guidance ??= [];
    return m;
  } catch { return null; }
}

async function writeMission(m: Mission): Promise<void> {
  await fs.mkdir(MISSIONS_DIR, { recursive: true });
  await fs.writeFile(path.join(MISSIONS_DIR, `${m.id}.json`), JSON.stringify(m, null, 2));
}

async function listMissions(): Promise<Mission[]> {
  try {
    const files = await fs.readdir(MISSIONS_DIR);
    const all = await Promise.all(
      files.filter(f => f.endsWith(".json")).map(f => readMission(f.replace(".json", "")))
    );
    return (all.filter(Boolean) as Mission[])
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch { return []; }
}

// -------------------------------------------------------------
// Dispatcher streaming — spawn con cwd (contexto de proyecto) y
// onChunk (texto en vivo). Mata el proceso de verdad en timeout.
// -------------------------------------------------------------
const TASK_TIMEOUT_MS = 600_000;   // 10 min por tarea (trabajo real en proyectos)
const MAX_OUTPUT_BYTES = 4 * 1024 * 1024;

interface DispatchOpts {
  cwd?: string;
  onChunk?: (text: string) => void;
  /** Registra una función que aborta este dispatch; devuelve el des-registro */
  registerKill?: (kill: () => void) => () => void;
}

// En Linux, cada string de argv está limitado a ~128 KB (MAX_ARG_STRLEN).
// Los prompts enriquecidos (plan + outputs del equipo) pueden superarlo → E2BIG.
// Claude recibe el prompt por stdin (sin límite); el resto se trunca con margen.
const MAX_ARGV_PROMPT = 100_000;

function capText(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max) + "\n\n…[truncado por límite de tamaño]";
}

function spawnStreaming(
  cmd: string,
  args: string[],
  opts: {
    cwd?: string; timeoutMs: number; onRaw?: (text: string) => void;
    stdinData?: string; registerKill?: DispatchOpts["registerKill"];
  }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: opts.cwd, env: process.env });
    const unregisterKill = opts.registerKill?.(() => {
      try { child.kill("SIGTERM"); } catch { /* ya murió */ }
      setTimeout(() => { try { child.kill("SIGKILL"); } catch { /* ya murió */ } }, 3000).unref();
    });
    // Siempre con handler: si el spawn falla (binario ausente), end() sobre un
    // stream destruido emitiría 'error' sin listener y tumbaría el proceso.
    child.stdin.on("error", () => { /* el proceso puede cerrar stdin antes */ });
    if (opts.stdinData !== undefined) child.stdin.write(opts.stdinData);
    child.stdin.end();
    let out = "";
    let err = "";
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      unregisterKill?.();
      child.kill("SIGTERM");
      setTimeout(() => { try { child.kill("SIGKILL"); } catch { /* ya murió */ } }, 5000).unref();
      reject(new Error(`Timeout tras ${Math.round(opts.timeoutMs / 1000)}s — proceso terminado`));
    }, opts.timeoutMs);

    child.stdout.on("data", (b: Buffer) => {
      const t = b.toString("utf8");
      if (out.length < MAX_OUTPUT_BYTES) out += t;
      opts.onRaw?.(t);
    });
    child.stderr.on("data", (b: Buffer) => {
      if (err.length < MAX_OUTPUT_BYTES) err += b.toString("utf8");
    });
    child.on("error", (e) => {
      if (settled) return;
      settled = true;
      unregisterKill?.();
      clearTimeout(timer);
      reject(e);
    });
    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      unregisterKill?.();
      clearTimeout(timer);
      if (code !== 0 && !out.trim()) return reject(new Error(err.trim() || `Proceso salió con código ${code}`));
      resolve(out.trim() || err.trim());
    });
  });
}

// Parser NDJSON del stream de `claude -p --output-format stream-json`:
// emite el texto del asistente a medida que llega y captura el resultado final.
function makeClaudeStreamParser(onText: (t: string) => void) {
  let buf = "";
  let finalResult = "";
  return {
    feed(raw: string) {
      buf += raw;
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        const s = line.trim();
        if (!s) continue;
        try {
          const ev = JSON.parse(s);
          if (ev.type === "assistant") {
            for (const c of ev.message?.content ?? []) {
              if (c.type === "text" && c.text) onText(c.text);
            }
          } else if (ev.type === "result" && typeof ev.result === "string") {
            finalResult = ev.result;
          }
        } catch {
          onText(line + "\n");
        }
      }
    },
    result() { return finalResult; }
  };
}

// Streaming genérico contra cualquier gateway OpenAI-compatible (SSE).
async function streamChatCompletions(
  url: string,
  model: string,
  headers: Record<string, string>,
  messages: { role: string; content: string }[],
  opts: {
    onChunk?: (t: string) => void; timeoutMs: number;
    registerKill?: DispatchOpts["registerKill"];
  }
): Promise<string> {
  const aborter = new AbortController();
  const unregisterKill = opts.registerKill?.(() => aborter.abort(new Error("Misión abortada")));
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ model, messages, stream: true }),
      signal: AbortSignal.any([AbortSignal.timeout(opts.timeoutMs), aborter.signal])
    });
    if (!r.ok) throw new Error(`Gateway HTTP ${r.status}: ${await r.text()}`);
    if (!r.body) throw new Error("Gateway: respuesta sin body");

    let full = "";
    let buf = "";
    const decoder = new TextDecoder();
    for await (const chunk of r.body as unknown as AsyncIterable<Uint8Array>) {
      buf += decoder.decode(chunk, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        const s = line.trim();
        if (!s.startsWith("data:")) continue;
        const payload = s.slice(5).trim();
        if (payload === "[DONE]") continue;
        try {
          const ev = JSON.parse(payload);
          const delta: string = ev?.choices?.[0]?.delta?.content
            ?? ev?.choices?.[0]?.message?.content ?? "";
          if (delta) {
            full += delta;
            opts.onChunk?.(delta);
          }
        } catch { /* línea SSE no-JSON: ignorar */ }
      }
    }
    return full;
  } finally {
    unregisterKill?.();
  }
}

// Hermes: gateway local :8642 con Bearer + headers de sesión.
async function hermesStreamChat(
  messages: { role: string; content: string }[],
  opts: {
    onChunk?: (t: string) => void; timeoutMs: number; sessionId?: string;
    registerKill?: DispatchOpts["registerKill"];
  }
): Promise<string> {
  const key = await getHermesKey();
  if (!key) throw new Error("Hermes: API_SERVER_KEY no encontrada en ~/.hermes/.env");
  const headers: Record<string, string> = {
    "Authorization": `Bearer ${key}`,
    "X-Hermes-Session-Key": "agentos:missions"
  };
  if (opts.sessionId) headers["X-Hermes-Session-Id"] = opts.sessionId;
  return streamChatCompletions(
    "http://127.0.0.1:8642/v1/chat/completions", "hermes-agent", headers, messages,
    { onChunk: opts.onChunk, timeoutMs: opts.timeoutMs, registerKill: opts.registerKill }
  );
}

// Odysseus: bridge OpenAI-compatible → Vertex, en la interfaz docker
// (172.17.0.1:9001, systemd `odysseus-vertex-gw`). Sin auth de cliente:
// las credenciales viven en el gateway. Sin herramientas de filesystem.
const ODYSSEUS_GW = "http://172.17.0.1:9001";
const ODYSSEUS_MODEL = "google/gemini-3.5-flash";

function odysseusStreamChat(
  prompt: string,
  opts: { onChunk?: (t: string) => void; registerKill?: DispatchOpts["registerKill"] }
): Promise<string> {
  const note = "\n\n(Nota: eres un modelo vía gateway, sin acceso al filesystem. Razona con el contexto provisto y sé concreto.)";
  return streamChatCompletions(
    `${ODYSSEUS_GW}/v1/chat/completions`, ODYSSEUS_MODEL, {},
    [{ role: "user", content: prompt + note }],
    { onChunk: opts.onChunk, timeoutMs: TASK_TIMEOUT_MS, registerKill: opts.registerKill }
  );
}

// Dispatcher — ejecuta una tarea en el runner correcto y devuelve el output
async function dispatchToRunner(runner: string, prompt: string, opts: DispatchOpts = {}): Promise<string> {
  const HOME = os.homedir();

  if (runner === "hermes-agent") {
    return hermesStreamChat(
      [{ role: "user", content: prompt }],
      { onChunk: opts.onChunk, timeoutMs: TASK_TIMEOUT_MS, registerKill: opts.registerKill }
    );
  }

  if (runner === "odysseus") {
    return odysseusStreamChat(prompt, { onChunk: opts.onChunk, registerKill: opts.registerKill });
  }

  if (runner === "claude-code") {
    // Prompt por STDIN (evita E2BIG con prompts enriquecidos de varios cientos de KB).
    const args = ["-p", "--output-format", "stream-json", "--verbose"];
    // Con proyecto: permitir que edite archivos dentro del cwd sin aprobación manual.
    if (opts.cwd) args.push("--permission-mode", "acceptEdits");
    const parser = makeClaudeStreamParser(t => opts.onChunk?.(t));
    const raw = await spawnStreaming(`${HOME}/.npm-global/bin/claude`, args, {
      cwd: opts.cwd, timeoutMs: TASK_TIMEOUT_MS, stdinData: prompt,
      onRaw: c => parser.feed(c), registerKill: opts.registerKill
    });
    return parser.result() || raw;
  }

  if (runner === "codex") {
    // Codex también lee el prompt por stdin ("-") → sin límite de argv.
    const args = ["exec", "--skip-git-repo-check"];
    if (opts.cwd) args.push("-s", "workspace-write"); // puede editar dentro del proyecto
    args.push("-");
    return spawnStreaming(`${HOME}/.npm-global/bin/codex`, args, {
      cwd: opts.cwd, timeoutMs: TASK_TIMEOUT_MS, stdinData: prompt,
      onRaw: t => opts.onChunk?.(t), registerKill: opts.registerKill
    });
  }

  // Estos CLIs reciben el prompt por argv → respetar MAX_ARG_STRLEN de Linux.
  const argvPrompt = capText(prompt, MAX_ARGV_PROMPT);
  const runnerMap: Record<string, { cmd: string; args: string[] }> = {
    "opencode": { cmd: `${HOME}/.opencode/bin/opencode`, args: ["run", argvPrompt] },
    "kiro":     { cmd: `${HOME}/.local/bin/kiro-cli`,    args: ["chat", "--no-interactive", "--trust-all-tools", argvPrompt] },
  };
  const cfg = runnerMap[runner];
  if (!cfg) throw new Error(`Runner desconocido: ${runner}`);

  return spawnStreaming(cfg.cmd, cfg.args, {
    cwd: opts.cwd, timeoutMs: TASK_TIMEOUT_MS, onRaw: t => opts.onChunk?.(t),
    registerKill: opts.registerKill
  });
}

// Ejecuta una tarea con hasta 2 reintentos, emitiendo el output en vivo
async function runTask(task: MissionTask, enrichedPrompt: string, mission: Mission): Promise<void> {
  task.status = "running";
  task.startedAt = new Date().toISOString();
  emitLive(mission.id, { type: "task", taskId: task.id, status: "running" });
  await writeMission(mission);

  let lastFlush = Date.now();
  const onChunk = (text: string) => {
    if (task.output.length < MAX_OUTPUT_BYTES) task.output += text;
    emitLive(mission.id, { type: "chunk", taskId: task.id, text });
    // Persistir con throttle para que un refresh recupere el progreso.
    if (Date.now() - lastFlush > 2000) {
      lastFlush = Date.now();
      writeMission(mission).catch(() => {});
    }
  };

  const markAborted = async () => {
    task.status = "failed";
    task.output = task.output || "⛔ Abortada por el entrenador";
    task.finishedAt = new Date().toISOString();
    emitLive(mission.id, { type: "task", taskId: task.id, status: "failed" });
    await writeMission(mission);
  };

  const attemptErrors: string[] = [];
  for (let attempt = 0; attempt <= 2; attempt++) {
    if (abortedMissions.has(mission.id)) return markAborted();
    try {
      task.output = "";
      // Human-in-the-loop: la guía escrita por Juan hasta AHORA entra al prompt
      // de cualquier tarea (o reintento) que arranque después.
      const guidance = (mission.guidance ?? [])
        .map(g => `- [${g.at.slice(11, 16)}] ${g.text}`).join("\n");
      const promptWithGuidance = guidance
        ? `${enrichedPrompt}\n\n## GUÍA DEL ENTRENADOR (en vivo — prioridad máxima)\n${guidance}`
        : enrichedPrompt;

      const result = await dispatchToRunner(task.runner, promptWithGuidance, {
        cwd: mission.project?.path,
        onChunk,
        registerKill: kill => registerKiller(mission.id, kill)
      });
      // Un proceso matado por abort puede "resolver" con output parcial:
      // el aborto manda sobre cualquier resultado.
      if (abortedMissions.has(mission.id)) { task.output = ""; return markAborted(); }
      task.output = result || task.output;
      task.status = "done";
      task.finishedAt = new Date().toISOString();
      emitLive(mission.id, { type: "task", taskId: task.id, status: "done" });
      await writeMission(mission);
      return;
    } catch (e: unknown) {
      if (abortedMissions.has(mission.id)) return markAborted();
      task.retries = attempt + 1;
      const msg = (e as Error).message;
      attemptErrors.push(`intento ${attempt + 1}: ${msg}`);
      console.error(`[misión ${mission.id}] ${task.agentName} (${task.runner}) falló — ${msg}`);
      if (attempt === 2) {
        task.status = "failed";
        task.output = `Error tras ${task.retries} intentos:\n${attemptErrors.join("\n")}`;
        task.finishedAt = new Date().toISOString();
        emitLive(mission.id, { type: "task", taskId: task.id, status: "failed" });
        await writeMission(mission);
      } else {
        await new Promise(r => setTimeout(r, 3000)); // backoff antes de reintentar
      }
    }
  }
}

// Despacha al bloque de Hermes: UNA sola petición a NEXUS como orquestador.
// Hermes usa delegate_task internamente para sus 51 agentes.
// Todos los tasks de hermes-agent de esta misión quedan cubiertos con esa respuesta.
async function dispatchHermesBlock(mission: Mission, hermesTasks: MissionTask[]): Promise<void> {
  const key = await getHermesKey();
  if (!key) {
    for (const t of hermesTasks) {
      t.status = "failed"; t.output = "API_SERVER_KEY no encontrada en ~/.hermes/.env";
      t.finishedAt = new Date().toISOString();
    }
    await writeMission(mission);
    return;
  }

  const agentNames = hermesTasks.map(t => `${t.agentEmoji} ${t.agentName} (${t.district})`).join(", ");
  const systemPrompt = [
    `Eres NEXUS, el orquestador central de SISTEMA-MAX.`,
    `Tienes disponibles estos especialistas: ${agentNames}.`,
    mission.project ? `La misión pertenece al proyecto "${mission.project.name}" (ruta local: ${mission.project.path}).` : "",
    `Analiza la misión, usa delegate_task para delegar a los especialistas necesarios,`,
    `coordina sus resultados internamente y devuelve un reporte final consolidado.`
  ].filter(Boolean).join(" ");

  const lead = hermesTasks[0];
  for (const t of hermesTasks) { t.status = "running"; t.startedAt = new Date().toISOString(); }
  emitLive(mission.id, { type: "task", taskId: lead.id, status: "running" });
  await writeMission(mission);

  try {
    let lastFlush = Date.now();
    const output = await hermesStreamChat(
      [
        { role: "system", content: systemPrompt },
        { role: "user",   content: `Misión: ${mission.goal}` }
      ],
      {
        sessionId: mission.id,
        timeoutMs: 600_000, // 10 min — Hermes coordina internamente
        registerKill: kill => registerKiller(mission.id, kill),
        onChunk: (text) => {
          if (lead.output.length < MAX_OUTPUT_BYTES) lead.output += text;
          emitLive(mission.id, { type: "chunk", taskId: lead.id, text });
          if (Date.now() - lastFlush > 2000) {
            lastFlush = Date.now();
            writeMission(mission).catch(() => {});
          }
        }
      }
    );

    lead.output = output; lead.status = "done"; lead.finishedAt = new Date().toISOString();
    emitLive(mission.id, { type: "task", taskId: lead.id, status: "done" });
    for (const t of hermesTasks.slice(1)) {
      t.status = "done"; t.output = "(coordinado internamente por NEXUS)";
      t.finishedAt = new Date().toISOString();
    }
  } catch (e: unknown) {
    const aborted = abortedMissions.has(mission.id);
    for (const t of hermesTasks) {
      t.status = "failed";
      t.output = aborted ? "⛔ Abortada por el entrenador" : `Hermes: ${(e as Error).message}`;
      t.finishedAt = new Date().toISOString();
    }
    emitLive(mission.id, { type: "task", taskId: lead.id, status: "failed" });
  }
  await writeMission(mission);
}

// Loop-until-dry (graph-engineering, Bloque 3 #11): relanza a los especialistas en
// rondas mientras sigan apareciendo hallazgos nuevos. Cada ronda ve TODO lo encontrado
// en rondas anteriores (no solo lo "confirmado") para no redescubrir lo mismo — el
// error clásico del patrón. Nunca bloquea: si un runner falla, esa tarea cuenta como
// "sin hallazgos nuevos" y el loop sigue su curso hacia el tope de rondas.
async function runDiscoveryRounds(
  mission: Mission,
  specialists: MissionTask[],
  coordCtx: string,
  opts: { maxRounds: number; maxDryStreak: number }
): Promise<{ outputs: string[]; roundsRun: number }> {
  if (specialists.length === 0) return { outputs: [], roundsRun: 0 };

  const outputs: string[] = [];
  let seenCorpus = "";
  let dryStreak = 0;
  let round = 1;

  while (round <= opts.maxRounds && dryStreak < opts.maxDryStreak) {
    if (abortedMissions.has(mission.id)) break;

    const roundTasks: MissionTask[] = specialists.map(t => ({
      ...t, id: `${t.id}-r${round}`, status: "pending", output: "",
      retries: 0, startedAt: null, finishedAt: null
    }));
    mission.tasks.push(...roundTasks);

    const roundPrompt = (base: string) => [
      base, coordCtx,
      `\n\n## RONDA DE DESCUBRIMIENTO ${round}/${opts.maxRounds}`,
      `Ya se encontró lo siguiente en rondas anteriores — NO lo repitas, busca SOLO`,
      `hallazgos genuinamente nuevos:`,
      capText(seenCorpus, 12_000) || "(nada todavía — esta es la primera ronda)",
      ``,
      `Termina tu respuesta con una línea EXACTA "NUEVOS: <número>" indicando cuántos`,
      `hallazgos nuevos reportás (0 si no encontraste ninguno).`
    ].join("\n");

    await Promise.all(roundTasks.map(t => runTask(t, roundPrompt(t.prompt), mission)));
    if (abortedMissions.has(mission.id)) break;

    const roundOutputs = roundTasks
      .filter(t => t.status === "done")
      .map(t => `### ${t.agentEmoji} ${t.agentName} (ronda ${round})\n${capText(t.output, 16_000)}`);

    // Si una tarea no parsea "NUEVOS: N" (falló, o el modelo no siguió el formato),
    // se asume conservador que SÍ pudo haber algo nuevo — nunca cortar el loop por
    // una respuesta rara; el tope de rondas sigue acotando el costo igual.
    const totalNew = roundTasks
      .filter(t => t.status === "done")
      .reduce((sum, t) => {
        const m = t.output.match(/NUEVOS:\s*(\d+)/i);
        return sum + (m ? parseInt(m[1], 10) : 1);
      }, 0);

    outputs.push(...roundOutputs);
    if (roundOutputs.length > 0) seenCorpus += "\n\n" + roundOutputs.join("\n\n");
    dryStreak = totalNew === 0 ? dryStreak + 1 : 0;
    round++;
  }

  return { outputs, roundsRun: round - 1 };
}

// Pipeline de runners locales (Claude Code, OpenCode, Kiro, Codex):
//   Fase A — Coordinador (idx 0): define el plan
//   Fase B — Especialistas: en paralelo con el contexto del coordinador
//            (o en rondas hasta secarse, si la misión está en modo descubrimiento)
//   Fase C — Validador (último): sintetiza todos los outputs
async function runLocalPipeline(mission: Mission, tasks: MissionTask[]): Promise<void> {
  if (tasks.length === 0) return;

  const coordinator = tasks[0];
  await runTask(coordinator, coordinator.prompt, mission);
  const coordCtx = coordinator.status === "done"
    ? `\n\n## Plan del Coordinador (${coordinator.agentName})\n${capText(coordinator.output, 24_000)}`
    : "";

  const specialists = tasks.length > 2 ? tasks.slice(1, -1) : [];
  const validator   = tasks.length > 1 ? tasks[tasks.length - 1] : null;

  let specialistOutputs: string;
  if (mission.discovery) {
    const { outputs, roundsRun } = await runDiscoveryRounds(mission, specialists, coordCtx, mission.discovery);
    specialistOutputs = [
      `_Modo descubrimiento: ${roundsRun} ronda(s) ejecutada(s)._`,
      ...outputs
    ].join("\n\n---\n\n");
    // Las plantillas originales de especialista nunca se ejecutan directo en modo
    // descubrimiento (se clonan por ronda) — sin esto quedarían "pending" para
    // siempre en la UI aunque la misión ya haya terminado.
    for (const t of specialists) {
      t.status = "done";
      t.output = `(modo descubrimiento — ejecutado en ${roundsRun} ronda(s), ver ${t.id}-r*)`;
      t.finishedAt = new Date().toISOString();
      emitLive(mission.id, { type: "task", taskId: t.id, status: "done" });
    }
    await writeMission(mission);
  } else {
    await Promise.all(specialists.map(t => runTask(t, t.prompt + coordCtx, mission)));
    specialistOutputs = specialists
      .filter(t => t.status === "done")
      .map(t => `### ${t.agentEmoji} ${t.agentName}\n${capText(t.output, 16_000)}`)
      .join("\n\n---\n\n");
  }

  if (validator) {
    const vPrompt = [validator.prompt, coordCtx, specialistOutputs ? `\n\n## Outputs del equipo\n${specialistOutputs}` : ""].join("");
    await runTask(validator, vPrompt, mission);
  }
}

// Verificador independiente: escéptico con contexto fresco que revisa el resultado
// CONSOLIDADO de la misión antes de que quede awaiting_validation para Juan.
// Nunca es el mismo agente/tarea que produjo el resultado (nunca corrige su propio
// examen), y su output es informativo — no bloquea ni cambia la fase de la misión.
// Si falla (runner caído, timeout), se anota y se sigue: nunca atasca la misión (L4).
async function runVerifier(mission: Mission, consolidated: string): Promise<MissionTask> {
  const registry = await getRunnerRegistry();
  const usedRunners = new Set(mission.tasks.map(t => t.runner));
  const runner =
    RUNNER_FALLBACK_ORDER.find(r => registry[r]?.available && !usedRunners.has(r)) ??
    RUNNER_FALLBACK_ORDER.find(r => registry[r]?.available) ??
    "claude-code";

  const prompt = [
    `Eres un VERIFICADOR INDEPENDIENTE. No participaste en este trabajo — tu único`,
    `trabajo es intentar refutarlo, no aprobarlo por cortesía.`,
    ``,
    `OBJETIVO DE LA MISIÓN: ${mission.goal}`,
    ``,
    `RESULTADO CONSOLIDADO A VERIFICAR:`,
    capText(consolidated, 24_000),
    ``,
    `Revisa: (1) afirmaciones sin soporte en el propio resultado, (2) tareas que dicen`,
    `haber terminado pero cuyo contenido no responde de verdad al objetivo, (3)`,
    `contradicciones entre secciones. Sé específico y breve. Termina con una línea`,
    `exacta: "VEREDICTO: OK" si no encontraste problemas relevantes, o`,
    `"VEREDICTO: REVISAR" seguida de la lista de problemas encontrados.`
  ].join("\n");

  const task: MissionTask = {
    id: "task-verifier", agentId: "verifier", agentName: "Verificador",
    agentEmoji: "🔎", district: "Verificación", runner, zmoves: [],
    role: "verifier", prompt, status: "pending", output: "",
    retries: 0, startedAt: null, finishedAt: null
  };
  mission.tasks.push(task);
  await runTask(task, prompt, mission);
  return task;
}

// Orquestador principal:
//   — Agrupa las tareas de Hermes → un solo bloque global
//   — Runners locales → pipeline coordinado
//   — Ambos corren en paralelo entre sí
async function executeMission(missionId: string): Promise<void> {
  const mission = await readMission(missionId);
  if (!mission) return;

  activeMissions.set(mission.id, mission);
  try {
    mission.phase = "executing";
    emitLive(mission.id, { type: "phase", phase: "executing" });
    await writeMission(mission);
    await firmar("agentos", `Misión en ejecución: ${mission.goal}`);

    // Fase 3: espejo en el kanban de Hermes (best-effort)
    await kanbanCreateForMission(mission);
    if (mission.kanbanTaskId) await writeMission(mission);

    const hermesTasks = mission.tasks.filter(t => t.runner === "hermes-agent");
    const localTasks  = mission.tasks.filter(t => t.runner !== "hermes-agent");

    await Promise.all([
      hermesTasks.length > 0 ? dispatchHermesBlock(mission, hermesTasks) : Promise.resolve(),
      localTasks.length  > 0 ? runLocalPipeline(mission, localTasks)     : Promise.resolve()
    ]);

    // Aborto del entrenador: cerrar la misión como fallida, sin pedir validación.
    if (abortedMissions.has(mission.id)) {
      for (const t of mission.tasks) {
        if (t.status === "running" || t.status === "pending") {
          t.status = "failed";
          t.output = t.output || "⛔ Abortada por el entrenador";
          t.finishedAt = new Date().toISOString();
        }
      }
      mission.phase = "failed";
      mission.result = "⛔ Misión abortada por el entrenador.";
      mission.updatedAt = new Date().toISOString();
      emitLive(mission.id, { type: "phase", phase: "failed" });
      await writeMission(mission);
      await firmar("agentos", `Misión abortada por Juan: ${mission.goal}`);
      kanbanComment(mission, "⛔ Misión abortada por el entrenador desde AgentOS.");
      return;
    }

    // El resultado final: output de NEXUS (si existió) + validador local
    const nexus    = hermesTasks[0];
    const localVal = localTasks.length > 1 ? localTasks[localTasks.length - 1] : localTasks[0];
    const parts: string[] = [];
    if (nexus?.status === "done")    parts.push(`## 🌌 Hermes (NEXUS + equipo)\n${nexus.output}`);
    if (localVal?.status === "done") parts.push(`## 🤖 Runners locales\n${localVal.output}`);
    if (parts.length === 0) {
      parts.push(mission.tasks.filter(t => t.output).map(t => `## ${t.agentName}\n${t.output}`).join("\n\n---\n\n"));
    }

    const allDone   = mission.tasks.every(t => t.status === "done");
    const allFailed = mission.tasks.length > 0 && mission.tasks.every(t => t.status === "failed");

    // Verificación independiente del resultado consolidado, antes de que Juan lo vea.
    // Solo tiene sentido si algo sí funcionó; nunca bloquea ni atasca la misión.
    let verifierSection = "";
    if (!allFailed) {
      try {
        const verifierTask = await runVerifier(mission, parts.join("\n\n---\n\n"));
        verifierSection = verifierTask.status === "done"
          ? `\n\n---\n\n## 🔎 Verificación independiente (${verifierTask.runner})\n${verifierTask.output}`
          : `\n\n---\n\n## 🔎 Verificación independiente\n⚠️ No se pudo completar (${capText(verifierTask.output, 400)}).`;
      } catch (e: unknown) {
        verifierSection = `\n\n---\n\n## 🔎 Verificación independiente\n⚠️ Error al lanzar el verificador: ${(e as Error).message}`;
      }
    }

    // Si NADA funcionó no hay qué validar: la misión falla directamente.
    mission.phase = allFailed ? "failed" : "awaiting_validation";
    mission.result = parts.join("\n\n---\n\n") + verifierSection;
    mission.updatedAt = new Date().toISOString();
    emitLive(mission.id, { type: "phase", phase: mission.phase });
    await writeMission(mission);
    await firmar("agentos", allFailed
      ? `Misión fallida (ningún agente completó): ${mission.goal}`
      : `Misión lista para validar (${allDone ? "todo OK" : "parcial"}): ${mission.goal}`);
    kanbanComment(mission, allFailed
      ? "✗ Todos los agentes fallaron — misión marcada como fallida."
      : `Agentes terminaron (${mission.tasks.filter(t => t.status === "done").length}/${mission.tasks.length} OK) — esperando validación de Juan en AgentOS.`);
  } catch (e: unknown) {
    // Nunca dejar una misión atascada en "executing".
    console.error(`[misión ${mission.id}] error fatal del orquestador:`, e);
    mission.phase = "failed";
    mission.result = `Error fatal del orquestador: ${(e as Error).message}`;
    mission.updatedAt = new Date().toISOString();
    emitLive(mission.id, { type: "phase", phase: "failed" });
    await writeMission(mission).catch(() => {});
    kanbanComment(mission, `✗ Error fatal del orquestador: ${(e as Error).message}`);
  } finally {
    activeMissions.delete(mission.id);
    abortedMissions.delete(mission.id);
    missionKillers.delete(mission.id);
  }
}

// Al arrancar el servidor: misiones que quedaron "executing"/"planning" por un
// reinicio no pueden seguir (los procesos murieron) → marcarlas failed.
async function reconcileStuckMissions(): Promise<void> {
  const all = await listMissions();
  for (const m of all) {
    if (m.phase === "executing" || m.phase === "planning") {
      const prevPhase = m.phase;
      m.phase = "failed";
      m.result = (m.result ? m.result + "\n\n" : "") +
        "⚠️ Misión interrumpida por reinicio del servidor AgentOS.";
      m.updatedAt = new Date().toISOString();
      await writeMission(m).catch(() => {});
      console.warn(`[reconcile] misión ${m.id} estaba en "${prevPhase}" tras reinicio → failed`);
    }
  }
}

// Construye el prompt específico por agente según su rol en el pipeline
function buildTaskPrompt(
  goal: string,
  task: Pick<MissionTask, "agentName" | "district" | "zmoves" | "role"> & { reason: string },
  project: Mission["project"] = null
): string {
  const roleInstructions: Record<MissionTask["role"], string[]> = {
    coordinator: [
      `Eres el COORDINADOR de esta misión. Tu trabajo es definir el plan de ataque.`,
      `Responde con:`,
      `1. Análisis del objetivo: qué implica y qué partes tiene`,
      `2. División del trabajo: qué debe hacer cada especialista (sé específico)`,
      `3. Criterio de éxito: cómo saber que la misión está completa`,
    ],
    specialist: [
      `Eres un ESPECIALISTA. El coordinador ya definió el plan (te llegará como contexto).`,
      `Ejecuta tu parte específica. Responde con:`,
      `1. Qué hiciste / analizaste / produjiste`,
      `2. El resultado concreto (datos, código, recomendaciones, contenido)`,
      `3. Una nota breve para el validador sobre lo que entregás`,
    ],
    validator: [
      `Eres el VALIDADOR y SINTETIZADOR final. Recibirás el plan del coordinador y los outputs de todos los especialistas.`,
      `Tu trabajo es:`,
      `1. Verificar que cada especialista cumplió su parte`,
      `2. Sintetizar todo en un resultado final cohesivo y accionable`,
      `3. Señalar qué quedó incompleto o necesita revisión`,
    ],
    // No se arma vía Oak: runVerifier() construye el prompt del verificador
    // directamente. Entrada presente solo para que el Record sea exhaustivo.
    verifier: [
      `Eres un VERIFICADOR INDEPENDIENTE. Intenta refutar el resultado, no aprobarlo por cortesía.`,
    ],
  };

  return [
    `Eres ${task.agentName}, especialista en ${task.district}.`,
    ``,
    `MISIÓN: ${goal}`,
    project ? `PROYECTO: "${project.name}" — tu directorio de trabajo YA ES la raíz del proyecto (${project.path}). Explora los archivos reales que necesites y trabaja sobre el código existente, no sobre suposiciones.` : "",
    ``,
    `TU ROL: ${task.reason}`,
    task.zmoves.length > 0 ? `SKILLS: ${task.zmoves.slice(0, 5).join(", ")}` : "",
    ``,
    ...roleInstructions[task.role],
    ``,
    `Sé específico y conciso.`
  ].filter(Boolean).join("\n");
}

// POST /api/mission — crea misión y llama a Oak para el equipo
app.post("/api/mission", async (req, res) => {
  const { goal, projectId, discovery } = (req.body || {}) as {
    goal?: string; projectId?: string; discovery?: { maxRounds?: number; maxDryStreak?: number };
  };
  if (!goal?.trim()) return res.status(400).json({ error: "Falta el objetivo (goal)" });

  // HITO 1 — Project Workspace: la misión queda acotada a un proyecto real.
  let project: Mission["project"] = null;
  if (projectId?.trim()) {
    project = await resolveProject(projectId);
    if (!project) return res.status(400).json({ error: `Proyecto no encontrado en ~/proyectos: ${projectId}` });
  }

  // Modo descubrimiento (loop-until-dry): topes duros independientes de lo pedido,
  // para que un valor mal puesto nunca dispare un loop desbocado de agentes.
  const missionDiscovery: Mission["discovery"] = discovery
    ? {
        maxRounds: Math.min(Math.max(discovery.maxRounds ?? 4, 1), 8),
        maxDryStreak: Math.min(Math.max(discovery.maxDryStreak ?? 2, 1), 4)
      }
    : null;

  // Sufijo aleatorio: dos misiones en el mismo milisegundo ya no colisionan.
  const id = `mission-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const mission: Mission = {
    id,
    goal: goal.trim(),
    phase: "planning",
    oakSource: "pending",
    project,
    guidance: [],
    discovery: missionDiscovery,
    tasks: [],
    result: null,
    validationNote: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await writeMission(mission);

  // Pedir plan a Oak (reutiliza la lógica existente)
  let oakData: any = null;
  try {
    const catalog = await getZCatalog();
    const regions = await getRegions();
    oakData = await oakAI(goal.trim(), regions);
  } catch { oakData = null; }

  if (!oakData || oakData.error) {
    // Fallback a heurística
    const catalog = await getZCatalog();
    const regions = await getRegions();
    const byId: Record<string, any> = {};
    for (const r of regions) byId[r.id] = r;

    const g = goal.toLowerCase();
    const picked = new Map<string, string>();
    for (const rule of OAK_RULES) {
      if (rule.kw.some((k: string) => g.includes(k))) {
        for (const dz of rule.districts) if (!picked.has(dz)) picked.set(dz, rule.reason);
      }
    }
    if (picked.size === 0) {
      picked.set("nexo", "orquestación general");
      picked.set("forja", "ejecución técnica");
    }
    picked.set("nexo", picked.get("nexo") || "coordinar el equipo");

    const order = ["nexo", ...[...picked.keys()].filter(d => d !== "nexo")];
    oakData = {
      source: "heuristica",
      mission: goal,
      team: order.map(dz => {
        const reg = byId[dz];
        if (!reg) return null;
        const ace = reg.agents.find((a: any) => a.ace) || reg.agents[0];
        if (!ace) return null;
        const skills = pickSkillsForAgent(reg.id, g, catalog);
        const { runner, zmoves } = enrichAgentRunner(reg.id, skills);
        return { id: ace.id, name: ace.name, emoji: ace.emoji, district: reg.name, type: reg.type, reason: picked.get(dz), runner, zmoves };
      }).filter(Boolean)
    };
  }

  // Convertir el plan de Oak en tareas de la misión
  mission.oakSource = oakData.source;
  const teamRaw = (oakData.team || []);
  const totalAgents = teamRaw.length;
  mission.tasks = teamRaw.map((agent: any, i: number) => {
    const runnerId: string = typeof agent.runner === "object"
      ? (agent.runner?.executorId ?? "claude-code")
      : (agent.runner ?? "claude-code");
    const zmoveNames: string[] = (agent.zmoves?.items || []).map((z: any) => z.name);
    const role: MissionTask["role"] = i === 0 ? "coordinator" : i === totalAgents - 1 ? "validator" : "specialist";
    return {
      id: `task-${i}`,
      agentId: agent.id,
      agentName: agent.name,
      agentEmoji: agent.emoji || "🤖",
      district: agent.district || "",
      runner: runnerId,
      zmoves: zmoveNames,
      role,
      prompt: buildTaskPrompt(goal.trim(), { agentName: agent.name, district: agent.district || "", zmoves: zmoveNames, role, reason: agent.reason || "Ejecutar su parte del plan" }, project),
      status: "pending" as const,
      output: "",
      retries: 0,
      startedAt: null,
      finishedAt: null
    };
  });

  // HITO 4 — AgentRegistry: verificar disponibilidad REAL de cada runner y
  // reasignar tareas de runners caídos ANTES de pedir aprobación. Esta era la
  // raíz de "los agentes no aparecen como utilizables / fallan al llamarlos".
  try {
    const registry = await getRunnerRegistry();
    const fallback = RUNNER_FALLBACK_ORDER.find(r => registry[r]?.available);
    if (fallback) {
      for (const t of mission.tasks) {
        if (registry[t.runner] && !registry[t.runner].available) {
          t.reassignedFrom = t.runner;
          t.runner = fallback;
        }
      }
    }
  } catch (e: unknown) {
    console.error("Registry no disponible al crear misión:", (e as Error).message);
  }

  mission.phase = "awaiting_approval";
  mission.updatedAt = new Date().toISOString();
  await writeMission(mission);
  await firmar("agentos", `Nueva misión esperando aprobación: ${goal.trim()}`);

  res.json(mission);
});

// GET /api/missions
app.get("/api/missions", async (_req, res) => {
  res.json(await listMissions());
});

// GET /api/mission/:id — prefiere el objeto vivo si la misión está corriendo
app.get("/api/mission/:id", async (req, res) => {
  const m = activeMissions.get(req.params.id) ?? await readMission(req.params.id);
  if (!m) return res.status(404).json({ error: "Misión no encontrada" });
  res.json(m);
});

// GET /api/mission/:id/live — SSE: los agentes "hablan" en vivo.
// Emite: chunk (texto incremental por tarea), task (cambio de estado),
// phase (cambio de fase) y guide (mensajes del entrenador).
app.get("/api/mission/:id/live", async (req, res) => {
  const m = activeMissions.get(req.params.id) ?? await readMission(req.params.id);
  if (!m) return res.status(404).json({ error: "Misión no encontrada" });

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no"
  });
  res.write(`event: snapshot\ndata: ${JSON.stringify(m)}\n\n`);

  const listener = (ev: LiveEvent) => {
    res.write(`data: ${JSON.stringify(ev)}\n\n`);
  };
  missionBus.on(m.id, listener);
  const heartbeat = setInterval(() => res.write(": ping\n\n"), 25_000);

  req.on("close", () => {
    clearInterval(heartbeat);
    missionBus.off(m.id, listener);
  });
});

// POST /api/mission/:id/abort — detiene una misión EN EJECUCIÓN de verdad:
// mata los procesos CLI en curso y aborta los streams de Hermes.
app.post("/api/mission/:id/abort", async (req, res) => {
  const id = req.params.id;
  const m = activeMissions.get(id);
  if (!m) return res.status(400).json({ error: "La misión no está en ejecución" });

  abortedMissions.add(id);
  const killers = missionKillers.get(id);
  const killed = killers?.size ?? 0;
  killers?.forEach(kill => { try { kill(); } catch { /* ya murió */ } });
  killers?.clear();

  res.json({ ok: true, killed, message: "Misión abortada. Procesos detenidos." });
});

// POST /api/mission/:id/guide — human-in-the-loop: Juan habla con el equipo
// DURANTE la ejecución. La guía entra al prompt de las tareas que arranquen
// después y queda persistida en la misión.
app.post("/api/mission/:id/guide", async (req, res) => {
  const { text } = (req.body || {}) as { text?: string };
  if (!text?.trim()) return res.status(400).json({ error: "Falta el texto de la guía" });

  // Si la misión está corriendo, mutar el objeto EN MEMORIA (el que ven las
  // tareas en curso); si no, el snapshot de disco.
  const m = activeMissions.get(req.params.id) ?? await readMission(req.params.id);
  if (!m) return res.status(404).json({ error: "Misión no encontrada" });
  if (m.phase === "done" || m.phase === "failed") {
    return res.status(400).json({ error: `La misión ya terminó (${m.phase})` });
  }

  const entry = { text: text.trim(), at: new Date().toISOString() };
  m.guidance.push(entry);
  m.updatedAt = new Date().toISOString();
  await writeMission(m);
  emitLive(m.id, { type: "guide", ...entry });

  res.json({ ok: true, guidance: m.guidance });
});

// POST /api/mission/:id/approve — Juan aprueba → ejecutar
app.post("/api/mission/:id/approve", async (req, res) => {
  const m = await readMission(req.params.id);
  if (!m) return res.status(404).json({ error: "Misión no encontrada" });
  if (m.phase !== "awaiting_approval") return res.status(400).json({ error: `Fase incorrecta: ${m.phase}` });

  // Lanzar ejecución en background (no bloquea la respuesta)
  executeMission(m.id).catch(e => console.error("Error ejecutando misión:", e));

  res.json({ ok: true, message: "Misión aprobada. Ejecutores en marcha." });
});

// POST /api/mission/:id/validate — Juan valida el resultado
app.post("/api/mission/:id/validate", async (req, res) => {
  const { approved, note } = req.body as { approved: boolean; note?: string };
  const m = await readMission(req.params.id);
  if (!m) return res.status(404).json({ error: "Misión no encontrada" });
  if (m.phase !== "awaiting_validation") return res.status(400).json({ error: `Fase incorrecta: ${m.phase}` });

  m.phase = approved ? "done" : "failed";
  m.validationNote = note || null;
  m.updatedAt = new Date().toISOString();
  await writeMission(m);
  await firmar("agentos", `Misión ${approved ? "completada ✓" : "rechazada ✗"}: ${m.goal}`);

  // Fase 3: cerrar el espejo del kanban con el veredicto de Juan
  if (m.kanbanTaskId) {
    if (approved) {
      void kanbanCli(["complete", m.kanbanTaskId, "--result", capText(note || "Validada por Juan en AgentOS", 500)]);
    } else {
      kanbanComment(m, `✗ Rechazada por Juan${note ? `: ${capText(note, 400)}` : ""}`);
    }
  }

  res.json({ ok: true, phase: m.phase });
});

// POST /api/hermes/gateway — start | stop | status | install
app.post("/api/hermes/gateway", async (req, res) => {
  const { action } = req.body as { action?: "start" | "stop" | "restart" | "status" | "install" };
  if (!action) return res.status(400).json({ error: "Falta action" });

  const hermesBin = path.join(os.homedir(), ".local", "bin", "hermes");
  const cmdMap: Record<string, string[]> = {
    start:   ["gateway", "start"],
    stop:    ["gateway", "stop"],
    restart: ["gateway", "restart"],
    status:  ["gateway", "status"],
    install: ["gateway", "install"],
  };
  const args = cmdMap[action];
  if (!args) return res.status(400).json({ error: `Acción desconocida: ${action}` });

  return new Promise<void>((done) => {
    execFile(hermesBin, args, { timeout: 10_000 }, (err, stdout, stderr) => {
      const out = (stdout || stderr || "").trim();
      if (action === "status") {
        // También hacer ping rápido al /health para confirmar
        getHermesKey().then(async (key) => {
          let live = false;
          try {
            const r = await fetch("http://127.0.0.1:8642/health", {
              headers: key ? { Authorization: `Bearer ${key}` } : {},
              signal: AbortSignal.timeout(2000)
            });
            live = ((await r.json()) as any)?.status === "ok";
          } catch { /* offline */ }
          res.json({ ok: true, action, output: out, gatewayLive: live });
          done();
        });
      } else {
        res.json({ ok: !err, action, output: out, error: err?.message });
        done();
      }
    });
  });
});

// -------------------------------------------------------------
// Vite Dev Server / Static Files Serving Setup
// -------------------------------------------------------------

async function startServer() {
  // Misiones que quedaron "executing" de una sesión anterior → failed.
  await reconcileStuckMissions().catch(e => console.error("reconcile:", e));

  if (process.env.NODE_ENV !== "production") {
    console.log("Starting in development mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting in production mode. Serving static assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "127.0.0.1", () => {
    console.log(`Express server running on http://127.0.0.1:${PORT}`);
  });
}

startServer();
