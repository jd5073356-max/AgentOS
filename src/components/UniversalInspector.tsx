import React from "react";
import { Agent, Project, GlobalGoal, VisualProgressCard, DependencyNode } from "../types";
import { 
  Users, 
  Target, 
  Compass, 
  Layers, 
  Clock, 
  ShieldAlert, 
  ExternalLink, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  FileCode,
  Sparkles,
  Zap,
  Hammer
} from "lucide-react";
import { agentPokedex, simulatedFiles } from "../data";

interface UniversalInspectorProps {
  selection: {
    type: 'project' | 'agent' | 'stage' | 'deliverable' | 'node' | 'file' | 'task' | 'decision';
    id: string;
    title: string;
    subtitle?: string;
    data: any;
  };
  agents: Agent[];
  activeProject: Project;
  globalGoals: GlobalGoal[];
  pipelineStages: any[];
  progressCards: VisualProgressCard[];
  dependencyNodes: DependencyNode[];
  onTriggerStage: (stageId: string) => void;
  onClearSelection: () => void;
  onExportReport: () => void;
}

export default function UniversalInspector({
  selection,
  agents,
  activeProject,
  globalGoals,
  pipelineStages,
  progressCards,
  dependencyNodes,
  onTriggerStage,
  onClearSelection,
  onExportReport
}: UniversalInspectorProps) {
  
  const { type, id, title, subtitle, data } = selection;

  return (
    <aside id="universal-property-inspector" className="w-[340px] border-l border-zinc-900 bg-[#09090b] flex flex-col shrink-0 overflow-hidden h-full">
      
      {/* Inspector Header (Like Unreal Engine properties panel) */}
      <div className="px-4 py-3 bg-zinc-950 border-b border-zinc-900 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-sm bg-indigo-500 animate-pulse" />
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-wider text-zinc-100 font-mono">
              Inspector Universal
            </h3>
            <p className="text-[8px] text-zinc-500 font-mono">
              CONTEXTO: {type.toUpperCase()} // ID: {id.substring(0, 10)}
            </p>
          </div>
        </div>
        <button
          onClick={onClearSelection}
          className="text-zinc-500 hover:text-white p-1 rounded hover:bg-zinc-900 transition-colors cursor-pointer"
          title="Ver Resumen de Proyecto"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Inspector Body - Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 select-text">
        
        {/* ==========================================
            1. PROJECT INSPECTOR VIEW
            ========================================== */}
        {type === "project" && (
          <div className="space-y-4">
            <div>
              <span className="text-[8px] font-mono font-bold bg-emerald-950/40 border border-emerald-900/30 text-emerald-400 px-2 py-0.5 rounded uppercase">
                {activeProject.status.toUpperCase()}
              </span>
              <h2 className="text-base font-bold text-white font-mono mt-2 tracking-tight">
                {activeProject.name}
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                {activeProject.description}
              </p>
              
              <button
                onClick={onExportReport}
                className="mt-3.5 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-[9px] uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                Exportar Reporte de Gestión
              </button>
            </div>

            {/* General Project KPI Table */}
            <div className="bg-zinc-900/30 border border-zinc-900 rounded p-3 space-y-2.5 font-mono text-[10px]">
              <div className="text-[8px] text-zinc-500 font-bold uppercase border-b border-zinc-900 pb-1">
                Métricas del Dashboard
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Estado General:</span>
                <span className="text-emerald-400 font-bold">67% completado</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Fase actual:</span>
                <span className="text-zinc-300">Backend API</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Tiempo restante:</span>
                <span className="text-zinc-300">2 horas estimadas</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Bloqueos activos:</span>
                <span className="text-rose-400 font-bold">1 bloqueo de QA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Próximo paso:</span>
                <span className="text-zinc-300 underline">Pruebas de Estrés QA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Socio responsable:</span>
                <span className="text-indigo-400">@Elena</span>
              </div>
            </div>

            {/* Strategic Information */}
            <div className="space-y-2">
              <div className="text-[8px] text-zinc-500 font-mono font-bold uppercase">
                Tecnologías Recomendadas
              </div>
              <div className="flex flex-wrap gap-1.5">
                {["Next.js", "Express", "PostgreSQL", "RabbitMQ", "Tailwind CSS", "Vercel"].map(tech => (
                  <span key={tech} className="bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-[9px] px-2 py-0.5 rounded">
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Risks Section */}
            <div className="bg-zinc-900/10 border border-rose-950/20 p-3 rounded space-y-2">
              <div className="text-[8px] text-rose-400 font-mono font-bold uppercase flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> RIESGOS DETECTADOS
              </div>
              <ul className="text-[10px] text-zinc-400 space-y-1.5 list-disc pl-4 font-mono">
                <li>Inyección de código SQL ciega en la variable <code className="text-rose-300">mesa_id</code> del endpoint Checkout (Severidad: ALTA).</li>
                <li>Picos de concurrencia podrían ralentizar la sincronización de comandas reactivas (Severidad: MEDIA).</li>
              </ul>
            </div>
          </div>
        )}

        {/* ==========================================
            2. AGENT POKEDEX INSPECTOR VIEW
            ========================================== */}
        {type === "agent" && (
          (() => {
            const agent = agents.find(a => a.id === id);
            const pokedex = agentPokedex[id];
            if (!agent) return <p className="text-xs text-zinc-500 font-mono">Agente no encontrado.</p>;

            return (
              <div className="space-y-4">
                {/* Visual Avatar */}
                <div className="flex items-center gap-3 bg-zinc-900/40 p-3.5 border border-zinc-900 rounded relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-1 bg-zinc-900 border-l border-b border-zinc-800 text-[8px] font-mono text-zinc-500 uppercase rounded-bl">
                    {agent.experience}
                  </div>
                  <div className="w-14 h-14 bg-zinc-950 border border-zinc-850 rounded-full flex items-center justify-center text-3xl shrink-0 shadow-inner">
                    {agent.avatar}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white font-mono flex items-center gap-1.5">
                      @{agent.name}
                    </h2>
                    <p className="text-[10px] text-zinc-400 font-mono font-semibold text-indigo-400 uppercase leading-none mt-1">
                      {agent.specialty}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`w-2 h-2 rounded-full ${
                        agent.id === "elena" ? "bg-emerald-500 animate-pulse" : "bg-zinc-650"
                      }`} />
                      <span className="text-[8px] font-mono text-zinc-500 uppercase">
                        {agent.id === "elena" ? "Trabajando en backend" : "En Espera Táctica"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pokédex bio */}
                {pokedex && (
                  <div className="space-y-3">
                    <div className="text-[8px] text-zinc-500 font-mono font-bold uppercase border-b border-zinc-900 pb-1">
                      Ficha Biográfica (Bio)
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-relaxed font-sans italic bg-zinc-950/25 p-3 border border-zinc-900/60 rounded">
                      "{pokedex.bio}"
                    </p>
                  </div>
                )}

                {/* Pokédex / LinkedIn Stats */}
                <div className="grid grid-cols-2 gap-2 font-mono text-[9px]">
                  <div className="bg-zinc-900/40 border border-zinc-900 p-2.5 rounded">
                    <span className="text-zinc-500 block">PRECISIÓN DE CALIDAD</span>
                    <span className="text-xs font-bold text-white mt-1 block">{pokedex?.qualityRating || `${agent.performanceMetric}%`}</span>
                  </div>
                  <div className="bg-zinc-900/40 border border-zinc-900 p-2.5 rounded">
                    <span className="text-zinc-500 block">LATENCIA MEDIA</span>
                    <span className="text-xs font-bold text-white mt-1 block">{pokedex?.avgLatency || "15s"}</span>
                  </div>
                  <div className="bg-zinc-900/40 border border-zinc-900 p-2.5 rounded">
                    <span className="text-zinc-500 block">PROYECTOS COMPILADOS</span>
                    <span className="text-xs font-bold text-white mt-1 block">{agent.projectsCount}</span>
                  </div>
                  <div className="bg-zinc-900/40 border border-zinc-900 p-2.5 rounded">
                    <span className="text-zinc-500 block">SINERGÍA DE EQUIPO</span>
                    <span className="text-xs font-bold text-emerald-400 mt-1 block">{pokedex?.compatibilityIndex || "95%"}</span>
                  </div>
                </div>

                {/* Core Tools and Models */}
                <div className="space-y-2">
                  <div className="text-[8px] text-zinc-500 font-mono font-bold uppercase">
                    Modelos de Lenguaje Conectados
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {pokedex?.models.map(m => (
                      <span key={m} className="bg-zinc-950 border border-zinc-900 text-[8px] text-indigo-400 font-mono px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                        <Sparkles className="w-2.5 h-2.5" />
                        {m}
                      </span>
                    )) || <span className="text-[8px] font-mono text-zinc-600">Gemini 2.0 Flash</span>}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-[8px] text-zinc-500 font-mono font-bold uppercase">
                    Caja de Herramientas (Tools)
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {agent.tools.map(tool => (
                      <span key={tool} className="bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-[8px] px-2 py-0.5 rounded">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Success Story */}
                {pokedex && (
                  <div className="space-y-1.5 bg-zinc-950/40 p-3 border border-zinc-900 rounded">
                    <span className="text-[8px] text-emerald-400 font-mono font-bold uppercase block">CASO DE ÉXITO DESTACADO</span>
                    <p className="text-[10px] text-zinc-400 leading-snug font-mono">
                      {pokedex.successStory}
                    </p>
                  </div>
                )}
              </div>
            );
          })()
        )}

        {/* ==========================================
            3. PIPELINE STAGE INSPECTOR VIEW
            ========================================== */}
        {type === "stage" && (
          (() => {
            const stage = pipelineStages.find(s => s.id === id);
            const agent = agents.find(a => a.id === stage?.responsibleId);
            if (!stage) return <p className="text-xs text-zinc-500 font-mono">Etapa no encontrada.</p>;

            return (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{stage.icon}</span>
                    <h2 className="text-sm font-bold text-white font-mono uppercase">
                      Estación {stage.label}
                    </h2>
                  </div>
                  <div className="mt-2.5">
                    <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                      stage.status === "Finalizado" ? "bg-emerald-950/30 border border-emerald-900/40 text-emerald-400" :
                      stage.status === "Trabajando" ? "bg-amber-950/30 border border-amber-900/40 text-amber-400 animate-pulse" :
                      "bg-zinc-900 text-zinc-500"
                    }`}>
                      {stage.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Responsable & Handoff */}
                <div className="bg-zinc-950/40 p-3 border border-zinc-900 rounded space-y-2">
                  <span className="text-[8px] text-zinc-500 font-mono block">OPERARIO ASIGNADO</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{agent?.avatar}</span>
                    <div>
                      <span className="text-xs font-mono font-bold text-zinc-200">@{agent?.name}</span>
                      <span className="text-[8px] font-mono text-zinc-500 block uppercase">{agent?.specialty}</span>
                    </div>
                  </div>
                </div>

                {/* Activity Bar representing the work progress */}
                <div className="space-y-2 font-mono text-[10px]">
                  <span className="text-zinc-500 block uppercase text-[8px] font-bold">Barra de Actividad del Operario</span>
                  
                  {/* Digital Meter Block */}
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-[9px] text-zinc-400 font-semibold truncate w-14">
                      {stage.status === "Finalizado" ? "100%" : stage.status === "Trabajando" ? "60%" : "0%"}
                    </span>
                    <span className="text-emerald-400 tracking-tighter">
                      {stage.status === "Finalizado" ? "■■■■■■■■■■" : stage.status === "Trabajando" ? "■■■■■■░░░░" : "░░░░░░░░░░"}
                    </span>
                  </div>
                  
                  <div className="text-[8px] text-zinc-500">
                    {stage.status === "Finalizado" ? `Completado en ${stage.duration}. Entregable firmado.` :
                     stage.status === "Trabajando" ? "Compilando código y resolviendo dependencias de Sara..." :
                     "En cola. Esperando que finalice la etapa de producción anterior."}
                  </div>
                </div>

                {/* Product Definition Metadata */}
                <div className="bg-zinc-900/30 border border-zinc-900 rounded p-3 space-y-2 font-mono text-[9px]">
                  <div className="text-[8px] text-zinc-500 font-bold uppercase">Especificación de Producto</div>
                  <div>
                    <span className="text-zinc-500 block">ENTREGABLE REQUERIDO:</span>
                    <span className="text-zinc-200 font-bold uppercase">{stage.deliverableName}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">MÉTODO DE VALIDACIÓN:</span>
                    <span className="text-zinc-300">Auditoría estática y pruebas unitarias de Tomás QA.</span>
                  </div>
                </div>

                {/* Interactive Trigger Button inside Stage */}
                {stage.status === "Esperando" && (
                  <button
                    onClick={() => onTriggerStage(stage.id)}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold font-mono uppercase rounded transition-colors"
                  >
                    <Hammer className="w-4 h-4" />
                    Disparar Etapa de Trabajo
                  </button>
                )}
              </div>
            );
          })()
        )}

        {/* ==========================================
            4. DELIVERABLE / EVIDENCE INSPECTOR VIEW
            ========================================== */}
        {type === "deliverable" && (
          (() => {
            const card = data as VisualProgressCard;
            const agent = agents.find(a => a.id === card.agentId);

            return (
              <div className="space-y-4">
                <div>
                  <span className="text-[8px] font-mono text-zinc-500 uppercase block">AUDITORÍA DE ENTREGABLE</span>
                  <h2 className="text-sm font-bold text-white font-mono uppercase leading-snug mt-1 border-b border-zinc-900 pb-2">
                    {card.action}
                  </h2>
                </div>

                {/* Author Metadata */}
                <div className="flex justify-between items-center bg-zinc-950/40 p-2 border border-zinc-900 rounded">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{agent?.avatar}</span>
                    <span className="text-[10px] font-mono font-bold text-zinc-300">@{agent?.name}</span>
                  </div>
                  <span className="text-[9px] font-mono text-zinc-500">{card.timestamp}</span>
                </div>

                {/* Technical Justification */}
                <div className="space-y-2">
                  <div className="text-[8px] text-zinc-500 font-mono font-bold uppercase">
                    Justificación de Diseño y Metodología
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed font-sans bg-zinc-900/20 p-3 border border-zinc-900 rounded">
                    {card.explanation}
                  </p>
                </div>

                {/* Code or Diagram Visual Block */}
                {card.evidenceType === "diagram" && card.evidenceData.details && (
                  <div className="space-y-2">
                    <div className="text-[8px] text-zinc-500 font-mono font-bold uppercase">
                      Topología Gráfica (Mermaid.js)
                    </div>
                    <pre className="p-3 bg-black border border-zinc-900 text-emerald-400 font-mono text-[9px] leading-relaxed rounded overflow-x-auto whitespace-pre-wrap select-text">
                      {card.evidenceData.details}
                    </pre>
                  </div>
                )}

                {card.evidenceType === "code" && card.evidenceData.code && (
                  <div className="space-y-2">
                    <div className="text-[8px] text-zinc-500 font-mono font-bold uppercase flex justify-between items-center">
                      <span>CÓDIGO DE PRODUCCIÓN ENTREGADO</span>
                      <span className="text-amber-500 font-black">{card.evidenceData.title}</span>
                    </div>
                    <pre className="p-3 bg-black border border-zinc-900 text-amber-300 font-mono text-[9px] leading-relaxed rounded overflow-x-auto select-text">
                      <code>{card.evidenceData.code}</code>
                    </pre>
                  </div>
                )}

                {/* Status Block */}
                <div className="bg-zinc-900/30 border border-zinc-900 p-3 rounded flex justify-between items-center text-[10px] font-mono">
                  <span className="text-zinc-500">ESTADO DE APROBACIÓN:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> AUDITADO & INTEGRADO
                  </span>
                </div>
              </div>
            );
          })()
        )}

        {/* ==========================================
            5. DEPENDENCY NODE INSPECTOR VIEW
            ========================================== */}
        {type === "node" && (
          (() => {
            const node = data as DependencyNode;
            const responsible = node.responsibleId ? agents.find(a => a.id === node.responsibleId) : null;

            return (
              <div className="space-y-4">
                <div>
                  <span className="text-[8px] font-mono text-zinc-500 uppercase block">GRAFO DE TOPOLOGÍA // NODO</span>
                  <h2 className="text-sm font-bold text-white font-mono uppercase mt-1">
                    {node.label}
                  </h2>
                </div>

                {/* Node Metadata Table */}
                <div className="bg-zinc-900/30 border border-zinc-900 rounded p-3 space-y-2.5 font-mono text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Tipo de Nodo:</span>
                    <span className="text-indigo-400 uppercase font-bold">{node.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Estado de Sincronía:</span>
                    <span className={`font-bold uppercase ${
                      node.status === 'completed' ? "text-emerald-400" :
                      node.status === 'in_progress' ? "text-amber-400 animate-pulse" :
                      node.status === 'blocked' ? "text-rose-400" : "text-zinc-500"
                    }`}>{node.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Índice de Riesgo:</span>
                    <span className={`font-bold uppercase ${
                      node.risk === 'alto' ? "text-rose-400" :
                      node.risk === 'medio' ? "text-amber-400" : "text-emerald-400"
                    }`}>{node.risk}</span>
                  </div>
                </div>

                {/* Responsible Party */}
                {responsible && (
                  <div className="bg-zinc-950/40 p-3 border border-zinc-900 rounded space-y-1.5">
                    <span className="text-[8px] text-zinc-500 font-mono block">AGENTE DE IA DE SOPORTE</span>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{responsible.avatar}</span>
                      <div>
                        <span className="text-xs font-mono font-bold text-zinc-200">@{responsible.name}</span>
                        <span className="text-[8px] font-mono text-zinc-500 block uppercase">{responsible.specialty}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Dependencies mapping */}
                <div className="space-y-2">
                  <div className="text-[8px] text-zinc-500 font-mono font-bold uppercase">
                    Dependencias de Capas Anteriores (Heredado)
                  </div>
                  {node.dependencies && node.dependencies.length > 0 ? (
                    <div className="flex flex-col gap-1.5">
                      {node.dependencies.map(depId => (
                        <div key={depId} className="bg-zinc-900 p-2 rounded border border-zinc-850 font-mono text-[9px] text-zinc-300">
                          {depId}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-zinc-600 font-mono">Ninguna (Nodo Semilla Raíz).</p>
                  )}
                </div>
              </div>
            );
          })()
        )}

        {/* ==========================================
            6. FILE INSPECTOR VIEW (CODE BASE EXPLORER)
            ========================================== */}
        {type === "file" && (
          (() => {
            const file = data;

            return (
              <div className="space-y-4">
                <div>
                  <span className="text-[8px] font-mono text-zinc-500 uppercase block">CONTEXTO VIVO // ARCHIVO FUENTE</span>
                  <h2 className="text-sm font-bold text-white font-mono mt-1 flex items-center gap-1.5 uppercase">
                    <FileCode className="w-4 h-4 text-amber-500" />
                    {file.name}
                  </h2>
                </div>

                {/* Code highlight segment */}
                <div className="space-y-2">
                  <div className="text-[8px] text-zinc-500 font-mono font-bold uppercase flex justify-between items-center">
                    <span>CÓDIGO DE PRODUCCIÓN ACTIVO</span>
                    <span className="text-zinc-600 text-[7px]">{file.language.toUpperCase()}</span>
                  </div>
                  <pre className="p-3 bg-black border border-zinc-900 text-amber-300 font-mono text-[9px] leading-relaxed rounded overflow-x-auto select-text max-h-[320px] overflow-y-auto">
                    <code>{file.content}</code>
                  </pre>
                </div>

                {/* Sinergy information */}
                <div className="bg-zinc-900/30 border border-zinc-900 p-3 rounded space-y-1.5 font-mono text-[9px]">
                  <span className="text-zinc-500 block">HERENCIA DE CONTEXTO VIVO:</span>
                  <p className="text-zinc-400 leading-relaxed">
                    Este archivo está indexado en el "Contexto Vivo". El siguiente agente en la línea de montaje hereda automáticamente este archivo sin pérdida de contexto ni explicaciones necesarias.
                  </p>
                </div>
              </div>
            );
          })()
        )}

        {/* ==========================================
            7. TASK / BLOCKER INSPECTOR VIEW
            ========================================== */}
        {type === "task" && (
          <div className="space-y-4">
            <div>
              <span className="text-[8px] font-mono text-rose-400 uppercase font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 animate-pulse" /> BLOQUEO OPERATIVO DETECTADO
              </span>
              <h2 className="text-sm font-bold text-white font-mono mt-1">
                Auditoría OWASP Tomás: Falta de tipado estricto en mesa_id
              </h2>
            </div>

            <div className="bg-zinc-900/30 border border-zinc-900 p-3 rounded space-y-2">
              <span className="text-[8px] text-zinc-500 font-mono block">DESCRIPCIÓN DEL RIESGO</span>
              <p className="text-[11px] text-zinc-300 leading-relaxed font-mono">
                El endpoint Express en <code className="text-rose-300 bg-black px-1 py-0.5 rounded">payments.ts</code> recibe el parámetro <code className="text-rose-300">mesa_id</code> sin validar si es un entero estricto. Esto permite inyectar cadenas de texto DDL maliciosas hacia PostgreSQL.
              </p>
            </div>

            <div className="space-y-2 font-mono text-[9px]">
              <span className="text-zinc-500 uppercase font-bold text-[8px]">Plan de Mitigación Táctico</span>
              <div className="bg-zinc-950 p-2.5 rounded border border-zinc-900 space-y-1 text-zinc-300">
                <div className="flex gap-2">
                  <span className="text-emerald-500">1.</span>
                  <span>Importar <code className="text-amber-400">express-validator</code> en Backend.</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-emerald-500">2.</span>
                  <span>Parsear <code className="text-amber-400">parseInt(req.body.mesa_id, 10)</code>.</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-emerald-500">3.</span>
                  <span>Aprobar suite de pruebas de Tomás.</span>
                </div>
              </div>
            </div>

            {/* Mitigate action button */}
            <div className="bg-zinc-950/40 p-3 border border-zinc-900 rounded space-y-2">
              <span className="text-[8px] text-zinc-500 font-mono block">AUTORIZAR ACCIÓN RECTORA</span>
              <p className="text-[10px] text-zinc-400 leading-snug">
                Al autorizar la corrección, Mateo aplicará sanitización temporal y orquestará la corrección del controlador en el pipeline.
              </p>
              <button
                onClick={() => onTriggerStage("backend")}
                className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-bold font-mono uppercase rounded transition-colors"
              >
                Autorizar Corrección & Sanitizar
              </button>
            </div>
          </div>
        )}

        {/* ==========================================
            8. DECISION INSPECTOR VIEW
            ========================================== */}
        {type === "decision" && (
          (() => {
            const dec = data;
            return (
              <div className="space-y-4">
                <div>
                  <span className={`text-[8px] font-mono font-bold border px-2 py-0.5 rounded uppercase ${
                    dec.status === 'approved' 
                      ? "bg-emerald-950/40 border-emerald-900/30 text-emerald-400" 
                      : "bg-amber-950/40 border-amber-900/30 text-amber-400"
                  }`}>
                    {dec.status === 'approved' ? "APROBADO // IMPLEMENTADO" : "RESOLUCIÓN_PENDIENTE // CRÍTICO"}
                  </span>
                  <h2 className="text-sm font-bold text-white font-mono mt-2 tracking-tight">
                    {dec.title}
                  </h2>
                  <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                    {dec.description}
                  </p>
                </div>

                <div className="bg-zinc-900/30 border border-zinc-900 p-3 rounded font-mono text-[9px] space-y-1">
                  <span className="text-zinc-500 uppercase font-bold text-[8px] block">Riesgo Mitigado:</span>
                  <p className="text-rose-400 font-bold">{dec.riskMitigated}</p>
                </div>

                <div className="space-y-2">
                  <span className="text-[8px] text-zinc-500 font-mono font-bold uppercase block">Opciones de Decisión</span>
                  <div className="space-y-2">
                    {dec.options?.map((opt: any) => {
                      const isSelected = dec.selectedOptionId === opt.id;
                      return (
                        <div 
                          key={opt.id}
                          className={`p-2.5 rounded border text-[10px] font-mono transition-all ${
                            isSelected
                              ? "bg-emerald-950/20 border-emerald-500/50 text-zinc-100"
                              : "bg-black border-zinc-900 text-zinc-400"
                          }`}
                        >
                          <div className="flex justify-between font-bold">
                            <span className={isSelected ? "text-emerald-400" : "text-zinc-300"}>{opt.label}</span>
                            <span className={isSelected ? "text-emerald-400" : "text-zinc-500"}>
                              {opt.cost}
                            </span>
                          </div>
                          <p className="text-[9px] text-zinc-400 mt-1"><span className="text-emerald-400 font-bold">PROS:</span> {opt.pros}</p>
                          <p className="text-[9px] text-zinc-400 mt-0.5"><span className="text-rose-400 font-bold">CONTRAS:</span> {opt.cons}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-zinc-950/40 p-3 border border-zinc-900 rounded space-y-1.5 font-mono text-[9px]">
                  <span className="text-zinc-500 block uppercase font-bold">RESOLUCIÓN DE CONFLICTO:</span>
                  <p className="text-zinc-400 leading-snug">
                    {dec.status === 'approved' 
                      ? "Esta decisión ya fue ejecutada por el CEO. Las correcciones han sido inyectadas en los archivos fuente del proyecto y el pipeline operacional."
                      : "Esta decisión bloquea el avance de la línea de montaje. Por favor selecciona una opción en el Centro de Decisiones para desbloquear el proyecto."}
                  </p>
                </div>
              </div>
            );
          })()
        )}

      </div>
      
    </aside>
  );
}
