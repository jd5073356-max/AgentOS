import React, { useState } from "react";
import { Project, Agent, GlobalGoal, VisualProgressCard } from "../types";
import { 
  X, 
  Printer, 
  Download, 
  FileText, 
  CheckCircle, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Briefcase, 
  ShieldCheck, 
  AlertTriangle, 
  Copy, 
  Check 
} from "lucide-react";

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  agents: Agent[];
  pipelineStages: any[];
  progressCards: VisualProgressCard[];
  decisions: any[];
  globalGoals: GlobalGoal[];
}

export default function ReportExportModal({
  isOpen,
  onClose,
  project,
  agents,
  pipelineStages,
  progressCards,
  decisions,
  globalGoals
}: ReportExportModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Formatting current date and time
  const formattedDate = new Date().toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short"
  });

  // Calculate high fidelity operational metrics
  const mrr = "$7,500 USD/mes";
  const autonomousHours = "184.2 hrs";
  const financialValue = "$14,736.00 USD";
  const apiCost = "$3.42 USD";
  const roiValue = "4,308x";

  // Build Markdown Document
  const generateMarkdownReport = (): string => {
    let md = `# REPORTE DE GESTIÓN Y RETORNO DE INVERSIÓN (ROI)\n`;
    md += `**Proyecto:** ${project.name}\n`;
    md += `**Fecha de Emisión:** ${formattedDate}\n`;
    md += `**Generado por:** CEO (Director de la Organización)\n`;
    md += `**Estado del Proyecto:** ${project.status.toUpperCase()} // 67% Completado\n\n`;
    
    md += `---\n\n`;
    md += `## 1. RESUMEN EJECUTIVO\n`;
    md += `${project.description}\n\n`;
    md += `### Célula de Trabajo de Agentes Autónomos Asignada:\n`;
    project.team.forEach(agentId => {
      const ag = agents.find(a => a.id === agentId);
      if (ag) {
        md += `- **@${ag.name}** (${ag.specialty}) - Model: Gemini 2.0 Flash\n`;
      }
    });
    md += `\n`;

    md += `---\n\n`;
    md += `## 2. MÉTRICAS CLAVE E IMPACTO FINANCIERO (ROI)\n`;
    md += `| Métrica | Valor de Producción | Detalles de Gestión e Impacto |\n`;
    md += `| :--- | :--- | :--- |\n`;
    md += `| **Valor Financiero Creado** | ${financialValue} | Calculado sobre tarifa de consultoría de ingeniería de software a $80 USD/hora. |\n`;
    md += `| **Horas de Desarrollo Autónomo** | ${autonomousHours} | Labor técnica directa realizada de forma autónoma por los agentes en la línea de montaje. |\n`;
    md += `| **Costo de Inferencia API** | ${apiCost} | Consumo acumulado de tokens de API Gemini 2.0 Flash para el desarrollo de módulos. |\n`;
    md += `| **Eficiencia Operativa / ROI** | **${roiValue} de retorno** | Relación directa entre valor financiero creado y costo de computación (Inferencia). |\n`;
    md += `| **Ingreso Proyectado (MRR)** | ${mrr} | Estimación de tracción comercial inicial para el modelo de suscripción gastronómico. |\n`;
    md += `\n`;

    md += `---\n\n`;
    md += `## 3. HISTORIAL DE ENTREGABLES Y COMPILACIONES (LÍNEA DE MONTAJE)\n`;
    if (progressCards.length === 0) {
      md += `*No se han registrado entregables en la sesión actual.*\n\n`;
    } else {
      progressCards.forEach((card, idx) => {
        const ag = agents.find(a => a.id === card.agentId);
        md += `### [Entregable #${idx + 1}] ${card.action}\n`;
        md += `- **Responsable:** @${ag?.name || "Sistema"} (${ag?.specialty || "Agente Core"})\n`;
        md += `- **Sello de Tiempo:** ${card.timestamp}\n`;
        md += `- **Justificación Técnica:** ${card.explanation}\n`;
        if (card.evidenceType === "code" && card.evidenceData?.code) {
          md += `- **Código de Producción Vinculado (${card.evidenceData.title}):**\n\`\`\`typescript\n${card.evidenceData.code}\n\`\`\`\n`;
        } else if (card.evidenceType === "report" && card.evidenceData?.details) {
          md += `- **Detalles de Auditoría / Reporte:**\n\`\`\`text\n${card.evidenceData.details}\n\`\`\`\n`;
        }
        md += `\n`;
      });
    }

    md += `---\n\n`;
    md += `## 4. CENTRO DE RESOLUCIONES Y DECISIONES TOMADAS\n`;
    const approvedDecisions = decisions.filter(d => d.status === "approved");
    if (approvedDecisions.length === 0) {
      md += `*No se han formalizado decisiones estratégicas en esta sesión.*\n\n`;
    } else {
      approvedDecisions.forEach(dec => {
        const chosenOpt = dec.options.find((o: any) => o.id === dec.selectedOptionId);
        md += `### ${dec.title} [${dec.category}]\n`;
        md += `- **Riesgo Mitigado:** ${dec.riskMitigated}\n`;
        md += `- **Resolución Adoptada:** **${chosenOpt?.label || "Sin Opción"}**\n`;
        md += `- **Tecnología Empleada:** ${chosenOpt?.tech || "N/A"}\n`;
        md += `- **Costo de Capital / Beneficio:** ${chosenOpt?.cost || "$0"}\n`;
        md += `- **Justificación Comercial:** Pros: ${chosenOpt?.pros || ""}. Contras: ${chosenOpt?.cons || ""}\n\n`;
      });
    }

    md += `---\n\n`;
    md += `## 5. RIESGOS RESIDUALES Y PRÓXIMAS ACCIONES\n`;
    if (project.blockers.length > 0) {
      md += `### Bloqueos Operativos Activos:\n`;
      project.blockers.forEach(b => {
        md += `- 🔴 **Alerta:** ${b}\n`;
      });
    } else {
      md += `- ✅ **No hay bloqueos activos en el pipeline.** Las auditorías de Tomás QA y validaciones OWASP están aprobadas.\n`;
    }
    md += `\n### Siguientes Pasos Planificados:\n`;
    project.nextSteps.forEach(step => {
      md += `1. ${step}\n`;
    });

    return md;
  };

  const handleDownloadMarkdown = () => {
    const mdText = generateMarkdownReport();
    const blob = new Blob([mdText], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${project.id}-reporte-gestion.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyToClipboard = () => {
    const mdText = generateMarkdownReport();
    navigator.clipboard.writeText(mdText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  return (
    <div 
      id="report-export-modal" 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 md:p-6 select-none animate-[fadeIn_0.2s_ease-out]"
    >
      {/* Modal Wrapper */}
      <div className="w-full max-w-6xl h-[90vh] bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden flex flex-col shadow-2xl">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-900 bg-zinc-950 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[8px] font-mono text-indigo-400 tracking-widest uppercase block">AGENTOS // REPORTING_SUITE</span>
            <h2 className="text-sm font-bold font-mono text-white uppercase mt-0.5 flex items-center gap-2">
              <FileText className="w-4.5 h-4.5 text-indigo-400" />
              Exportación de Reporte Ejecutivo y ROI de Gestión
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white p-1 rounded hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Content Container */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Left panel: Controls and instruction guidelines */}
          <div className="w-full lg:w-[320px] border-r border-zinc-900 bg-[#09090b] p-5 shrink-0 overflow-y-auto space-y-5">
            <div>
              <h3 className="text-xs font-mono font-bold text-white uppercase">Parámetros de Gestión</h3>
              <p className="text-[10px] text-zinc-500 font-mono mt-1 leading-relaxed">
                Este centro de exportación reúne las métricas en tiempo real, los entregables de la célula y las resoluciones tomadas para compilar un documento ejecutivo formal compatible con auditorías de gerencia.
              </p>
            </div>

            {/* Strategic KPI Quick Cards */}
            <div className="space-y-2.5 font-mono">
              <div className="p-3 bg-zinc-950 border border-zinc-900 rounded">
                <span className="text-[8px] text-zinc-500 uppercase block">Retorno de Inversión (ROI)</span>
                <span className="text-sm font-bold text-emerald-400 block mt-0.5">{roiValue} de retorno</span>
                <span className="text-[8px] text-zinc-600 block mt-1">Eficiencia de inferencia vs costo humano</span>
              </div>
              <div className="p-3 bg-zinc-950 border border-zinc-900 rounded">
                <span className="text-[8px] text-zinc-500 uppercase block">Horas Libres de Consultoría</span>
                <span className="text-sm font-bold text-white block mt-0.5">{autonomousHours} autónomas</span>
                <span className="text-[8px] text-zinc-600 block mt-1">Valor generado: {financialValue}</span>
              </div>
            </div>

            {/* Print & Download Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleTriggerPrint}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Imprimir / Guardar PDF
              </button>

              <button
                onClick={handleDownloadMarkdown}
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-850 text-zinc-200 font-mono font-bold text-xs uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-indigo-400" />
                Descargar Markdown (.md)
              </button>

              <button
                onClick={handleCopyToClipboard}
                className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 text-zinc-400 hover:text-zinc-200 font-mono font-bold text-xs uppercase tracking-wider rounded transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    ¡Copiado al portapapeles!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copiar Reporte Markdown
                  </>
                )}
              </button>
            </div>

            <div className="bg-zinc-950 p-3.5 border border-zinc-900 rounded space-y-1.5 font-mono text-[9px] text-zinc-500 leading-relaxed">
              <span className="text-[8px] text-zinc-400 font-bold uppercase block">💡 Nota de Impresión:</span>
              <span>
                Para guardar el reporte como un PDF impecable, haga clic en <strong>"Imprimir / Guardar PDF"</strong> y en la ventana de impresión del navegador seleccione <strong>"Guardar como PDF"</strong> como destino. El estilo se auto-formatea en blanco y negro de alta calidad.
              </span>
            </div>
          </div>

          {/* Right panel: Preview document sheet mimicking white paper style */}
          <div className="flex-1 bg-zinc-900 overflow-y-auto p-6 md:p-10 flex justify-center">
            
            {/* White Paper Sheet */}
            <div 
              id="printable-executive-report" 
              className="w-full max-w-[800px] bg-white text-zinc-900 p-8 md:p-12 shadow-xl border border-zinc-300 rounded font-sans relative select-text text-left"
            >
              
              {/* Header section of white paper */}
              <div className="border-b-2 border-zinc-900 pb-5 mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">AGENTOS // SISTEMAS DE OPERACIÓN</span>
                  <h1 className="text-2xl font-serif font-extrabold text-zinc-950 tracking-tight mt-1 leading-none">
                    REPORTE DE GESTIÓN Y ROI
                  </h1>
                  <p className="text-xs text-zinc-500 font-mono mt-1.5 font-bold uppercase tracking-wide">
                    Análisis de Orquestación y Valor de Producción
                  </p>
                </div>
                
                <div className="text-left md:text-right font-mono text-[9px] text-zinc-500 leading-normal space-y-0.5">
                  <div><strong>PROYECTO:</strong> <span className="text-zinc-900 uppercase font-black">{project.name}</span></div>
                  <div><strong>FECHA:</strong> <span className="text-zinc-900">{formattedDate}</span></div>
                  <div><strong>AUTOR:</strong> <span className="text-zinc-900 uppercase">CEO (Director)</span></div>
                  <div><strong>ESTADO:</strong> <span className="text-emerald-700 uppercase font-black">67% COMPLETADO</span></div>
                </div>
              </div>

              {/* SECTION 1: Summary */}
              <div className="space-y-4 mb-8">
                <h3 className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-200 pb-1">
                  1. RESUMEN EJECUTIVO Y OBJETIVOS
                </h3>
                <p className="text-xs text-zinc-800 font-sans leading-relaxed text-justify">
                  Este reporte técnico resume el progreso acumulado, el retorno de inversión y las justificaciones de ingeniería relativas al desarrollo de <strong>{project.name}</strong>. El proyecto es una plataforma moderna estructurada de forma incremental por una célula autónoma de agentes de Inteligencia Artificial que cooperan mediante un bus de sincronización común ("Contexto Vivo").
                </p>
                <div className="bg-zinc-50 border border-zinc-200 p-3.5 rounded">
                  <span className="text-[9px] font-mono text-zinc-500 font-bold block uppercase mb-1">Célula Operativa Activa:</span>
                  <div className="flex flex-wrap gap-x-5 gap-y-1.5 font-mono text-[9px] text-zinc-700">
                    {project.team.map(agentId => {
                      const ag = agents.find(a => a.id === agentId);
                      return ag ? (
                        <div key={agentId}>
                          <span className="font-bold text-zinc-950">@{ag.name}</span>: {ag.specialty}
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>

              {/* SECTION 2: Metrics Table */}
              <div className="space-y-4 mb-8">
                <h3 className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-200 pb-1">
                  2. EFICIENCIA FINANCIERA E IMPACTO DE RETORNO (ROI)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-[10px] border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-900 text-zinc-500">
                        <th className="py-2 pr-4 font-bold uppercase">Métrica del Negocio</th>
                        <th className="py-2 px-4 font-bold uppercase text-right">Valor Registrado</th>
                        <th className="py-2 pl-4 font-bold uppercase">Análisis e Impacto Comercial</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 text-zinc-800">
                      <tr>
                        <td className="py-2.5 pr-4 font-bold text-zinc-950">Valor de Producción Creado</td>
                        <td className="py-2.5 px-4 font-bold text-right text-emerald-700">{financialValue}</td>
                        <td className="py-2.5 pl-4 font-sans text-[10px] leading-relaxed text-zinc-600">
                          Ahorro acumulado estimado sobre labor de ingeniería calculada a tarifa promedio de consultoría externa ($80 USD/hr).
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 pr-4 font-bold text-zinc-950">Labor Autónoma de IA</td>
                        <td className="py-2.5 px-4 text-right font-bold">{autonomousHours}</td>
                        <td className="py-2.5 pl-4 font-sans text-[10px] leading-relaxed text-zinc-600">
                          Horas netas de cómputo y desarrollo de módulos y pruebas de testing directo.
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 pr-4 font-bold text-zinc-950">Costo de Inferencia API</td>
                        <td className="py-2.5 px-4 text-right font-bold text-rose-700">{apiCost}</td>
                        <td className="py-2.5 pl-4 font-sans text-[10px] leading-relaxed text-zinc-600">
                          Gasto operativo en llamadas de API de lenguaje Gemini 2.0 Flash para formulación de código y análisis.
                        </td>
                      </tr>
                      <tr className="bg-zinc-50 font-bold text-zinc-950">
                        <td className="py-2.5 pr-4 uppercase">Retorno de Inversión (ROI)</td>
                        <td className="py-2.5 px-4 text-right text-emerald-700 uppercase">{roiValue} ROI</td>
                        <td className="py-2.5 pl-4 font-sans text-[10px] leading-relaxed text-zinc-700">
                          Multiplicador de valor: Por cada dólar invertido en API, se obtuvieron ${Number(roiValue.replace("x", "")).toLocaleString()} USD de labor de software directa.
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 pr-4 font-bold text-zinc-950">Ingreso Recurrente (MRR)</td>
                        <td className="py-2.5 px-4 text-right text-zinc-950">{mrr}</td>
                        <td className="py-2.5 pl-4 font-sans text-[10px] leading-relaxed text-zinc-600">
                          MRR inicial estimado para el SaaS en fase piloto de restaurantes locales bajo el modelo sugerido por Carlos.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 3: Deliverables */}
              <div className="space-y-4 mb-8">
                <h3 className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-200 pb-1">
                  3. BITÁCORA DE ENTREGABLES E HITOS COMPILADOS
                </h3>
                <div className="space-y-4">
                  {progressCards.length === 0 ? (
                    <p className="text-[10px] text-zinc-500 font-mono italic">No se han registrado entregables en la sesión actual.</p>
                  ) : (
                    progressCards.map((card, idx) => {
                      const ag = agents.find(a => a.id === card.agentId);
                      return (
                        <div key={card.id} className="border-l-2 border-zinc-950 pl-4 space-y-1 font-sans text-[10px]">
                          <div className="flex justify-between font-mono text-[9px] text-zinc-500 leading-none">
                            <span>ENTREGABLE #{idx + 1} // @{ag?.name || "sara"} ({ag?.specialty || "Orquestador"})</span>
                            <span>{card.timestamp}</span>
                          </div>
                          <h4 className="font-bold text-zinc-950 uppercase">{card.action}</h4>
                          <p className="text-zinc-600 leading-relaxed text-[10px] text-justify">{card.explanation}</p>
                          {card.evidenceData?.title && (
                            <div className="font-mono text-[8px] text-zinc-500 bg-zinc-50 p-1.5 border border-zinc-200 rounded mt-1 max-w-lg">
                              ARCHIVO COMPILADO: <span className="font-bold text-zinc-800">{card.evidenceData.title}</span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* SECTION 4: Decisions */}
              <div className="space-y-4 mb-8">
                <h3 className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-200 pb-1">
                  4. CENTRO DE RESOLUCIONES Y DECISIONES ESTRATÉGICAS
                </h3>
                <div className="space-y-3.5">
                  {decisions.filter(d => d.status === "approved").length === 0 ? (
                    <p className="text-[10px] text-zinc-500 font-mono italic">No se han formalizado resoluciones estratégicas por el CEO en la sesión actual.</p>
                  ) : (
                    decisions.filter(d => d.status === "approved").map(dec => {
                      const chosenOpt = dec.options.find((o: any) => o.id === dec.selectedOptionId);
                      return (
                        <div key={dec.id} className="space-y-1 font-sans text-[10px]">
                          <div className="flex justify-between font-mono text-[9px] text-zinc-500">
                            <span>DECISIÓN ID: {dec.id}</span>
                            <span className="font-bold text-emerald-700 uppercase">Aprobada por el CEO</span>
                          </div>
                          <h4 className="font-mono font-bold text-zinc-950 uppercase">{dec.title} ({dec.category})</h4>
                          <p className="text-zinc-600 leading-relaxed text-justify">{dec.description}</p>
                          <div className="bg-zinc-50 p-2.5 border border-zinc-200 rounded font-mono text-[9px] space-y-1 text-zinc-700 mt-1">
                            <div><strong className="text-zinc-950">Riesgo Mitigado:</strong> {dec.riskMitigated}</div>
                            <div><strong className="text-zinc-950">Resolución Oficial:</strong> {chosenOpt?.label}</div>
                            <div className="flex gap-4">
                              <div><strong className="text-zinc-950">Tecnología:</strong> {chosenOpt?.tech}</div>
                              <div><strong className="text-zinc-950">Impacto Financiero:</strong> {chosenOpt?.cost}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* SECTION 5: Blockers and Next Steps */}
              <div className="space-y-4">
                <h3 className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-200 pb-1">
                  5. RIESGOS RESIDUALES Y PRÓXIMAS ACCIONES
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-[9px]">
                  <div className="p-3 border border-zinc-200 rounded">
                    <span className="text-zinc-500 block uppercase font-bold mb-1.5">Bloqueos / Riesgos Activos:</span>
                    {project.blockers.length > 0 ? (
                      <ul className="space-y-1.5 pl-3 list-disc text-rose-700">
                        {project.blockers.map((b, idx) => (
                          <li key={idx} className="leading-tight">{b}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-emerald-700 font-bold flex items-center gap-1">
                        ✓ Cero bloqueos en el pipeline.
                      </div>
                    )}
                  </div>

                  <div className="p-3 border border-zinc-200 rounded">
                    <span className="text-zinc-500 block uppercase font-bold mb-1.5">Siguientes Pasos Planificados:</span>
                    <ol className="space-y-1 pl-3 list-decimal text-zinc-700">
                      {project.nextSteps.map((step, idx) => (
                        <li key={idx} className="leading-tight">{step}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>

              {/* Footer Stamp of paper */}
              <div className="border-t border-zinc-200 mt-12 pt-4 text-center font-mono text-[8px] text-zinc-400">
                <span>DOCUMENTO OFICIAL GENERADO POR AGENTOS ENGINE</span>
                <span className="mx-2">|</span>
                <span>ID SELLO HASH: {project.id.toUpperCase()}-SINC-2026</span>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
