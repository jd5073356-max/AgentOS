import React, { useState, useEffect, useCallback } from "react";
import FinancialDashboard from "./components/FinancialDashboard";
import {
  BookOpen,
  Compass,
  Swords,
  ShieldCheck,
  ScrollText,
  ShoppingBag,
  Star,
  Radio,
  Clock,
  Gem,
  Sparkles,
  Zap,
  Send,
  RefreshCw,
  AlertCircle,
  Activity,
  ChevronRight,
  Network
} from "lucide-react";

// -------------------------------------------------------------
// Tipos de datos reales (colmena + Pokédex)
// -------------------------------------------------------------
interface HiveProject { name: string; progress: number | null; status: string; emoji: string; }
interface HiveEvent { time: string; actor: string; text: string; }
interface HiveDecision { date: string; title: string; who: string | null; why: string | null; }

interface Move { model: string; best: string; }
interface ZMove { name: string; description: string; }
interface ZMoves { count: number; items: ZMove[]; }
interface PartyMon {
  id: string; name: string; species: string; type: string;
  specialty: string; vibe: string; avatar: string; featured: boolean;
  recentActivity: string; lastSeen: string | null; active: boolean;
  fainted: boolean; hp: number;
  moves?: Move[];
  zmoves?: ZMoves;
}
interface Mega { id: string; name: string; description: string; model: string | null; }
interface RegionAgent { id: string; name: string; role: string; emoji: string; model: string | null; ace: boolean; }
interface Region { id: string; name: string; description: string; color: string; type: string; species: string; agents: RegionAgent[]; }
interface Pokedex {
  types: Record<string, { color: string; emoji: string }>;
  ejecutores: PartyMon[]; legendarios: PartyMon[];
  megasHermes: Region[]; megasEcc: Mega[];
  dynamax: DynamaxEntry[];
}
interface DynamaxEntry {
  id: string; name: string; emoji: string;
  type: string; category: string; description: string;
  transport: "node" | "http" | "unknown";
  url: string | null; filePath: string | null;
  executors: string[]; available: boolean;
}

interface MissionTask {
  id: string; agentId: string; agentName: string; agentEmoji: string;
  district: string; runner: string; zmoves: string[];
  role: "coordinator" | "specialist" | "validator" | "verifier";
  status: "pending" | "running" | "done" | "failed";
  output: string; retries: number; startedAt: string | null; finishedAt: string | null;
  reassignedFrom?: string;
}
interface Mission {
  id: string; goal: string; oakSource: string;
  phase: "planning" | "awaiting_approval" | "executing" | "awaiting_validation" | "done" | "failed";
  project?: { name: string; path: string } | null;
  guidance?: { text: string; at: string }[];
  kanbanTaskId?: string | null;
  discovery?: { maxRounds: number; maxDryStreak: number } | null;
  tasks: MissionTask[]; result: string | null; validationNote: string | null;
  createdAt: string; updatedAt: string;
}
interface LocalProject { id: string; name: string; path: string; }
interface RunnerInfo { id: string; name: string; kind: "cli" | "gateway"; available: boolean; detail: string; }

interface HealthResult {
  id: string; name: string;
  checkType: "http" | "docker" | "presence";
  status: "vivo" | "debilitado";
  latencyMs: number | null; detail: string;
}

interface ZSkill { name: string; description: string; category: string; }
interface CompatRow { category: string; domain: string; scores: Record<string, number>; }
interface ZCatalog {
  total: number; categories: Record<string, number>; items: ZSkill[]; plugins: string[];
  compat?: { executors: { id: string; name: string; mastery: number }[]; matrix: CompatRow[] };
}

const POLL_MS = 5000;

// Colores de tipo (respaldo si el backend aún no respondió)
const TYPE_FALLBACK: Record<string, { color: string; emoji: string }> = {
  "Psíquico": { color: "#f95587", emoji: "🔮" }, "Siniestro": { color: "#705746", emoji: "🌑" },
  "Planta": { color: "#7ac74c", emoji: "🌿" }, "Fuego": { color: "#ee8130", emoji: "🔥" },
  "Eléctrico": { color: "#f7d02c", emoji: "⚡" }, "Acero": { color: "#b7b7ce", emoji: "⚙️" },
  "Lucha": { color: "#c22e28", emoji: "🥊" }, "Hada": { color: "#d685ad", emoji: "✨" },
  "Dragón": { color: "#6f35fc", emoji: "🐉" }, "Agua": { color: "#6390f0", emoji: "💧" },
  "Fantasma": { color: "#735797", emoji: "👻" }, "Volador": { color: "#a98ff3", emoji: "🦅" },
  "Normal": { color: "#a8a77a", emoji: "⭐" }
};

