import React from "react";
import { Sparkles, AlertTriangle, CheckCircle, ShieldCheck, Zap } from "lucide-react";

interface DecisionCenterProps {
  decisions: any[];
  onApproveDecision: (decisionId: string, optionId: string) => void;
  onSelectDecision: (decision: any) => void;
  selectedDecisionId: string | null;
}

export default function DecisionCenter({
  decisions,
  onApproveDecision,
  onSelectDecision,
  selectedDecisionId
}: DecisionCenterProps) {
  
  const pendingDecisions = decisions.filter(d => d.status === 'pending');
  const approvedDecisions = decisions.filter(d => d.status === 'approved');

  return (
    <div id="decision-center-panel" className="flex-1 flex flex-col bg-black overflow-hidden h-full">
      {/* Header */}
      <div className="p-6 border-b border-zinc-900 bg-zinc-950/40 shrink-0">
        <span className="text-[8px] font-mono text-zinc-500 tracking-widest uppercase block">AGENTOS // CONFLICT_RESOLVER</span>
        <h1 className="text-xl font-bold font-sans text-white tracking-tight flex items-center gap-2 mt-0.5">
          <ShieldCheck className="w-5 h-5 text-amber-500" />
          Centro de Resoluciones y Decisiones CEO
        </h1>
        <p className="text-xs text-zinc-400 font-mono mt-1">
          Alinea la dirección estratégica. Los agentes sugieren alternativas estructuradas ante riesgos críticos.
        </p>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-[#020202]">
        
        {/* Pending Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] font-black font-mono text-amber-400 uppercase tracking-widest">
              RESOLUCIONES PENDIENTES (CRÍTICOS)
            </span>
            <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
              {pendingDecisions.length}
            </span>
          </div>

          {pendingDecisions.length === 0 ? (
            <div className="text-center py-12 bg-zinc-950/20 border border-zinc-900 rounded-lg">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2 animate-bounce" />
              <p className="text-xs font-mono text-zinc-400">Excelente. No hay cuellos de botella pendientes.</p>
              <p className="text-[10px] font-mono text-zinc-600 mt-1">Todas las estaciones avanzan libremente en el pipeline.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {pendingDecisions.map(dec => {
                const isSelected = selectedDecisionId === dec.id;
                return (
                  <div
                    key={dec.id}
                    onClick={() => onSelectDecision(dec)}
                    className={`p-5 bg-zinc-950/90 border rounded-lg transition-all cursor-pointer flex flex-col justify-between relative select-none ${
                      isSelected
                        ? "border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/30"
                        : "border-zinc-900 hover:border-zinc-800"
                    }`}
                  >
                    <div>
                      {/* Top bar: Category and requester */}
                      <div className="flex items-center justify-between mb-3 border-b border-zinc-900 pb-2">
                        <span className="text-[9px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-850 uppercase">
                          {dec.category}
                        </span>
                        <span className="text-[9px] font-mono text-zinc-500">
                          SOLICITANTE: <strong className="text-zinc-300">@{dec.requesterAgentId.toUpperCase()}</strong>
                        </span>
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-sm font-sans font-bold text-white tracking-tight hover:text-amber-400 transition-colors">
                        {dec.title}
                      </h3>
                      <p className="text-xs text-zinc-400 font-mono leading-relaxed mt-2">
                        {dec.description}
                      </p>

                      {/* Risk mitigated badge box */}
                      <div className="mt-3 bg-rose-950/20 border border-rose-900/30 p-3 rounded font-mono text-[9px] text-rose-300 flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400 mt-0.5" />
                        <div>
                          <strong className="block uppercase text-[8px] text-rose-400 font-bold">Peligro si se ignora:</strong>
                          {dec.riskMitigated}
                        </div>
                      </div>

                      {/* Options Grid */}
                      <div className="mt-5 space-y-3">
                        <span className="text-[9px] font-mono text-zinc-500 font-bold uppercase block">Selecciona una alternativa para autorizar:</span>
                        {dec.options.map((opt: any) => (
                          <div
                            key={opt.id}
                            className="p-3 bg-black hover:bg-zinc-900/40 border border-zinc-900 hover:border-zinc-800 rounded transition-all group/opt relative"
                          >
                            <div className="flex justify-between font-mono text-xs font-bold text-zinc-200">
                              <span>{opt.label}</span>
                              <span className="text-zinc-500 group-hover/opt:text-amber-400 transition-colors">{opt.cost}</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 pt-2 border-t border-zinc-950 font-mono text-[9px]">
                              <p className="text-zinc-400 leading-snug">
                                <span className="text-emerald-400 font-bold">PRO:</span> {opt.pros}
                              </p>
                              <p className="text-zinc-400 leading-snug">
                                <span className="text-rose-400 font-bold">CONTRA:</span> {opt.cons}
                              </p>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onApproveDecision(dec.id, opt.id);
                              }}
                              className="mt-3 w-full py-1.5 bg-zinc-900 hover:bg-amber-500 hover:text-black text-amber-400 font-mono font-bold text-[9px] uppercase tracking-wider rounded border border-zinc-850 hover:border-transparent transition-all flex items-center justify-center gap-1.5"
                            >
                              <Zap className="w-3 h-3" />
                              Autorizar esta opción
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Resolved Section */}
        {approvedDecisions.length > 0 && (
          <div>
            <div className="text-[10px] font-black font-mono text-zinc-500 uppercase tracking-widest mb-4">
              HISTORIAL DE RESOLUCIONES (APLICADOS)
            </div>
            <div className="space-y-2">
              {approvedDecisions.map(dec => {
                const chosenOpt = dec.options.find((o: any) => o.id === dec.selectedOptionId);
                return (
                  <div
                    key={dec.id}
                    onClick={() => onSelectDecision(dec)}
                    className="p-3 bg-zinc-950/40 border border-zinc-900/80 rounded flex items-center justify-between font-mono text-xs cursor-pointer hover:border-zinc-800"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-white">{dec.title}</span>
                          <span className="text-[8px] bg-zinc-900 text-zinc-500 border border-zinc-850 px-1.5 py-0.5 rounded uppercase">
                            {dec.category}
                          </span>
                        </div>
                        <span className="text-[9px] text-zinc-500 mt-0.5 block">
                          CEO aprobó alternativa: <strong className="text-emerald-400">{chosenOpt?.label || "Automática"}</strong> ({chosenOpt?.cost || "$0"})
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] text-zinc-600 font-mono uppercase">EJECUTADO</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
