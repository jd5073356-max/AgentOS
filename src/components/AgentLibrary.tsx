import React, { useState } from "react";
import { Agent } from "../types";
import { Search, Shield, Zap, Sparkles, AlertCircle, RefreshCw } from "lucide-react";

interface AgentLibraryProps {
  agents: Agent[];
  onSelectAgent: (agent: Agent) => void;
  selectedAgentId: string | null;
}

export default function AgentLibrary({ agents, onSelectAgent, selectedAgentId }: AgentLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const categories = [
    "Todos",
    "Desarrollo",
    "Contenido",
    "Marketing",
    "Negocios",
    "Educación",
    "Finanzas",
    "Automatización"
  ];

  const filteredAgents = agents.filter(agent => {
    const matchesCategory = selectedCategory === "Todos" || agent.area === selectedCategory;
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          agent.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          agent.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div id="pokedex-library-panel" className="flex-1 flex flex-col bg-black overflow-hidden h-full">
      {/* Header */}
      <div className="p-6 border-b border-zinc-900 bg-zinc-950/40 shrink-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-[8px] font-mono text-zinc-500 tracking-widest uppercase block">AGENTOS // REGISTRO_CENTRAL</span>
            <h1 className="text-xl font-bold font-sans text-white tracking-tight flex items-center gap-2 mt-0.5">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Biblioteca Central de Especialistas
            </h1>
            <p className="text-xs text-zinc-400 font-mono mt-1">
              Catálogo Pokédex de agentes de IA entrenados en subdominios críticos de la empresa.
            </p>
          </div>
          {/* Search bar */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, especialidad..."
              className="w-full bg-zinc-950 border border-zinc-850 hover:border-zinc-700 text-xs font-mono text-zinc-200 pl-9 pr-4 py-2 rounded focus:outline-none focus:border-indigo-500 transition-colors placeholder-zinc-600"
            />
          </div>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-1.5 mt-5">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 text-[10px] font-mono rounded font-bold transition-all uppercase ${
                selectedCategory === cat
                  ? "bg-indigo-600 text-white shadow-md border border-indigo-500"
                  : "bg-zinc-900 border border-zinc-850 text-zinc-400 hover:text-white hover:bg-zinc-850"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Agents Grid */}
      <div className="flex-1 overflow-y-auto p-6 bg-[#020202]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAgents.map(agent => {
            const isSelected = selectedAgentId === agent.id;
            let statusColor = "bg-emerald-500";
            if (agent.status === "working") statusColor = "bg-blue-500";
            else if (agent.status === "thinking") statusColor = "bg-amber-500";
            else if (agent.status === "blocked") statusColor = "bg-rose-500";

            return (
              <div
                key={agent.id}
                onClick={() => onSelectAgent(agent)}
                className={`p-4 bg-zinc-950/80 hover:bg-zinc-950 border rounded-lg transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group select-none ${
                  isSelected
                    ? "border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/30"
                    : "border-zinc-900 hover:border-zinc-800"
                }`}
              >
                {/* Visual glow background for card */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors pointer-events-none" />

                <div>
                  {/* Top line: Area and Status indicator */}
                  <div className="flex items-center justify-between mb-3 border-b border-zinc-900 pb-2">
                    <span className="text-[8px] font-mono bg-zinc-900/50 text-zinc-400 border border-zinc-800/40 px-1.5 py-0.5 rounded uppercase">
                      {agent.area || "Desarrollo"}
                    </span>
                    <div className="flex items-center gap-1.5 bg-zinc-900/40 border border-zinc-850/40 px-1.5 py-0.5 rounded">
                      <span className={`w-1.5 h-1.5 rounded-full ${statusColor} animate-pulse`} />
                      <span className="text-[8px] font-mono text-zinc-400 uppercase">{agent.status}</span>
                    </div>
                  </div>

                  {/* Profile Summary */}
                  <div className="flex gap-3 mb-3">
                    <span className="text-3xl bg-zinc-900 p-2 rounded-lg border border-zinc-800/60 block self-start">
                      {agent.avatar}
                    </span>
                    <div>
                      <h3 className="text-xs font-mono font-black text-white group-hover:text-indigo-400 transition-colors uppercase leading-none">
                        @{agent.name}
                      </h3>
                      <span className="text-[10px] font-mono text-zinc-400 block mt-1 uppercase">
                        {agent.specialty}
                      </span>
                      <span className="text-[8px] font-mono text-zinc-500 block mt-0.5">
                        EXP: {agent.experience} // PROYS: {agent.projectsCount}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-[10px] text-zinc-400 font-mono leading-relaxed line-clamp-2 h-10 border-b border-zinc-900 pb-2">
                    {agent.description}
                  </p>

                  {/* Specs Table */}
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 py-2.5 font-mono text-[8px] text-zinc-400 border-b border-zinc-900">
                    <div>
                      <span className="text-zinc-600 uppercase block">Modelo Core</span>
                      <span className="text-zinc-200 truncate block">
                        {agent.modelsUsed?.[0] || "Gemini 2.0 Flash"}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-600 uppercase block">Calidad Prom.</span>
                      <span className="text-emerald-400 font-bold block">
                        {agent.performanceMetric}%
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-600 uppercase block">Latencia Prom.</span>
                      <span className="text-zinc-200 block">
                        {agent.avgTime || "12s"}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-600 uppercase block">Compatibilidad</span>
                      <span className="text-zinc-200 block">96% avg</span>
                    </div>
                  </div>
                </div>

                {/* Card footer details */}
                <div className="flex justify-between items-center mt-3 font-mono text-[8px]">
                  <span className="text-zinc-600">ID: {agent.id.toUpperCase()}</span>
                  <span className="text-indigo-400 uppercase font-black hover:underline">
                    Ver Pokedex →
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {filteredAgents.length === 0 && (
          <div className="text-center py-20 bg-zinc-950/20 rounded border border-zinc-900 border-dashed">
            <AlertCircle className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
            <p className="text-xs font-mono text-zinc-500">Ningún especialista coincide con los criterios de búsqueda.</p>
          </div>
        )}
      </div>
    </div>
  );
}
