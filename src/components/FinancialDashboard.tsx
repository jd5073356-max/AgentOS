import React from "react";
import { DollarSign, ArrowUpRight, AlertTriangle } from "lucide-react";

export default function FinancialDashboard() {
  return (
    <div id="financial-dashboard-panel" className="flex-1 flex flex-col bg-black overflow-hidden h-full">
      {/* Header */}
      <div className="p-6 border-b border-zinc-900 bg-zinc-950/40 shrink-0">
        <span className="text-[8px] font-mono text-zinc-500 tracking-widest uppercase block">AGENTOS // FINANCIAL_SUITE</span>
        <h1 className="text-xl font-bold font-sans text-white tracking-tight flex items-center gap-2 mt-0.5">
          <DollarSign className="w-5 h-5 text-emerald-400" />
          Métricas Financieras y Retorno de Inversión (ROI)
        </h1>
        <p className="text-xs text-zinc-400 font-mono mt-1">
          Analítica de valor generado, proyecciones SaaS, horas automatizadas y costos operativos de inferencia.
        </p>
      </div>

      {/* Aviso DEMO — estos números NO son reales */}
      <div className="px-6 py-2.5 bg-amber-500/10 border-b border-amber-500/30 flex items-center gap-2 shrink-0">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        <p className="text-[10px] font-mono text-amber-300">
          <span className="font-bold">DEMO · PROYECCIÓN —</span> datos de ejemplo, no reales. No hay
          fuente de ingresos conectada todavía a la colmena. Se reemplazarán cuando exista (ej. ventas del dropshipping).
        </p>
      </div>

      {/* Main layout */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#020202]">
        
        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg">
            <span className="text-[8px] font-mono text-zinc-500 uppercase block">Ingreso Recurrente Proyectado (MRR)</span>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">$7,500 <span className="text-[9px] text-zinc-500">/mes</span></div>
            <p className="text-[9px] font-mono text-zinc-500 mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3 text-emerald-500 inline" /> +24% incremento intermensual
            </p>
          </div>

          <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg">
            <span className="text-[8px] font-mono text-zinc-500 uppercase block">Horas Autónomas de IA</span>
            <div className="text-xl font-bold font-mono text-white mt-1">184.2 hrs</div>
            <p className="text-[9px] font-mono text-zinc-500 mt-1">Sustitución de labor de desarrollo</p>
          </div>

          <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg">
            <span className="text-[8px] font-mono text-zinc-500 uppercase block">Valor Financiero Creado</span>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">$14,736 <span className="text-[9px] text-zinc-500">USD</span></div>
            <p className="text-[9px] font-mono text-zinc-500 mt-1">Calculado a $80 USD/hr de consultor</p>
          </div>

          <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg">
            <span className="text-[8px] font-mono text-zinc-500 uppercase block">Costo de Inferencia API</span>
            <div className="text-xl font-bold font-mono text-rose-400 mt-1">$3.42 <span className="text-[9px] text-zinc-500">USD</span></div>
            <p className="text-[9px] font-mono text-emerald-400 mt-1">Inferencia Gemini 2.0 Flash</p>
          </div>
        </div>

        {/* Dynamic Charts visual placeholders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-lg space-y-4">
            <h3 className="text-xs font-mono font-bold text-white uppercase border-b border-zinc-900 pb-2">CURVA DE EFICIENCIA OPERATIVA</h3>
            
            {/* Visual Grid representing code stats */}
            <div className="h-44 flex items-end justify-between font-mono text-[8px] text-zinc-500 pt-4">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 bg-zinc-900 rounded-t h-12" />
                <span>Mes 1</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 bg-zinc-900 rounded-t h-20" />
                <span>Mes 2</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 bg-indigo-900/50 rounded-t h-28" />
                <span>Mes 3</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 bg-emerald-500/80 rounded-t h-36" />
                <span>Actual</span>
              </div>
            </div>
            <p className="text-[10px] text-zinc-400 font-mono text-center">Inversión en API vs Retorno de Valor en horas de ingeniería liberadas.</p>
          </div>

          <div className="p-5 bg-zinc-950 border border-zinc-900 rounded-lg space-y-4">
            <h3 className="text-xs font-mono font-bold text-white uppercase border-b border-zinc-900 pb-2">PRESUPUESTO ASIGNADO POR ÁREA</h3>
            <div className="space-y-3 font-mono text-[10px]">
              <div className="space-y-1">
                <div className="flex justify-between text-zinc-400 text-[9px]">
                  <span>DESARROLLO (Elena, Mateo, Lucas)</span>
                  <span>45% ($2,250)</span>
                </div>
                <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '45%' }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-zinc-400 text-[9px]">
                  <span>MARKETING & PUBLICIDAD (Melina)</span>
                  <span>35% ($1,750)</span>
                </div>
                <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: '35%' }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-zinc-400 text-[9px]">
                  <span>NEGOCIOS & PLANIFICACIÓN (Carlos, Sara)</span>
                  <span>20% ($1,000)</span>
                </div>
                <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '20%' }} />
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