export default function App() {
  const [activeModule, setActiveModule] = useState<string>("pokedex");

  const [pokedex, setPokedex] = useState<Pokedex | null>(null);
  const [projects, setProjects] = useState<HiveProject[]>([]);
  const [events, setEvents] = useState<HiveEvent[]>([]);
  const [decisions, setDecisions] = useState<HiveDecision[]>([]);

  const [connected, setConnected] = useState<boolean>(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Pokédex UI state
  const [showFainted, setShowFainted] = useState(false);
  const [expandedDistricts, setExpandedDistricts] = useState<Set<string>>(new Set());
  const toggleDistrict = (id: string) =>
    setExpandedDistricts(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  // Biblioteca global de Movimientos Z (vive aparte; todos la pueden equipar)
  const [zcat, setZcat] = useState<ZCatalog | null>(null);
  const [zq, setZq] = useState<string>("");
  const [zfilter, setZfilter] = useState<string>("");

  // Misiones (Gimnasios)
  const [missions, setMissions] = useState<Mission[]>([]);
  const [newGoal, setNewGoal] = useState("");
  const [missionLoading, setMissionLoading] = useState(false);
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [validationNote, setValidationNote] = useState("");

  // HITO 1 — Project Workspace: proyectos reales de ~/proyectos para acotar la misión
  const [localProjects, setLocalProjects] = useState<LocalProject[]>([]);
  const [missionProject, setMissionProject] = useState<string>("");

  // Modo descubrimiento (loop-until-dry): los especialistas buscan en rondas
  // hasta agotar hallazgos nuevos, en vez de correr una sola vez.
  const [discoveryMode, setDiscoveryMode] = useState(false);

  // HITO 2 — Observabilidad: texto en vivo por tarea (SSE), fuera del objeto misión
  const [liveOutputs, setLiveOutputs] = useState<Record<string, string>>({});

  // HITO 3 — Human-in-the-loop: guía del entrenador durante la ejecución
  const [guideMsg, setGuideMsg] = useState("");

  const activeMissionId = activeMission?.id ?? null;
  const activeMissionPhase = activeMission?.phase ?? null;

  const fetchMissions = useCallback(async () => {
    try { setMissions(await fetch("/api/missions").then(r => r.json())); } catch { /* noop */ }
  }, []);

  const refreshActiveMission = useCallback(async () => {
    if (!activeMissionId) return;
    const m = await fetch(`/api/mission/${activeMissionId}`).then(r => r.json()).catch(() => null);
    if (m?.id) { setActiveMission(m); setMissions(ms => ms.map(x => x.id === m.id ? m : x)); }
  }, [activeMissionId]);

  useEffect(() => {
    fetchMissions();
    const t = setInterval(() => {
      fetchMissions();
      if (activeMissionPhase === "executing") refreshActiveMission();
    }, 3000);
    return () => clearInterval(t);
  }, [fetchMissions, refreshActiveMission, activeMissionPhase]);

  useEffect(() => {
    fetch("/api/projects/local").then(r => r.json()).then(d => Array.isArray(d) && setLocalProjects(d)).catch(() => {});
  }, []);

  // HITO 4 — registry: disponibilidad real de runners, refrescada al entrar a Gimnasios
  const [runnerRegistry, setRunnerRegistry] = useState<Record<string, RunnerInfo> | null>(null);
  useEffect(() => {
    if (activeModule !== "gimnasios") return;
    fetch("/api/agents/registry").then(r => r.json()).then(d => d?.runners && setRunnerRegistry(d.runners)).catch(() => {});
  }, [activeModule]);

  // SSE: mientras la misión ejecuta, los agentes hablan en vivo (chunk por chunk).
  useEffect(() => {
    if (!activeMissionId || activeMissionPhase !== "executing") return;
    setLiveOutputs({});
    const es = new EventSource(`/api/mission/${activeMissionId}/live`);
    es.onmessage = (e) => {
      try {
        const ev = JSON.parse(e.data);
        if (ev.type === "chunk" && ev.taskId) {
          setLiveOutputs(prev => ({
            ...prev,
            [ev.taskId]: ((prev[ev.taskId] || "") + ev.text).slice(-20000)
          }));
        } else if (ev.type === "task" || ev.type === "phase" || ev.type === "guide") {
          refreshActiveMission();
        }
      } catch { /* heartbeat u evento no-JSON */ }
    };
    es.onerror = () => { /* el polling de 3s sigue de respaldo */ };
    return () => es.close();
  }, [activeMissionId, activeMissionPhase, refreshActiveMission]);

  const startMission = async () => {
    if (!newGoal.trim()) return;
    setMissionLoading(true);
    try {
      const m: Mission = await fetch("/api/mission", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: newGoal.trim(),
          projectId: missionProject || undefined,
          discovery: discoveryMode ? { maxRounds: 4, maxDryStreak: 2 } : undefined
        })
      }).then(r => r.json());
      if (!m?.id) return;
      setMissions(ms => [m, ...ms]);
      setActiveMission(m);
      setNewGoal("");
    } finally { setMissionLoading(false); }
  };

  const sendGuide = async () => {
    if (!guideMsg.trim() || !activeMissionId) return;
    await fetch(`/api/mission/${activeMissionId}/guide`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: guideMsg.trim() })
    }).catch(() => {});
    setGuideMsg("");
    refreshActiveMission();
  };

  const abortMission = async () => {
    if (!activeMissionId) return;
    await fetch(`/api/mission/${activeMissionId}/abort`, { method: "POST" }).catch(() => {});
    refreshActiveMission();
  };

  const approveMission = async (id: string) => {
    await fetch(`/api/mission/${id}/approve`, { method: "POST" });
    refreshActiveMission();
  };

  const validateMission = async (id: string, approved: boolean) => {
    await fetch(`/api/mission/${id}/validate`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved, note: validationNote })
    });
    setValidationNote("");
    refreshActiveMission();
  };

  // Centro Pokémon (Health check + Convocatoria)
  const [healthResults, setHealthResults] = useState<HealthResult[]>([]);
  const [healthLoading, setHealthLoading] = useState<boolean>(false);
  const [healthTs, setHealthTs] = useState<string | null>(null);
  const [convoMsg, setConvoMsg] = useState<string>("");
  const [convoLoading, setConvoLoading] = useState<boolean>(false);
  const [convoStatus, setConvoStatus] = useState<string | null>(null);

  const checkHealth = async () => {
    setHealthLoading(true);
    try {
      const r = await fetch("/api/health/all");
      const data = await r.json();
      setHealthResults(data.results ?? []);
      setHealthTs(data.timestamp ?? null);
    } catch {
      setHealthResults([]);
    } finally {
      setHealthLoading(false);
    }
  };

  const sendConvocatoria = async () => {
    if (!convoMsg.trim()) return;
    setConvoLoading(true);
    setConvoStatus(null);
    try {
      const r = await fetch("/api/hive/convocar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "PHX-TOKEN-AETHON-2026", message: convoMsg.trim() })
      });
      const data = await r.json();
      if (data.ok) {
        setConvoStatus(`✓ Convocatoria enviada · ${data.launched.length} ventanas abriendo…`);
        setConvoMsg("");
        setTimeout(checkHealth, 3000);
      } else {
        setConvoStatus("✗ Error al enviar la convocatoria.");
      }
    } catch {
      setConvoStatus("✗ No se pudo contactar al servidor.");
    } finally {
      setConvoLoading(false);
    }
  };

  // Profesor Oak (Director)
  const [oakGoal, setOakGoal] = useState<string>("");
  const [oakPlan, setOakPlan] = useState<any>(null);
  const [oakLoading, setOakLoading] = useState<boolean>(false);

  const [graphData, setGraphData] = useState<{
    exists: boolean;
    nodes?: number;
    edges?: number;
    communities?: number;
    topCommunities?: { id: number; size: number; sample: string[] }[];
    generatedAt?: string;
    report?: string;
  } | null>(null);

  const askOak = async () => {
    if (!oakGoal.trim()) return;
    setOakLoading(true);
    try {
      const r = await fetch("/api/oak/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: oakGoal })
      });
      setOakPlan(await r.json());
    } catch {
      setOakPlan({ error: "No se pudo contactar a Oak." });
    } finally {
      setOakLoading(false);
    }
  };

  const fetchAll = useCallback(async () => {
    try {
      const [pk, p, e, d] = await Promise.all([
        fetch("/api/pokedex").then((r) => r.json()),
        fetch("/api/hive/projects").then((r) => r.json()),
        fetch("/api/hive/events").then((r) => r.json()),
        fetch("/api/hive/decisions").then((r) => r.json())
      ]);
      setPokedex(pk); setProjects(p); setEvents(e); setDecisions(d);
      setConnected(true); setLastSync(new Date());
    } catch (err) {
      console.error("No se pudo leer la colmena:", err);
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, POLL_MS);
    return () => clearInterval(t);
  }, [fetchAll]);

  // La biblioteca Z es estática y grande: se trae una sola vez (no en el polling).
  useEffect(() => {
    fetch("/api/zmoves").then((r) => r.json()).then(setZcat).catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/graph").then((r) => r.json()).then(setGraphData).catch(() => {});
  }, []);

  const typeMeta = (t: string) => (pokedex?.types?.[t]) || TYPE_FALLBACK[t] || TYPE_FALLBACK["Normal"];
  const ejecutoresVivos = pokedex?.ejecutores.filter((e) => !e.fainted).length || 0;
  const megasTotal =
    (pokedex?.megasHermes.reduce((n, r) => n + r.agents.length, 0) || 0) +
    (pokedex?.megasEcc.length || 0);

  const RAIL = [
    { id: "pokedex", label: "Pokédex", icon: BookOpen },
    { id: "oak", label: "Profesor Oak", icon: Compass },
    { id: "centro", label: "Centro Pokémon (Diagnóstico)", icon: Activity },
    { id: "zmoves", label: "Movimientos Z", icon: Zap },
    { id: "gimnasios", label: "Gimnasios", icon: Swords },
    { id: "decisiones", label: "Decisiones del Campeón", icon: ShieldCheck },
    { id: "bitacora", label: "Bitácora de Batalla", icon: ScrollText },
    { id: "pokemart", label: "PokéMart", icon: ShoppingBag },
    { id: "commandcode", label: "CommandCode", icon: Network },
  ];

  return (
    <div className="flex flex-col h-screen bg-black text-zinc-100 font-sans overflow-hidden">
      {/* TOP BAR */}
      <header className="h-14 bg-zinc-950 border-b border-zinc-900 px-6 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 via-purple-600 to-emerald-400 flex items-center justify-center font-black text-black text-xs tracking-tight shadow-md">
            OS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-tight text-white uppercase font-mono">AgentOS</span>
              <span className="text-[8px] bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-mono px-1 rounded">LIGA AETHON</span>
            </div>
            <p className="text-[9px] text-zinc-500 font-mono leading-none">Centro de Operaciones · Entrenador: Juan</p>
          </div>
        </div>
        <div className="flex items-center gap-3 font-mono text-[9px]">
          <div className={`flex items-center gap-1.5 border px-2 py-0.5 rounded text-[8px] ${connected ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400" : "border-rose-500/30 bg-rose-500/5 text-rose-400"}`}>
            <Radio className="w-3 h-3" />
            {connected ? "CENTRO POKÉMON: EN LÍNEA" : "PC DESCONECTADO"}
          </div>
          <span className="text-zinc-500">
            {lastSync ? `últ. sinc ${lastSync.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : "…"}
          </span>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT RAIL */}
        <nav className="w-16 bg-zinc-950 border-r border-zinc-900 flex flex-col items-center py-4 gap-3.5 shrink-0 select-none">
          {RAIL.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveModule(id)}
              title={label}
              className={`w-11 h-11 rounded-lg flex items-center justify-center transition-all relative cursor-pointer ${
                activeModule === id
                  ? "bg-indigo-600/15 border border-indigo-500 text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                  : "text-zinc-500 hover:text-white hover:bg-zinc-900"
              }`}
            >
              <Icon className="w-5 h-5" />
              {activeModule === id && <span className="absolute left-0 w-1 h-5 bg-indigo-500 rounded-r-full" />}
            </button>
          ))}
        </nav>

        {/* MAIN */}
        <main className="flex-1 overflow-y-auto">
          {/* ---------- POKÉDEX ---------- */}
          {activeModule === "pokedex" && pokedex && (() => {
            const vivos = pokedex.ejecutores.filter(m => !m.fainted);
            const debilitados = pokedex.ejecutores.filter(m => m.fainted);
            const hermesTotal = pokedex.megasHermes.reduce((n, r) => n + r.agents.length, 0);
            return (
              <div className="p-6 space-y-10">
                {/* ── CABECERA ── */}
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <SectionHeader
                      tag="POKÉDEX // ROSTER DEL ECOSISTEMA"
                      title="Pokédex"
                      subtitle="El inventario completo de entrenador: ejecutores, legendarios, MCPs y el pool de mega-evoluciones compartido."
                      icon={BookOpen}
                    />
                  </div>
                  {/* Stat pills */}
                  <div className="flex flex-wrap gap-2 mt-1">
                    {[
                      { label: `${vivos.length} ejecutores`, color: "text-emerald-400 border-emerald-800/60 bg-emerald-950/40" },
                      { label: `${debilitados.length} debilitados`, color: "text-rose-400 border-rose-800/60 bg-rose-950/40" },
                      { label: `${pokedex.legendarios.length} legendarios`, color: "text-amber-300 border-amber-700/50 bg-amber-950/30" },
                      { label: `${pokedex.dynamax?.length ?? 0} dynamax`, color: "text-yellow-400 border-yellow-700/50 bg-yellow-950/30" },
                      { label: `${hermesTotal} megas Hermes`, color: "text-purple-400 border-purple-800/60 bg-purple-950/40" },
                      { label: `${pokedex.megasEcc.length} megas ECC`, color: "text-fuchsia-400 border-fuchsia-800/60 bg-fuchsia-950/40" },
                    ].map(({ label, color }) => (
                      <span key={label} className={`text-[9px] font-mono font-bold px-2.5 py-1 rounded-full border ${color}`}>{label}</span>
                    ))}
                  </div>
                </div>

                {/* ── EJECUTORES ACTIVOS ── */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-1 h-4 rounded-full bg-emerald-500 inline-block" />
                      Ejecutores — CLIs & runtimes
                    </h3>
                    <span className="text-[9px] font-mono text-zinc-500">{vivos.length} disponibles</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {vivos.map((m) => (
                      <React.Fragment key={m.id}>
                        <MonCard mon={m} typeMeta={typeMeta} />
                      </React.Fragment>
                    ))}
                  </div>
                </section>

                {/* ── DEBILITADOS (toggle) ── */}
                <section>
                  <button
                    onClick={() => setShowFainted(v => !v)}
                    className="flex items-center gap-2 text-[11px] font-mono font-bold text-zinc-500 uppercase tracking-widest hover:text-rose-400 transition-colors mb-3 group"
                  >
                    <span className="w-1 h-4 rounded-full bg-rose-800 inline-block group-hover:bg-rose-500 transition-colors" />
                    Debilitados — sin acceso
                    <span className="text-[9px] font-mono font-bold text-rose-500 border border-rose-800/50 bg-rose-950/30 px-2 py-0.5 rounded-full">{debilitados.length}</span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showFainted ? "rotate-90" : ""}`} />
                  </button>
                  {showFainted && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                      {debilitados.map((m) => (
                        <React.Fragment key={m.id}>
                          <MonCard mon={m} typeMeta={typeMeta} />
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </section>

                {/* ── LEGENDARIOS ── */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[11px] font-mono font-bold text-amber-300/80 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-1 h-4 rounded-full bg-amber-500 inline-block" />
                      Legendarios — actúan solos
                    </h3>
                    <span className="text-[9px] font-mono text-zinc-500">MAX · runtime-watcher</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {pokedex.legendarios.map((m) => (
                      <React.Fragment key={m.id}>
                        <MonCard mon={m} typeMeta={typeMeta} legendary />
                      </React.Fragment>
                    ))}
                  </div>
                </section>

                {/* ── DYNAMAX (MCP) ── */}
                {pokedex.dynamax && pokedex.dynamax.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-[11px] font-mono font-bold text-yellow-300/80 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1 h-4 rounded-full bg-yellow-500 inline-block" />
                        Dynamax — Max Moves (servidores MCP)
                      </h3>
                      <span className="text-[9px] font-mono text-zinc-500">{pokedex.dynamax.length} potenciadores</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {pokedex.dynamax.map((d) => {
                        const tm = typeMeta(d.type);
                        return (
                          <div key={d.id}
                            className={`rounded-xl border overflow-hidden ${d.available ? "border-yellow-700/40 bg-zinc-950" : "border-zinc-800/30 bg-zinc-950/50 opacity-50"}`}
                            style={d.available ? { boxShadow: "0 0 20px rgba(234,179,8,0.06)", borderTop: "2px solid rgba(234,179,8,0.4)" } : undefined}>
                            <div className="h-0.5 w-full" style={{ background: d.available ? "linear-gradient(90deg,#eab30880,#eab30820)" : undefined }} />
                            <div className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="text-3xl leading-none p-2 rounded-lg bg-yellow-950/30">{d.emoji}</div>
                                  <div>
                                    <span className="text-[13px] font-bold text-white block">{d.name}</span>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <TypeBadge type={d.type} tm={tm} />
                                      <span className={`text-[7px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${
                                        d.transport === "http" ? "text-cyan-400 border-cyan-700/50 bg-cyan-950/30" :
                                        d.transport === "node" ? "text-green-400 border-green-700/50 bg-green-950/30" :
                                        "text-zinc-500 border-zinc-700"
                                      }`}>{d.transport}</span>
                                    </div>
                                  </div>
                                </div>
                                <span className={`text-[7px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                                  d.available ? "text-yellow-400 border-yellow-700/50 bg-yellow-950/30" : "text-zinc-600 border-zinc-800 bg-zinc-900"
                                }`}>{d.available ? "⚡ ACTIVO" : "OFF"}</span>
                              </div>
                              <p className="text-[10px] text-zinc-400 mb-3 line-clamp-2 leading-relaxed">{d.description}</p>
                              <div>
                                <span className="text-[7px] font-mono text-zinc-600 uppercase tracking-widest">Ejecutores compatibles</span>
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {d.executors.map((ex) => (
                                    <span key={ex} className="text-[8px] font-mono text-yellow-300/70 bg-yellow-950/30 border border-yellow-800/30 px-1.5 py-0.5 rounded">{ex}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* ── MEGA-EVOLUCIONES ── */}
                <section>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
                      <Gem className="w-3.5 h-3.5 text-fuchsia-400" />
                      Mega-Evoluciones — pool compartido
                    </h3>
                    <span className="text-[9px] font-mono text-zinc-500">{hermesTotal + pokedex.megasEcc.length} total</span>
                  </div>
                  <p className="text-[9px] font-mono text-zinc-600 mb-5">
                    Agentes especialistas que cualquier ejecutor puede equipar. La mega-evolución otorga un <span className="text-zinc-400">2º elemento</span> (tipo del distrito).
                  </p>

                  {/* POOL A: Hermes */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[8px] font-mono font-bold text-purple-400 uppercase tracking-widest">Pool Hermes</span>
                      <span className="text-[8px] font-mono text-zinc-600">·</span>
                      <span className="text-[8px] font-mono text-zinc-500">{hermesTotal} agentes · 9 distritos</span>
                    </div>
                    <div className="space-y-2">
                      {pokedex.megasHermes.map((reg) => {
                        const tm = typeMeta(reg.type);
                        const open = expandedDistricts.has(reg.id);
                        return (
                          <div key={reg.id} className="rounded-xl border border-zinc-800/60 bg-zinc-950 overflow-hidden"
                            style={{ borderLeft: `3px solid ${reg.color}40` }}>
                            <button
                              onClick={() => toggleDistrict(reg.id)}
                              className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-zinc-900/40 transition-colors"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: reg.color }} />
                                <span className="text-[12px] font-bold text-white">{reg.name}</span>
                                <TypeBadge type={reg.type} tm={tm} />
                                <span className="text-[8px] font-mono text-zinc-600 hidden sm:inline">{reg.description}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[8px] font-mono text-zinc-500">{reg.agents.length} agentes</span>
                                <ChevronRight className={`w-3.5 h-3.5 text-zinc-600 transition-transform ${open ? "rotate-90" : ""}`} />
                              </div>
                            </button>
                            {open && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px border-t border-zinc-900 bg-zinc-900">
                                {reg.agents.map((a) => (
                                  <div key={a.id} className="p-2.5 bg-zinc-950 flex items-center gap-2.5 hover:bg-zinc-900/60 transition-colors">
                                    <span className="text-xl leading-none shrink-0">{a.emoji}</span>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] font-bold text-zinc-200 truncate">{a.name}</span>
                                        {a.ace && (
                                          <span className="flex items-center gap-0.5 text-[6px] font-mono font-bold text-amber-400 bg-amber-950/50 border border-amber-700/40 px-1 py-0.5 rounded shrink-0">
                                            <Star className="w-1.5 h-1.5" /> AS
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[8px] text-zinc-500 truncate">{a.role}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* POOL B: ECC */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[8px] font-mono font-bold text-fuchsia-400 uppercase tracking-widest">Pool ECC</span>
                      <span className="text-[8px] font-mono text-zinc-600">·</span>
                      <span className="text-[8px] font-mono text-zinc-500">{pokedex.megasEcc.length} mega-piedras · ~/.claude/agents</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {pokedex.megasEcc.map((mg) => (
                        <div key={mg.id}
                          title={mg.description}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-800/70 bg-zinc-950 hover:border-fuchsia-800/50 hover:bg-fuchsia-950/10 transition-colors cursor-default group">
                          <Gem className="w-2.5 h-2.5 text-fuchsia-500/70 shrink-0 group-hover:text-fuchsia-400 transition-colors" />
                          <span className="text-[9px] font-mono font-bold text-zinc-300">{mg.name}</span>
                          {mg.model && <span className="text-[7px] font-mono text-zinc-600">{mg.model}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            );
          })()}

          {/* ---------- CENTRO POKÉMON (Diagnóstico) ---------- */}
          {activeModule === "centro" && (
            <div className="p-6 space-y-6">
              <SectionHeader
                tag="DIAGNÓSTICO // CENTRO POKÉMON"
                title="Centro Pokémon"
                subtitle="Prueba real de cada ejecutor: API HTTP, contenedor Docker o presencia en la colmena."
                icon={Activity}
              />
              {/* Convocatoria */}
              <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-3">
                <p className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold">Convocatoria — abre todos los CLIs en sus ventanas</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={convoMsg}
                    onChange={(e) => setConvoMsg(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") sendConvocatoria(); }}
                    placeholder="Mensaje para todos los agentes…"
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={sendConvocatoria}
                    disabled={convoLoading || !convoMsg.trim()}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors whitespace-nowrap"
                  >
                    <Send className="w-4 h-4" />
                    {convoLoading ? "Enviando…" : "Convocar a todos"}
                  </button>
                </div>
                {convoStatus && (
                  <p className="text-[11px] font-mono text-emerald-400">{convoStatus}</p>
                )}
              </div>

              {/* Diagnóstico */}
              <div className="flex items-center gap-4">
                <button
                  onClick={checkHealth}
                  disabled={healthLoading}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors"
                >
                  <Activity className="w-4 h-4" />
                  {healthLoading ? "Probando…" : "Probar todos"}
                </button>
                {healthTs && (
                  <span className="text-[10px] font-mono text-zinc-500">
                    Última prueba: {new Date(healthTs).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                )}
              </div>

              {healthLoading && (
                <div className="flex items-center gap-3 text-zinc-400 text-sm font-mono">
                  <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  Enviando pings… (HTTP hasta 3s, Docker hasta 4s)
                </div>
              )}

              {!healthLoading && healthResults.length === 0 && (
                <div className="text-center py-12 text-zinc-600 font-mono text-sm">
                  Presiona "Probar todos" para hacer el diagnóstico.
                </div>
              )}

              {healthResults.length > 0 && (
                <div className="space-y-2">
                  {/* Resumen */}
                  <div className="flex items-center gap-6 text-[10px] font-mono mb-4">
                    <span className="text-emerald-400 font-bold text-sm">
                      {healthResults.filter(r => r.status === "vivo").length} VIVOS
                    </span>
                    <span className="text-zinc-500">·</span>
                    <span className="text-rose-400 font-bold text-sm">
                      {healthResults.filter(r => r.status === "debilitado").length} DEBILITADOS
                    </span>
                  </div>

                  {/* Tabla de resultados */}
                  <div className="rounded-lg border border-zinc-900 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-900 bg-zinc-950">
                          <th className="text-left px-4 py-2.5 text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Ejecutor</th>
                          <th className="text-left px-4 py-2.5 text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Verificación</th>
                          <th className="text-left px-4 py-2.5 text-[9px] font-mono text-zinc-500 uppercase tracking-widest">¿Responde?</th>
                          <th className="text-left px-4 py-2.5 text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Latencia</th>
                          <th className="text-left px-4 py-2.5 text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Detalle</th>
                        </tr>
                      </thead>
                      <tbody>
                        {healthResults.map((r, i) => (
                          <tr key={r.id} className={`border-b border-zinc-900/50 ${i % 2 === 0 ? "bg-zinc-950" : "bg-zinc-900/20"}`}>
                            <td className="px-4 py-2.5">
                              <span className="font-mono font-bold text-zinc-200 text-[11px]">{r.name}</span>
                              <span className="ml-2 text-[9px] text-zinc-600 font-mono">{r.id}</span>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                                r.checkType === "http" ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30" :
                                r.checkType === "docker" ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30" :
                                "bg-zinc-800 text-zinc-400 border border-zinc-700"
                              }`}>
                                {r.checkType === "http" ? "HTTP ping" : r.checkType === "docker" ? "Docker ps" : "Colmena"}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className={`flex items-center gap-1.5 text-[11px] font-mono font-bold ${
                                r.status === "vivo" ? "text-emerald-400" : "text-rose-400"
                              }`}>
                                <span className={`w-2 h-2 rounded-full ${r.status === "vivo" ? "bg-emerald-500 animate-pulse" : "bg-rose-700"}`} />
                                {r.status === "vivo" ? "VIVO" : "DEBILITADO"}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 font-mono text-[10px] text-zinc-400">
                              {r.latencyMs !== null ? `${r.latencyMs}ms` : "—"}
                            </td>
                            <td className="px-4 py-2.5 font-mono text-[10px] text-zinc-500 max-w-xs truncate">
                              {r.detail}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Leyenda */}
                  <div className="pt-2 space-y-1 text-[9px] font-mono text-zinc-600">
                    <p><span className="text-emerald-400 font-bold">VIVO</span> — Puede recibir y responder mensajes ahora mismo.</p>
                    <p><span className="text-rose-400 font-bold">DEBILITADO</span> — No puede responder. Hay que levantarlo o esperar a que vuelva.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---------- PROFESOR OAK (Director) ---------- */}
          {activeModule === "oak" && (
            <div className="p-6">
              <SectionHeader
                tag="DIRECTOR // PROFESOR OAK"
                title="Profesor Oak"
                subtitle="Describe tu objetivo. Oak arma el equipo recomendado con tus agentes reales."
                icon={Compass}
              />
              <div className="mt-5 max-w-3xl space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={oakGoal}
                    onChange={(e) => setOakGoal(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") askOak(); }}
                    placeholder="Ej: Lanzar la campaña de ads del Afilador de Cuchillos de Rodamiento"
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={askOak}
                    disabled={oakLoading || !oakGoal.trim()}
                    className="px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-mono font-bold uppercase rounded flex items-center gap-1.5 cursor-pointer"
                  >
                    {oakLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Pedir plan
                  </button>
                </div>

                {oakPlan && !oakPlan.error && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg border border-indigo-500/30 bg-indigo-500/5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[8px] font-mono text-indigo-400 uppercase tracking-widest">Misión</span>
                        <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${oakPlan.source === "ia" ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" : "text-zinc-400 border-zinc-700"}`}>
                          {oakPlan.source === "ia" ? "🧠 Grok 4.3 · Vertex" : "⚙️ reglas"}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-white mt-0.5">{oakPlan.mission}</p>
                      {oakPlan.projectName && <p className="text-[11px] font-mono text-indigo-300 mt-1">Proyecto sugerido: {oakPlan.projectName}</p>}
                    </div>

                    <div>
                      <SubTitle>🎒 Equipo recomendado ({oakPlan.team?.length})</SubTitle>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                        {oakPlan.team?.map((t: any, i: number) => {
                          const tm = typeMeta(t.type);
                          return (
                            <div key={i} className="p-3 rounded-lg border border-zinc-900 bg-zinc-950 flex items-start gap-2.5">
                              <span className="text-lg shrink-0">{t.emoji}</span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[11px] font-bold text-white">{i + 1}. {t.name}</span>
                                  <TypeBadge type={t.type} tm={tm} />
                                  <span className="text-[8px] font-mono text-zinc-600">{t.district}</span>
                                </div>
                                <p className="text-[10px] text-zinc-400 mt-1">{t.reason}</p>
                                {t.runner && (
                                  <p className="text-[9px] font-mono text-emerald-400 mt-1">
                                    ▶ runner: {t.runner.executorName}{t.runner.model ? ` · ${t.runner.model}` : ""} · {t.runner.compat}%
                                  </p>
                                )}
                                {t.zmoves && t.zmoves.length > 0 && (
                                  <div className="mt-1 space-y-0.5">
                                    {t.zmoves.map((z: any, k: number) => (
                                      <p key={k} className="text-[9px] font-mono text-cyan-400">⚡ {z.name} <span className="text-zinc-600">({z.category} · {z.compat}%)</span></p>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <SubTitle>📋 Orden de juego</SubTitle>
                      <ol className="mt-2 space-y-1">
                        {oakPlan.steps?.map((s: string, i: number) => (
                          <li key={i} className="text-[11px] text-zinc-400 font-mono flex gap-2">
                            <span className="text-indigo-400">{i + 1}.</span> {s}
                          </li>
                        ))}
                      </ol>
                    </div>

                    <p className="text-[10px] font-mono text-amber-300/80 border border-amber-500/20 bg-amber-500/5 rounded px-3 py-2">
                      {oakPlan.note}
                    </p>
                  </div>
                )}

                {oakPlan?.error && (
                  <p className="text-xs text-rose-400 font-mono flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {oakPlan.error}</p>
                )}
              </div>
            </div>
          )}

          {/* ---------- GIMNASIOS — flujo lineal ---------- */}
          {activeModule === "gimnasios" && (() => {
            const phaseColor: Record<string, string> = { planning:"text-zinc-400", awaiting_approval:"text-amber-400", executing:"text-indigo-400", awaiting_validation:"text-yellow-400", done:"text-emerald-400", failed:"text-rose-400" };
            const phaseLabel: Record<string, string> = { planning:"Planificando…", awaiting_approval:"Esperando tu aprobación", executing:"Ejecutando…", awaiting_validation:"Esperando validación", done:"Completada ✓", failed:"Fallida ✗" };
            const roleColor: Record<string, string> = { coordinator:"text-amber-400 bg-amber-500/10 border-amber-500/30", specialist:"text-indigo-400 bg-indigo-500/10 border-indigo-500/30", validator:"text-emerald-400 bg-emerald-500/10 border-emerald-500/30", verifier:"text-violet-400 bg-violet-500/10 border-violet-500/30" };
            const roleLabel: Record<string, string> = { coordinator:"Coordinador", specialist:"Especialista", validator:"Validador", verifier:"Verificador" };
            return (
            <div className="p-6 max-w-3xl mx-auto space-y-6 overflow-y-auto h-full">
              <SectionHeader tag="LIGA // PROYECTOS & MISIONES" title="Gimnasios" subtitle="Tus proyectos reales + el flujo idea → Oak → equipo → construcción." icon={Swords} />

              {/* ── 1. Proyectos activos de la colmena ── */}
              {projects.length > 0 && (
                <div>
                  <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mb-2">Proyectos en curso</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {projects.map(p => (
                      <div key={p.name} className="p-3 rounded-lg border border-zinc-800 bg-zinc-950">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-white flex items-center gap-1.5"><span>{p.emoji}</span>{p.name}</span>
                          <span className="text-[9px] font-mono text-zinc-500">{p.progress == null ? "—" : `${p.progress}%`}</span>
                        </div>
                        {p.progress != null && (
                          <div className="mt-2 h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${p.progress >= 90 ? "bg-emerald-500" : p.progress >= 50 ? "bg-indigo-500" : "bg-amber-500"}`} style={{ width: `${p.progress}%` }} />
                          </div>
                        )}
                        <p className="text-[9px] text-zinc-500 mt-1.5 line-clamp-1">{p.status}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── 2. Lanzar idea a Oak ── */}
              <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-3">
                <p className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest font-bold">💡 Nueva idea → Oak escoge el equipo</p>
                <div className="flex gap-2">
                  <textarea
                    value={newGoal}
                    onChange={e => setNewGoal(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) startMission(); }}
                    placeholder="Describe lo que quieres construir o resolver…"
                    rows={2}
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                  <button onClick={startMission} disabled={missionLoading || !newGoal.trim()}
                    className="px-4 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-bold transition-colors flex flex-col items-center justify-center gap-1">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-[9px]">{missionLoading ? "…" : "Disparar"}</span>
                  </button>
                </div>
                {/* Workspace: los agentes ejecutan DENTRO del proyecto elegido */}
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest shrink-0">📁 Proyecto</span>
                  <select
                    value={missionProject}
                    onChange={e => setMissionProject(e.target.value)}
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-[11px] text-zinc-100 focus:outline-none focus:border-indigo-500">
                    <option value="">🌐 Sin proyecto (misión general)</option>
                    {localProjects.map(p => (
                      <option key={p.id} value={p.id}>📁 {p.name}</option>
                    ))}
                  </select>
                  {missionProject && (
                    <span className="text-[8px] font-mono text-emerald-400 shrink-0">los agentes trabajarán en ~/proyectos/{missionProject}</span>
                  )}
                </div>
                {/* Modo descubrimiento: buscar en rondas hasta agotar hallazgos nuevos */}
                <label className="flex items-center gap-2 cursor-pointer select-none" title="Los especialistas buscan en rondas, viendo lo ya encontrado, hasta que una ronda no aporte nada nuevo (máx. 4 rondas)">
                  <input type="checkbox" checked={discoveryMode} onChange={e => setDiscoveryMode(e.target.checked)}
                    className="w-3.5 h-3.5 rounded accent-sky-500" />
                  <span className="text-[9px] font-mono text-sky-400 uppercase tracking-widest">🔁 Modo descubrimiento</span>
                  <span className="text-[8px] text-zinc-500">buscar en rondas hasta que no quede nada nuevo</span>
                </label>
                {/* Registry: qué ejecutores están realmente disponibles AHORA */}
                {runnerRegistry && (
                  <div className="flex items-center gap-3 flex-wrap pt-1 border-t border-zinc-900">
                    <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest">Ejecutores</span>
                    {(Object.values(runnerRegistry) as RunnerInfo[]).map(r => (
                      <span key={r.id} className="flex items-center gap-1 text-[9px] font-mono" title={r.detail}>
                        <span className={`w-1.5 h-1.5 rounded-full ${r.available ? "bg-emerald-500" : "bg-rose-600"}`} />
                        <span className={r.available ? "text-zinc-300" : "text-zinc-600 line-through"}>{r.name}</span>
                      </span>
                    ))}
                    <span className="text-[8px] text-zinc-600">· los caídos se reasignan solos</span>
                  </div>
                )}
              </div>

              {/* ── 3. Misión activa — flujo lineal completo ── */}
              {activeMission && (
                <div className="space-y-4">
                  {/* Header */}
                  <div className="rounded-lg border border-zinc-700 bg-zinc-950 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="text-sm font-bold text-white">{activeMission.goal}</h2>
                        <p className="text-[9px] font-mono text-zinc-500 mt-0.5">
                          {activeMission.project && <span className="text-emerald-400 font-bold">📁 {activeMission.project.name} · </span>}
                          {activeMission.kanbanTaskId && <span className="text-violet-400" title="Tarea espejo en el kanban de Hermes">🗂 {activeMission.kanbanTaskId} · </span>}
                          {activeMission.discovery && <span className="text-sky-400 font-bold" title={`Busca en rondas hasta ${activeMission.discovery.maxDryStreak} ronda(s) seguidas sin hallazgos nuevos, o ${activeMission.discovery.maxRounds} rondas como tope`}>🔁 modo descubrimiento · </span>}
                          {activeMission.id} · {activeMission.tasks.length} agentes · {new Date(activeMission.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[9px] font-mono font-bold ${phaseColor[activeMission.phase]}`}>{phaseLabel[activeMission.phase]}</span>
                        {activeMission.phase === "executing" && (
                          <button onClick={abortMission}
                            title="Mata los procesos de los agentes y marca la misión como fallida"
                            className="text-[9px] font-mono font-bold px-2 py-0.5 rounded border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 transition-colors">
                            ⛔ Abortar
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Pipeline de fases */}
                    <div className="flex items-center gap-1 mt-3 overflow-x-auto">
                      {(["awaiting_approval","executing","awaiting_validation","done"] as const).map((ph, i) => {
                        const labels = ["⚔️ Aprobación","⚡ Ejecución","🔍 Validación","🏆 Listo"];
                        const order = ["awaiting_approval","executing","awaiting_validation","done"];
                        const myIdx = order.indexOf(activeMission.phase);
                        const isActive = activeMission.phase === ph;
                        const isDone = i < myIdx;
                        return (
                          <React.Fragment key={ph}>
                            <span className={`text-[8px] font-mono px-2 py-0.5 rounded font-bold whitespace-nowrap ${isActive ? "bg-indigo-600 text-white" : isDone ? "bg-zinc-700 text-zinc-400" : "text-zinc-700"}`}>{labels[i]}</span>
                            {i < 3 && <span className="text-zinc-800 text-[8px]">→</span>}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>

                  {/* Checkpoint 1 */}
                  {activeMission.phase === "awaiting_approval" && (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
                      <p className="text-xs font-bold text-amber-400">⚔️ Oak armó el equipo — ¿lo apruebas?</p>
                      <button onClick={() => approveMission(activeMission.id)}
                        className="px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-colors">
                        ✓ Aprobar y ejecutar
                      </button>
                    </div>
                  )}

                  {/* Equipo */}
                  <div className="space-y-1.5">
                    {activeMission.tasks.map(t => {
                      const sc = { pending:"border-zinc-800", running:"border-indigo-500", done:"border-emerald-600/50", failed:"border-rose-500" }[t.status];
                      const sb = { pending:"text-zinc-600", running:"text-indigo-400 animate-pulse", done:"text-emerald-400", failed:"text-rose-400" }[t.status];
                      const round = t.id.match(/-r(\d+)$/); // tarea clonada por runDiscoveryRounds (modo descubrimiento)
                      return (
                        <div key={t.id} className={`rounded-lg border bg-zinc-950 overflow-hidden ${sc}`}>
                          <div className="px-3 py-2 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-base shrink-0">{t.agentEmoji}</span>
                              <span className="text-[11px] font-bold text-white truncate">{t.agentName}</span>
                              <span
                                className={`text-[7px] font-mono border rounded px-1 shrink-0 ${roleColor[t.role] || "text-zinc-500"}`}
                                title={t.role === "verifier" ? "Corre en un agente distinto — revisa el resultado con ojo crítico antes de mostrártelo" : undefined}
                              >
                                {roleLabel[t.role] || t.role}
                              </span>
                              {round && (
                                <span className="text-[7px] font-mono text-sky-400 border border-sky-500/30 bg-sky-500/10 rounded px-1 shrink-0" title="Modo descubrimiento: busca en rondas hasta agotar hallazgos nuevos">
                                  🔁 ronda {round[1]}
                                </span>
                              )}
                              <span className="text-[7px] font-mono text-zinc-700 border border-zinc-800 rounded px-1 shrink-0 hidden sm:block">{t.runner}</span>
                              {t.reassignedFrom && (
                                <span className="text-[7px] font-mono text-amber-500 border border-amber-500/30 bg-amber-500/10 rounded px-1 shrink-0 hidden sm:block" title={`Reasignado: ${t.reassignedFrom} no está disponible`}>
                                  ⚠ antes {t.reassignedFrom}
                                </span>
                              )}
                            </div>
                            <span className={`text-[9px] font-mono font-bold shrink-0 ${sb}`}>
                              {{ pending:"espera", running:"hablando…", done:"listo ✓", failed:"falló ✗" }[t.status]}
                            </span>
                          </div>
                          {/* EN VIVO: lo que el agente va diciendo, chunk a chunk (SSE) */}
                          {t.status === "running" && (
                            <div className="px-3 pb-2 border-t border-indigo-900/40 bg-indigo-500/[0.03]">
                              <p className="text-[9px] font-mono text-indigo-200/80 whitespace-pre-wrap max-h-48 overflow-y-auto mt-1.5">
                                {(liveOutputs[t.id] || t.output || "…conectando con el agente")}
                                <span className="inline-block w-1.5 h-3 bg-indigo-400 ml-0.5 animate-pulse align-middle" />
                              </p>
                            </div>
                          )}
                          {t.status !== "running" && t.output && t.output !== "(coordinado internamente por NEXUS)" && (
                            <div className="px-3 pb-2 border-t border-zinc-900">
                              <p className="text-[9px] font-mono text-zinc-400 whitespace-pre-wrap line-clamp-5 mt-1.5">{t.output}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* HITO 3 — Chat en vivo con el equipo (human-in-the-loop) */}
                  {(activeMission.phase === "executing" || activeMission.phase === "awaiting_approval") && (
                    <div className="rounded-lg border border-indigo-500/30 bg-zinc-950 p-3 space-y-2">
                      <p className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest font-bold">
                        🗣 Habla con el equipo {activeMission.phase === "executing" ? "(en vivo — entra al prompt de las próximas tareas)" : "(antes de arrancar)"}
                      </p>
                      {(activeMission.guidance?.length ?? 0) > 0 && (
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {activeMission.guidance!.map((g, i) => (
                            <div key={`${g.at}-${i}`} className="flex items-start gap-2">
                              <span className="text-[8px] font-mono text-zinc-600 shrink-0 mt-0.5">{new Date(g.at).toLocaleTimeString()}</span>
                              <p className="text-[10px] text-amber-200/90 bg-amber-500/10 border border-amber-500/20 rounded px-2 py-1 flex-1">👤 {g.text}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input
                          value={guideMsg}
                          onChange={e => setGuideMsg(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") sendGuide(); }}
                          placeholder="Dales una instrucción, corrección o contexto…"
                          className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-[11px] text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                        />
                        <button onClick={sendGuide} disabled={!guideMsg.trim()}
                          className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-[10px] font-bold transition-colors">
                          Enviar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Checkpoint 2 */}
                  {activeMission.phase === "awaiting_validation" && (
                    <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4 space-y-2">
                      <p className="text-xs font-bold text-yellow-400">🔍 Agentes terminaron — ¿cumple el objetivo?</p>
                      <textarea value={validationNote} onChange={e => setValidationNote(e.target.value)}
                        placeholder="Nota opcional…" rows={2}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-yellow-500 resize-none" />
                      <div className="flex gap-2">
                        <button onClick={() => validateMission(activeMission.id, true)} className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors">✓ Aprobado</button>
                        <button onClick={() => validateMission(activeMission.id, false)} className="px-3 py-1.5 rounded bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold transition-colors">✗ Rechazar</button>
                      </div>
                    </div>
                  )}

                  {/* Resultado */}
                  {(activeMission.phase === "done" || activeMission.phase === "failed") && activeMission.result && (
                    <div className={`rounded-lg border p-4 ${activeMission.phase === "done" ? "border-emerald-500/30 bg-emerald-500/5" : "border-rose-500/30 bg-rose-500/5"}`}>
                      <p className={`text-xs font-bold mb-2 ${activeMission.phase === "done" ? "text-emerald-400" : "text-rose-400"}`}>
                        {activeMission.phase === "done" ? "🏆 Misión completada" : "✗ Misión fallida"}
                      </p>
                      {activeMission.validationNote && <p className="text-[10px] text-zinc-500 mb-2 italic">{activeMission.validationNote}</p>}
                      <p className="text-[10px] font-mono text-zinc-300 whitespace-pre-wrap">{activeMission.result}</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── 4. Historial de misiones ── */}
              {missions.filter(m => m.id !== activeMission?.id).length > 0 && (
                <div>
                  <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-2">Historial</p>
                  <div className="space-y-1">
                    {missions.filter(m => m.id !== activeMission?.id).map(m => (
                      <button key={m.id} onClick={() => setActiveMission(m)}
                        className="w-full text-left px-3 py-2 rounded border border-zinc-900 hover:border-zinc-700 bg-zinc-950 transition-colors flex items-center justify-between gap-2">
                        <span className="text-[11px] text-zinc-300 truncate">{m.goal}</span>
                        <span className={`text-[8px] font-mono shrink-0 ${phaseColor[m.phase]}`}>{phaseLabel[m.phase]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            );
          })()}

          {/* ---------- DECISIONES DEL CAMPEÓN ---------- */}
          {activeModule === "decisiones" && (
            <div className="p-6">
              <SectionHeader
                tag="CONSEJO // DECISIONES DEL CAMPEÓN"
                title="Decisiones del Campeón"
                subtitle="Las grandes decisiones del ecosistema (decisiones.md). Solo el Entrenador decide."
                icon={ShieldCheck}
              />
              <div className="space-y-3 mt-5 max-w-3xl">
                {decisions.map((d, i) => (
                  <div key={i} className="p-4 rounded-lg border border-zinc-900 bg-zinc-950">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-bold text-white">{d.title}</h3>
                      <span className="text-[9px] font-mono text-zinc-500 shrink-0">{d.date}</span>
                    </div>
                    {d.who && <p className="text-[10px] font-mono text-indigo-400 mt-1">por {d.who}</p>}
                    {d.why && <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">{d.why}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---------- BITÁCORA DE BATALLA (eventos) ---------- */}
          {activeModule === "bitacora" && (
            <div className="p-6">
              <SectionHeader
                tag="TIEMPO_REAL // BITÁCORA DE BATALLA"
                title="Bitácora de Batalla"
                subtitle="Cada movimiento de cada agente en la colmena, en vivo (eventos.md)."
                icon={ScrollText}
              />
              <div className="mt-5 max-w-3xl font-mono">
                {events.map((e, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-zinc-900/70">
                    <Clock className="w-3 h-3 text-zinc-600 mt-1 shrink-0" />
                    <span className="text-[10px] text-zinc-500 w-28 shrink-0">{e.time}</span>
                    <span className="text-[10px] text-indigo-400 w-28 shrink-0 truncate">{e.actor}</span>
                    <span className="text-[11px] text-zinc-300">{e.text}</span>
                  </div>
                ))}
                {events.length === 0 && (
                  <p className="text-xs text-zinc-600 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Sin movimientos registrados aún.</p>
                )}
              </div>
            </div>
          )}

          {/* ---------- MOVIMIENTOS Z (biblioteca global) ---------- */}
          {activeModule === "zmoves" && (
            <div className="p-6">
              <SectionHeader
                tag="BIBLIOTECA GLOBAL // MOVIMIENTOS Z"
                title="Movimientos Z"
                subtitle={`${zcat?.total ?? "…"} skills en una biblioteca compartida. No viven en ningún ejecutor: cualquier Pokémon o agente puede equipar una cuando la necesite.`}
                icon={Zap}
              />
              {!zcat && <p className="text-xs text-zinc-600 font-mono mt-5">Cargando biblioteca…</p>}
              {zcat && (
                <div className="mt-5">
                  <div className="mb-3 text-[10px] font-mono text-zinc-500">
                    Plugins compartidos: {zcat.plugins.map((p, i) => <span key={i} className="text-cyan-300/80 mr-2">⚡ {p}</span>)}
                  </div>

                  {zcat.compat && (
                    <div className="mb-4 overflow-x-auto">
                      <span className="text-[8px] font-mono text-cyan-400 uppercase tracking-widest">Compatibilidad (categoría × ejecutor) — todos pueden, pero rinde distinto</span>
                      <table className="mt-1.5 text-[9px] font-mono border-collapse">
                        <thead>
                          <tr>
                            <th className="text-left text-zinc-600 p-1 font-normal">categoría</th>
                            {zcat.compat.executors.map((e) => (
                              <th key={e.id} className="p-1 text-center font-normal text-zinc-400">
                                {e.name}<div className="text-[7px] text-zinc-600">maestría {e.mastery}</div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {zcat.compat.matrix.map((row) => (
                            <tr key={row.category} className="border-t border-zinc-900">
                              <td className="text-zinc-400 p-1 whitespace-nowrap">{row.category} <span className="text-zinc-700">· {row.domain}</span></td>
                              {zcat.compat!.executors.map((e) => {
                                const s = row.scores[e.id] ?? 0;
                                const col = s >= 80 ? "text-emerald-400" : s >= 60 ? "text-amber-400" : "text-rose-400";
                                return <td key={e.id} className={`p-1 text-center ${col}`}>{s}</td>;
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <input
                    value={zq}
                    onChange={(e) => setZq(e.target.value)}
                    placeholder="Buscar movimiento Z…"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500 mb-3"
                  />
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    <button onClick={() => setZfilter("")} className={`text-[9px] font-mono px-2 py-0.5 rounded border ${zfilter === "" ? "border-cyan-500 text-cyan-300 bg-cyan-500/10" : "border-zinc-800 text-zinc-500 hover:text-zinc-300"}`}>todas ({zcat.total})</button>
                    {Object.entries(zcat.categories).sort((a, b) => Number(b[1]) - Number(a[1])).map(([c, n]) => (
                      <button key={c} onClick={() => setZfilter(c)} className={`text-[9px] font-mono px-2 py-0.5 rounded border ${zfilter === c ? "border-cyan-500 text-cyan-300 bg-cyan-500/10" : "border-zinc-800 text-zinc-500 hover:text-zinc-300"}`}>{c} ({n})</button>
                    ))}
                  </div>
                  {(() => {
                    const ql = zq.toLowerCase();
                    const f = zcat.items.filter((z) =>
                      (!zfilter || z.category === zfilter) &&
                      (!ql || z.name.toLowerCase().includes(ql) || z.description.toLowerCase().includes(ql))
                    );
                    return (
                      <>
                        <p className="text-[10px] font-mono text-zinc-500 mb-2">{f.length} resultados{f.length > 150 ? " · mostrando 150" : ""}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                          {f.slice(0, 150).map((z, i) => (
                            <div key={i} className="p-2.5 rounded-lg border border-zinc-900 bg-zinc-950 flex gap-2">
                              <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] font-bold text-zinc-200 truncate">{z.name}</span>
                                  <span className="text-[7px] font-mono text-zinc-600 border border-zinc-800 rounded px-1 shrink-0">{z.category}</span>
                                </div>
                                {z.description && <p className="text-[9px] text-zinc-500 mt-0.5 line-clamp-2">{z.description}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* ---------- POKÉMART (financiero DEMO) ---------- */}
          {activeModule === "pokemart" && <FinancialDashboard />}

          {/* ---------- COMMANDCODE — Grafo de conocimiento ---------- */}
          {activeModule === "commandcode" && (
            <div className="p-6 space-y-6 max-w-4xl mx-auto">
              <SectionHeader
                tag="SISTEMA // GRAFO"
                title="CommandCode"
                subtitle="Mapa de conocimiento unificado de todos los proyectos activos"
                icon={Network}
              />
              {!graphData ? (
                <p className="text-zinc-500 font-mono text-sm">Cargando grafo…</p>
              ) : !graphData.exists ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center space-y-2">
                  <p className="text-zinc-400 text-sm">No se encontró ningún grafo generado.</p>
                  <p className="text-zinc-600 font-mono text-xs">Ejecuta <span className="text-indigo-400">/graphify ~/proyectos</span> para construirlo.</p>
                </div>
              ) : (
                <>
                  {/* Métricas principales */}
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: "Nodos", value: graphData.nodes?.toLocaleString() ?? "—", color: "text-indigo-400" },
                      { label: "Aristas", value: graphData.edges?.toLocaleString() ?? "—", color: "text-violet-400" },
                      { label: "Comunidades", value: graphData.communities?.toLocaleString() ?? "—", color: "text-fuchsia-400" },
                    ].map((m) => (
                      <div key={m.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                        <p className={`text-3xl font-bold font-mono ${m.color}`}>{m.value}</p>
                        <p className="text-zinc-500 text-xs mt-1 uppercase tracking-widest">{m.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Top comunidades */}
                  {graphData.topCommunities && graphData.topCommunities.length > 0 && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
                      <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-widest">Top comunidades</h3>
                      <div className="space-y-2">
                        {graphData.topCommunities.map((c) => (
                          <div key={c.id} className="flex items-center gap-3">
                            <span className="text-zinc-600 font-mono text-xs w-6">#{c.id}</span>
                            <div className="flex-1 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-full bg-indigo-500 rounded-full"
                                style={{ width: `${Math.min(100, (c.size / (graphData.topCommunities![0]?.size || 1)) * 100)}%` }}
                              />
                            </div>
                            <span className="text-indigo-300 font-mono text-xs w-8 text-right">{c.size}</span>
                            <span className="text-zinc-500 text-xs truncate max-w-[200px]">{c.sample.join(", ")}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="flex gap-3 flex-wrap">
                    <a
                      href="/graphify-out/graph.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-mono rounded-lg transition-colors"
                    >
                      <Network className="w-4 h-4" />
                      Abrir visualización interactiva
                    </a>
                  </div>

                  {/* Timestamp */}
                  {graphData.generatedAt && (
                    <p className="text-zinc-600 font-mono text-xs">
                      Generado: {new Date(graphData.generatedAt).toLocaleString("es-CO", { timeZone: "America/Bogota" })}
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Helpers de presentación
// -------------------------------------------------------------
function SectionHeader({ tag, title, subtitle, icon: Icon }: { tag: string; title: string; subtitle: string; icon: any }) {
  return (
    <div className="border-b border-zinc-900 pb-4">
      <span className="text-[8px] font-mono text-indigo-400 tracking-widest uppercase block">{tag}</span>
      <h1 className="text-xl font-bold text-white mt-1 flex items-center gap-2"><Icon className="w-5 h-5 text-indigo-400" />{title}</h1>
      <p className="text-xs text-zinc-400 font-mono mt-1">{subtitle}</p>
    </div>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-bold text-white mb-1">{children}</h2>;
}

function TypeBadge({ type, tm }: { type: string; tm: { color: string; emoji: string } }) {
  return (
    <span className="inline-flex items-center gap-1 text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded text-black" style={{ backgroundColor: tm.color }}>
      <span>{tm.emoji}</span> {type}
    </span>
  );
}

function MonCard({ mon, typeMeta, legendary = false }: { mon: PartyMon; typeMeta: (t: string) => { color: string; emoji: string }; legendary?: boolean }) {
  const tm = typeMeta(mon.type);
  const typeHex = tm.color;

  if (mon.fainted) {
    return (
      <div className="rounded-xl border border-zinc-800/40 bg-zinc-950/60 overflow-hidden relative grayscale opacity-40 select-none">
        <div className="h-0.5 w-full bg-rose-900/60" />
        <div className="p-4 flex items-center gap-3">
          <span className="text-3xl opacity-50">{mon.avatar}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-zinc-400">{mon.name}</span>
              <span className="text-[7px] font-mono font-bold text-rose-500 bg-rose-950/80 border border-rose-900 px-1.5 py-0.5 rounded shrink-0">DEBILITADO</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[9px] font-mono text-zinc-600 italic">{mon.species}</span>
              <TypeBadge type={mon.type} tm={tm} />
            </div>
            <div className="mt-2 h-1 bg-zinc-900 rounded-full overflow-hidden">
              <div className="h-full bg-rose-900/50 rounded-full" style={{ width: "0%" }} />
            </div>
            <p className="text-[9px] font-mono text-zinc-600 mt-1">{mon.recentActivity}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden relative"
      style={{ borderTop: `2px solid ${typeHex}22`, boxShadow: `0 0 20px ${typeHex}10, inset 0 1px 0 ${typeHex}15` }}>
      {/* Barra de tipo en la parte superior */}
      <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${typeHex}80, ${typeHex}20)` }} />

      {/* Pill de estado */}
      <div className="absolute top-3 right-3">
        {legendary ? (
          <span className="text-[7px] font-mono font-bold text-amber-300 bg-amber-900/40 border border-amber-700/50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
            <Star className="w-2 h-2" /> LEGENDARIO
          </span>
        ) : mon.featured ? (
          <span className="text-[7px] font-mono font-bold text-amber-300 bg-amber-900/30 border border-amber-700/40 px-1.5 py-0.5 rounded flex items-center gap-0.5">
            <Star className="w-2 h-2" /> INICIAL
          </span>
        ) : (
          <span className="text-[7px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-1.5 py-0.5 rounded flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse inline-block" />
            VIVO
          </span>
        )}
      </div>

      <div className="p-4">
        {/* Avatar + nombre + tipo */}
        <div className="flex items-center gap-3 mb-3">
          <div className="text-4xl leading-none p-2 rounded-lg" style={{ background: `${typeHex}12` }}>
            {mon.avatar}
          </div>
          <div className="min-w-0">
            <span className="text-[15px] font-bold text-white tracking-tight block">{mon.name}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[9px] font-mono text-zinc-500 italic">{mon.species}</span>
              <TypeBadge type={mon.type} tm={tm} />
            </div>
          </div>
        </div>

        {/* HP bar prominente */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[8px] font-mono font-bold text-zinc-500 uppercase tracking-widest">HP</span>
            <span className="text-[9px] font-mono font-bold text-emerald-400">{mon.hp}/100</span>
          </div>
          <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all"
              style={{ width: `${mon.hp}%`, background: `linear-gradient(90deg, ${typeHex}90, ${typeHex}cc)` }} />
          </div>
        </div>

        {/* Specialty + actividad */}
        <p className="text-[10px] font-mono text-zinc-400 leading-relaxed mb-1">{mon.specialty}</p>
        {mon.recentActivity && (
          <p className="text-[10px] text-zinc-500 line-clamp-1 italic">{mon.recentActivity}</p>
        )}

        {/* Moveset */}
        {mon.moves && mon.moves.length > 0 && (
          <div className="mt-3 pt-3 border-t" style={{ borderColor: `${typeHex}20` }}>
            <span className="text-[7px] font-mono font-bold uppercase tracking-widest" style={{ color: `${typeHex}99` }}>
              MOVESET
            </span>
            <div className="mt-1.5 space-y-1">
              {mon.moves.map((mv, i) => (
                <div key={i} className="text-[9px] leading-snug flex gap-1.5">
                  <span className="font-mono font-bold text-zinc-200 shrink-0" style={{ color: `${typeHex}dd` }}>▸ {mv.model}</span>
                  <span className="text-zinc-500 line-clamp-1">{mv.best}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {mon.lastSeen && (
          <p className="text-[7px] font-mono text-zinc-700 mt-2 text-right">{mon.lastSeen}</p>
        )}
      </div>
    </div>
  );
}
