import React from "react";
import { Project, GlobalGoal, Agent, ChatMessage } from "../types";
import { 
  Building, 
  Users, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Target, 
  Briefcase,
  Play,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity
} from "lucide-react";

interface ExecutiveDashboardProps {
  projects: Project[];
  globalGoals: GlobalGoal[];
  agents: Agent[];
  messages: ChatMessage[];
  onSelectProject: (proj: Project) => void;
  onSelectAgent: (agentId: string) => void;
}

export default function ExecutiveDashboard({
  projects,
  globalGoals,
  agents,
  messages,
  onSelectProject,
  onSelectAgent
}: ExecutiveDashboardProps) {
  // Compute some high fidelity mock metrics
  const totalHoursSaved = 184; // Mock calculation
  const activeAgentsCount = agents.filter(a => a.status === 'working' || a.id === 'elena').length + 2; 
  const blockersCount = projects.reduce((acc, p) => acc + (p.blockers?.length || 0), 0);

  const systemEvents = messages.filter(m => m.isSystem || m.senderId === 'system').slice(-6).reverse();

  return (
    <div className="flex-1 overflow-y-auto bg-black p-6 space-y-6">
      
      {/* Header Panel */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-5">
        <div>
          <span className="text-[9px] font-mono text-zinc-500 tracking-widest uppercase">CEO_WORKSPACE // CONTROL_CENTRAL</span>
          <h1 className="text-2xl font-sans font-bold text-white tracking-tight flex items-center gap-2 mt-1">
            <Building className="w-6 h-6 text-emerald-400" />
            Dashboard Ejecutivo General
          </h1>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            Analítica de negocio y estado de metas globales de la organización.
          </p>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-800 px-4 py-2 rounded flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-glow-green" />
          <div>
            <div className="text-[8px] font-mono text-zinc-500 uppercase leading-none">ESTADO GENERAL DE OPERACIONES</div>
            <div className="text-xs font-mono text-emerald-400 font-black leading-none mt-1">SINC_OK (100%)</div>
          </div>
        </div>
      </div>

      {/* Grid: 4 Premium KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-zinc-950 border border-zinc-900 rounded p-4 relative overflow-hidden group hover:border-zinc-800 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] font-mono text-zinc-500 uppercase">PROYECTOS ACTIVOS</span>
            <div className="p-1.5 bg-zinc-900 rounded border border-zinc-800 text-zinc-400">
              <Briefcase className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white">2</div>
          <div className="text-[10px] text-zinc-500 font-mono mt-1 flex items-center gap-1">
            <span className="text-emerald-400 font-bold">1</span> en ejecución activa / <span className="text-zinc-400">1</span> planeación
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-zinc-950 border border-zinc-900 rounded p-4 relative overflow-hidden group hover:border-zinc-800 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] font-mono text-zinc-500 uppercase">AGENTES TRABAJANDO</span>
            <div className="p-1.5 bg-zinc-900 rounded border border-zinc-800 text-zinc-400">
              <Users className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white">{activeAgentsCount}</div>
          <div className="text-[10px] text-zinc-500 font-mono mt-1">
            De <span className="text-zinc-300">6</span> agentes entrenados en biblioteca
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-zinc-950 border border-zinc-900 rounded p-4 relative overflow-hidden group hover:border-zinc-800 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] font-mono text-zinc-500 uppercase">RECURSO AHORRADO</span>
            <div className="p-1.5 bg-zinc-900 rounded border border-zinc-800 text-zinc-400">
              <Clock className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">+{totalHoursSaved}h</div>
          <div className="text-[10px] text-zinc-500 font-mono mt-1">
            Horas-desarrollador de IA acumuladas
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-zinc-950 border border-zinc-900 rounded p-4 relative overflow-hidden group hover:border-zinc-800 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] font-mono text-zinc-500 uppercase">BLOQUEOS / ALERTAS</span>
            <div className="p-1.5 bg-zinc-900/80 rounded border border-zinc-850 text-rose-500">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400">{blockersCount}</div>
          <div className="text-[10px] text-zinc-500 font-mono mt-1">
            Requiere autorización inmediata del CEO
          </div>
        </div>
      </div>

      {/* Main Section: Projects Table & Goals Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Proyectos Activos (Grid 2 cols span) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400 font-mono flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Estado Crítico de Proyectos
            </h2>
          </div>

          <div className="space-y-3">
            {/* Project Card 1: RestoFlow (Hardcoded beautiful representation) */}
            <div className="bg-zinc-950 border border-zinc-900 rounded overflow-hidden group hover:border-zinc-800 transition-all">
              <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 bg-zinc-950/40">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-500 text-[8px] font-bold font-mono rounded uppercase">
                      ⚠️ Bloqueado por QA
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">PROJ_ID: RESTOFLOW</span>
                  </div>
                  <h3 className="text-sm font-bold text-white font-mono uppercase mt-1 group-hover:text-emerald-400 transition-colors">
                    RestoFlow SaaS
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-md">
                    Sistema unificado de comandas reactivas, menús inteligentes y pasarela de cobros express para restaurantes.
                  </p>
                </div>

                <div className="flex items-center gap-6 text-right shrink-0">
                  <div>
                    <span className="text-[8px] font-mono text-zinc-500 uppercase block">Fase Actual</span>
                    <span className="text-xs font-mono font-bold text-zinc-300">Backend</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-mono text-zinc-500 uppercase block">Prioridad</span>
                    <span className="text-xs font-mono font-bold text-rose-400">CRÍTICA</span>
                  </div>
                  <button
                    onClick={() => onSelectProject(projects[0])}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-[10px] text-white rounded font-mono uppercase font-bold"
                  >
                    Entrar Sala
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress & Blocker Bar */}
              <div className="p-4 bg-zinc-900/10 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-zinc-500">Progreso Operativo</span>
                    <span className="text-zinc-300 font-bold">67%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: "67%" }} />
                  </div>
                </div>

                <div className="bg-rose-950/20 border border-rose-900/40 p-2.5 rounded flex gap-2 items-start">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[8px] font-mono text-rose-400 uppercase block font-bold leading-none">ALERTA ACTIVA</span>
                    <span className="text-[10px] text-rose-300 font-mono mt-1 block leading-tight">
                      Express vulnerable a Inyección SQL en mesa_id. Tomás detuvo la orquestación.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Card 2: TikTok ViralEngine */}
            <div className="bg-zinc-950 border border-zinc-900 rounded overflow-hidden group hover:border-zinc-800 transition-all opacity-85">
              <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 bg-zinc-950/40">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[8px] font-bold font-mono rounded uppercase">
                      ⏱️ En Planeación
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">PROJ_ID: VIRALENGINE</span>
                  </div>
                  <h3 className="text-sm font-bold text-white font-mono uppercase mt-1 group-hover:text-blue-400 transition-colors">
                    TikTok ViralEngine
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-md">
                    Motor inteligente de guiones automatizados, extracción de tendencias y renderizado de vídeos de alto impacto.
                  </p>
                </div>

                <div className="flex items-center gap-6 text-right shrink-0">
                  <div>
                    <span className="text-[8px] font-mono text-zinc-500 uppercase block">Fase Actual</span>
                    <span className="text-xs font-mono font-bold text-zinc-500">Diseño</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-mono text-zinc-500 uppercase block">Prioridad</span>
                    <span className="text-xs font-mono font-bold text-zinc-400">Media</span>
                  </div>
                  <button
                    onClick={() => {
                      // Trigger fallback or create project
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-[10px] text-zinc-400 rounded font-mono uppercase"
                  >
                    Ver Plan
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress & Stats */}
              <div className="p-4 bg-zinc-900/10 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-zinc-500">Progreso Operativo</span>
                    <span className="text-zinc-300 font-bold">15%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: "15%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Metas de Negocio & Live Log */}
        <div className="space-y-6">
          {/* Metas de Negocio */}
          <div className="bg-zinc-950 border border-zinc-900 rounded p-4 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 font-mono flex items-center gap-1.5">
              <Target className="w-4 h-4 text-emerald-400" />
              Metas de Negocio del CEO
            </h3>
            
            <div className="space-y-4">
              {globalGoals.map(goal => (
                <div key={goal.id} className="space-y-1.5 bg-zinc-900/40 p-3 rounded border border-zinc-900">
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-zinc-200 font-mono leading-snug uppercase max-w-[180px] truncate block">{goal.title}</span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/20 px-2 py-0.5 border border-emerald-900/30 rounded">
                      {goal.targetValue}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-zinc-900/40">
                      <div 
                        className="h-full bg-emerald-500 rounded-full" 
                        style={{ width: `${goal.progress}%` }} 
                      />
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400 font-bold">{goal.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Narrator Log Feed */}
          <div className="bg-zinc-950 border border-zinc-900 rounded p-4 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 font-mono flex items-center justify-between">
              <span>Bitácora de Eventos Global</span>
              <span className="text-[8px] text-emerald-500">SYS_LIVE</span>
            </h3>

            <div className="space-y-3 h-[180px] overflow-y-auto pr-1">
              {systemEvents.map(evt => (
                <div key={evt.id} className="text-[10px] font-mono border-b border-zinc-900/40 pb-2 flex gap-2">
                  <span className="text-emerald-500 shrink-0">●</span>
                  <div>
                    <span className="text-zinc-500 mr-2">[{evt.timestamp}]</span>
                    <span className="text-zinc-300 leading-relaxed">{evt.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
