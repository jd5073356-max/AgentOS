import React from "react";
import { Search, Globe, Sparkles, CheckCircle, Percent, Compass } from "lucide-react";

interface ResearchCenterProps {
  researchLogs: any[];
  onSelectResearch: (log: any) => void;
  selectedResearchId: string | null;
}

export default function ResearchCenter({
  researchLogs,
  onSelectResearch,
  selectedResearchId
}: ResearchCenterProps) {
  
  return (
    <div id="research-center-panel" className="flex-1 flex flex-col bg-black overflow-hidden h-full">
      {/* Tab Header inside War Room */}
      <div className="p-4 bg-zinc-950/60 border-b border-zinc-900 shrink-0">
        <span className="text-[8px] font-mono text-zinc-500 tracking-widest uppercase block">WAR_ROOM // RESEARCH_EXPLORER</span>
        <h2 className="text-xs font-bold font-mono text-indigo-400 mt-1 uppercase">
          Centro de Investigación y Rastreo Web
        </h2>
        <p className="text-[9px] text-zinc-500 font-mono mt-0.5">
          Agentes autónomos rastrean la web para buscar mejores prácticas, APIs oficiales, y resolver dudas de desarrollo.
        </p>
      </div>

      {/* Main List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black">
        {researchLogs.map(log => {
          const isSelected = selectedResearchId === log.id;
          return (
            <div
              key={log.id}
              onClick={() => onSelectResearch(log)}
              className={`p-4 rounded border transition-all cursor-pointer relative overflow-hidden select-none ${
                isSelected
                  ? "bg-zinc-900/40 border-indigo-500/80 shadow-[0_0_12px_rgba(99,102,241,0.1)]"
                  : "bg-[#09090b] border-zinc-900 hover:border-zinc-800"
              }`}
            >
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-3 font-mono text-[9px]">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Rastreador: <strong className="text-zinc-200">@{log.agentId}</strong></span>
                </div>
                <div className="flex items-center gap-1 text-emerald-400 font-bold">
                  <Percent className="w-3 h-3" />
                  <span>Confianza: {log.confidence}%</span>
                </div>
              </div>

              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-tight">
                {log.title}
              </h3>

              {/* Research step lists */}
              <div className="mt-3 space-y-1.5 font-mono text-[9px] border-b border-zinc-950 pb-3">
                <span className="text-zinc-500 uppercase text-[8px] font-bold block">Historial de Pasos de Navegación:</span>
                {log.steps.map((step: string, sIdx: number) => (
                  <div key={sIdx} className="flex gap-2 text-zinc-400 leading-snug">
                    <span className="text-indigo-400 font-bold">[{sIdx + 1}]</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>

              {/* Sources */}
              <div className="mt-3 flex flex-wrap gap-2 items-center">
                <span className="text-[8px] font-mono text-zinc-500 uppercase font-bold">Fuentes Consultadas:</span>
                {log.sources.map((src: any) => (
                  <a
                    key={src.name}
                    href={src.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-[8px] font-mono bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-indigo-300 px-1.5 py-0.5 rounded transition-colors"
                  >
                    {src.name}
                  </a>
                ))}
              </div>

              {/* Click to inspect */}
              <div className="mt-3 pt-2.5 border-t border-zinc-900 flex justify-between items-center text-[8px] font-mono">
                <span className="text-zinc-650">REF: {log.id.toUpperCase()}</span>
                <span className="text-indigo-400 font-black uppercase hover:underline">
                  Ver Detalles en Inspector →
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
