import React from "react";
import { Play, Pause, ChevronLeft, ChevronRight, Sparkles, Clock, Layers, FolderOpen } from "lucide-react";

interface ReplaySimulatorProps {
  replayStep: number;
  isReplaying: boolean;
  replaySteps: any[];
  onStepChange: (step: number) => void;
  onToggleReplay: () => void;
}

export default function ReplaySimulator({
  replayStep,
  isReplaying,
  replaySteps,
  onStepChange,
  onToggleReplay
}: ReplaySimulatorProps) {
  
  const current = replaySteps[replayStep] || replaySteps[0];

  return (
    <div id="replay-simulator-panel" className="flex-1 flex flex-col bg-black overflow-hidden h-full">
      {/* Header */}
      <div className="p-6 border-b border-zinc-900 bg-zinc-950/40 shrink-0">
        <span className="text-[8px] font-mono text-zinc-500 tracking-widest uppercase block">AGENTOS // SIMULATOR_ENGINE</span>
        <h1 className="text-xl font-bold font-sans text-white tracking-tight flex items-center gap-2 mt-0.5">
          <Layers className="w-5 h-5 text-indigo-400" />
          Replay Táctico: Simulación de Sesión
        </h1>
        <p className="text-xs text-zinc-400 font-mono mt-1">
          Reproduce cronológicamente los hitos, diálogos de agentes, bloqueos y entregas del proyecto de principio a fin.
        </p>
      </div>

      {/* Grid: 2 columns */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 overflow-hidden bg-[#020202]">
        
        {/* Left column: Controls & Sequence list */}
        <div className="lg:col-span-1 border-r border-zinc-900 p-6 overflow-y-auto space-y-6 flex flex-col justify-between h-full bg-black">
          
          <div className="space-y-6">
            {/* Playback Controls card */}
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg space-y-4">
              <span className="text-[8px] font-mono text-zinc-500 uppercase block font-bold text-center">CONSOLA DE REPRODUCCIÓN</span>
              
              <div className="flex items-center justify-center gap-3">
                <button
                  disabled={replayStep === 0}
                  onClick={() => onStepChange(Math.max(0, replayStep - 1))}
                  className="p-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded text-zinc-400 hover:text-white disabled:opacity-30 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={onToggleReplay}
                  className={`p-3 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    isReplaying 
                      ? "bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:bg-amber-400" 
                      : "bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:bg-emerald-400"
                  }`}
                >
                  {isReplaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>

                <button
                  disabled={replayStep === replaySteps.length - 1}
                  onClick={() => onStepChange(Math.min(replaySteps.length - 1, replayStep + 1))}
                  className="p-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded text-zinc-400 hover:text-white disabled:opacity-30 transition-all cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Progress Slider */}
              <div className="space-y-1.5 font-mono text-[9px] text-zinc-500">
                <div className="flex justify-between">
                  <span>HITOS: {replayStep + 1} / {replaySteps.length}</span>
                  <span>TIME: {current.timestamp}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={replaySteps.length - 1}
                  value={replayStep}
                  onChange={(e) => onStepChange(parseInt(e.target.value, 10))}
                  className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>

            {/* Steps Timeline Navigation */}
            <div className="space-y-2">
              <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase block">CRONOLOGÍA DE DESPLIEGUE</span>
              <div className="space-y-1.5">
                {replaySteps.map((st, index) => {
                  const isActive = index === replayStep;
                  const isCompleted = index < replayStep;

                  return (
                    <button
                      key={st.title}
                      onClick={() => onStepChange(index)}
                      className={`w-full p-2.5 rounded text-left font-mono text-[10px] border transition-all flex items-center justify-between ${
                        isActive
                          ? "bg-indigo-950/20 border-indigo-500 text-white"
                          : "bg-zinc-950/40 border-zinc-950/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-900"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          isActive 
                            ? "bg-indigo-400 animate-pulse" 
                            : isCompleted 
                              ? "bg-emerald-500" 
                              : "bg-zinc-800"
                        }`} />
                        <span className={isActive ? "font-bold text-indigo-400" : ""}>{st.title}</span>
                      </div>
                      <span className="text-[8px] text-zinc-600 font-normal">{st.timestamp}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="text-[8px] font-mono text-zinc-600 border-t border-zinc-950 pt-4 mt-4">
            MÓDULO: REPLAY_ENGINE_v1.0 // SINC: OK
          </div>

        </div>

        {/* Center/Right column: Step Simulation sandbox details */}
        <div className="lg:col-span-2 p-6 overflow-y-auto space-y-6">
          
          {/* Active Step Hero card */}
          <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            <span className="text-[8px] font-mono text-indigo-400 uppercase block font-bold">PASO ACTIVO ACTUAL</span>
            <h2 className="text-base font-bold text-white font-mono mt-1 tracking-tight flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              {current.title}
            </h2>
            <p className="text-xs text-zinc-400 font-mono leading-relaxed mt-2">
              {current.description}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-zinc-900 font-mono text-[9px] text-zinc-400">
              <div>
                <span className="text-zinc-650 block">Ingreso Proyectado (MRR)</span>
                <span className="text-emerald-400 font-bold text-xs">{current.mrr}</span>
              </div>
              <div>
                <span className="text-zinc-650 block">Horas Autónomas de IA</span>
                <span className="text-white font-bold text-xs">{current.hoursSaved}h</span>
              </div>
              <div>
                <span className="text-zinc-650 block">Entregables Activos</span>
                <span className="text-white font-bold text-xs">{current.deliverablesCount} / 7</span>
              </div>
              <div>
                <span className="text-zinc-650 block">Bloqueos de Seguridad</span>
                <span className={`font-bold text-xs ${
                  current.activeProject.blockers.length > 0 ? "text-rose-400 animate-pulse" : "text-emerald-400"
                }`}>
                  {current.activeProject.blockers.length} bloqueos
                </span>
              </div>
            </div>
          </div>

          {/* Assembly Line Simulation view */}
          <div className="space-y-2">
            <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase block">Pipeline de Montaje en este instante</span>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 font-mono text-[9px]">
              {Object.entries(current.stagesStatus).map(([stKey, statusVal]: any) => {
                let col = "bg-zinc-900 text-zinc-500 border-zinc-950";
                if (statusVal === "Finalizado") col = "bg-emerald-950/20 border-emerald-500/30 text-emerald-400";
                if (statusVal === "Trabajando") col = "bg-amber-950/20 border-amber-500/30 text-amber-400 animate-pulse";

                return (
                  <div key={stKey} className={`p-2.5 rounded border ${col} text-center`}>
                    <div className="font-bold uppercase text-[8px]">{stKey}</div>
                    <div className="mt-1 font-black text-[7px] uppercase">{statusVal}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Simulated Logs section */}
          <div className="space-y-2">
            <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase block">Bitácora en vivo en esta marca de tiempo</span>
            <div className="bg-black border border-zinc-900 rounded p-4 h-32 overflow-y-auto flex items-center justify-center">
              <div className="font-mono text-xs text-amber-400 leading-relaxed text-center max-w-lg">
                <span className="text-[8px] text-zinc-600 block mb-1">LOG DEL SISTEMA:</span>
                "{current.log}"
              </div>
            </div>
          </div>

          {/* Active sandbox files */}
          <div className="space-y-2">
            <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase block">Archivos indexados en Contexto Vivo</span>
            {current.files.length === 0 ? (
              <div className="p-4 bg-zinc-950/40 border border-zinc-900/60 rounded font-mono text-[10px] text-zinc-600 text-center">
                Ningún archivo de código ha sido publicado todavía.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {current.files.map((fl: string) => (
                  <div key={fl} className="bg-zinc-900 border border-zinc-850 px-3 py-1.5 rounded font-mono text-xs text-zinc-300 flex items-center gap-1.5">
                    <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
                    {fl}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
