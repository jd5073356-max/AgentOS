/**
 * data.ts — Sin datos ficticios.
 *
 * AgentOS ya NO usa seeds inventados (los agentes Sara/Lucas/… y el saga
 * "RestoFlow" fueron eliminados). Todos los datos del panel provienen en vivo
 * de la mente colmena (~/.hive) vía los endpoints /api/hive/* del backend.
 *
 * Solo se conservan los símbolos que aún importa algún componente parqueado,
 * vacíos, para no romper la compilación.
 */

export interface AgentPokedexDetails {
  lore?: string;
  catchphrase?: string;
  origin?: string;
  [key: string]: any;
}

// Vacío: la metadata real de cada agente vive en el backend (ROSTER en server.ts).
export const agentPokedex: Record<string, AgentPokedexDetails> = {};

// Vacío: ya no se simulan archivos de proyecto.
export const simulatedFiles: { name: string; content: string }[] = [];
