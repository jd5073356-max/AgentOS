# AgentOS — Roadmap a la Visión 1.0 (construir lo REAL sobre el cimiento)

> Plan por fases para convertir AgentOS en el SO de coordinación de [VISION.md](./VISION.md),
> construido de verdad sobre lo que **ya existe**. Sin ficción. Cada fase tiene criterio verificable.
> Estado base: Fase 0 ✅ hecha (panel espejo de la colmena, registro real, Claude Code #1).

## Idea central: no construir el motor, cablear la cabina
La visión ya está casi toda construida — repartida entre dos sistemas que Juan ya tiene:

| Pieza de la visión | Dónde vive ya, REAL | Acción |
|---|---|---|
| **Biblioteca de Especialistas** | `~/.hermes/sistema-agentes.json` → **51 agentes / 9 distritos** | Exponerla (lectura) |
| **Pipeline / Sala de Guerra** | Hermes Agent kanban: `kanban.db` (`tasks`, `task_runs`, `task_events`) + API FastAPI (`/board`, `/tasks`, `/workers/active`, `/stats`) | Leer + crear tareas |
| **Contexto Vivo** | `~/.hive` (la mente colmena) | ✅ ya conectado |
| **Bitácora Operativa** | `~/.hive/eventos.md` + `task_events` | ✅ parcial / extender |
| **Investigación Transparente** | Hermes Agent `/runs/{id}/inspect`, `/tasks/{id}/log` | Mostrar el rastro |
| **Replay** | `task_events` (timeline real del run) | Construir el player |
| **Dashboard Ejecutivo** | kanban `/stats` + `/workers/active` + proyectos de la colmena | Componer |
| **Centro de Decisiones** | `~/.hive/decisiones.md` + tareas en espera de aprobación | Añadir gate |
| **Director Estratégico** | `/api/strategic/analyze` (IA, gemini-2.5-flash, ya existe) | Cablear plan → tareas |

## Arquitectura objetivo (3 capas)
- **AgentOS (cabina/UI + backend Express)** — lo que el CEO ve y dirige. Adaptadores: lector de la
  colmena (✅) + **adaptador Hermes Agent** (nuevo: roster, kanban, runs).
- **Hermes Agent (motor)** — ejecuta los 51 especialistas; `kanban.db` = tareas/runs; gateway Vertex
  (systemd `vertex-proxy.service`, ya corriendo) para modelos.
- **Mente colmena `~/.hive` (contexto)** — Contexto Vivo + Bitácora + Centro de Decisiones.

```
CEO → AgentOS (cabina) ──┬──> Hermes Agent kanban/agents (ejecución real)
                         └──> ~/.hive (contexto vivo, bitácora, decisiones)
```

## Fases

### Fase 1 — Biblioteca de Especialistas REAL (solo lectura) · riesgo bajo
- Backend: adaptador que lee `sistema-agentes.json` → `GET /api/hermes/specialists` (id, nombre,
  distrito, especialidad, herramientas).
- UI: módulo "Biblioteca" con fichas reales de los 51 agentes agrupados por sus 9 distritos.
- **Criterio:** ver los 51 especialistas reales con su distrito y especialidad.

### Fase 2 — Dashboard Ejecutivo + Sala de Guerra (lectura del kanban) · riesgo bajo
- Backend: adaptador al kanban de Hermes Agent (preferir su API FastAPI; lectura directa de `kanban.db`
  solo si la API no está servida) → `/api/hermes/board`, `/tasks/{id}`, `/workers/active`, `/stats`.
- UI: Dashboard con tareas/workers/stats reales; Sala de Guerra por tarea con su run y eventos.
- **Criterio:** ver tareas reales de Hermes Agent y qué agente trabaja en cada una, en vivo.

### Fase 3 — Director Estratégico REAL: objetivo → plan → tareas · ALTO VALOR / ALTO CUIDADO
- Cablear el planner IA existente (gemini-2.5-flash) para que, al **aprobar** el plan, cree tareas
  reales en el kanban (`POST /tasks`) asignadas a especialistas reales del roster, y registre la
  decisión en `decisiones.md`.
- **Criterio:** escribir un objetivo en lenguaje natural → se crean tareas reales que Hermes Agent
  puede ejecutar, con el equipo recomendado.
- **Cuidado:** es el primer punto donde AgentOS ESCRIBE en el motor real. Pasar por la API (no
  escribir `kanban.db` a mano) para respetar las invariantes de Hermes. Go/No-Go con EL JUEZ.

### Fase 4 — Bitácora, Investigación Transparente y Replay reales
- Leer `task_events` / `task_runs` / `/runs/{id}/inspect` / `/tasks/{id}/log` para: bitácora real,
  rastro de investigación (qué consultó cada run) y un Replay que reproduce el timeline real.
- **Criterio:** reproducir un proyecto real paso a paso, con sus fuentes y entregables.

### Fase 5 — Centro de Decisiones con gate real
- Tareas que esperan aprobación del CEO → cola en AgentOS; aprobar/rechazar escribe al kanban +
  `decisiones.md`.
- **Criterio:** una tarea bloqueada espera tu OK; al aprobarla, avanza en Hermes Agent.

### Fase 6 — Escalabilidad y pulido
- Paginación/virtualización (100s de tareas/agentes), SSE en vez de polling, multi-proyecto.
- **Criterio:** fluido con 100 tareas y 50 agentes.

## Reglas transversales
- AgentOS sigue en `127.0.0.1`, token exacto; nunca exponer `.env` ni `vertex-credentials.json`.
- Modelos siempre vía el gateway Vertex existente (no claves directas).
- Escrituras al motor solo por la API de Hermes (no tocar `kanban.db` directamente salvo último recurso).
- Filtro AETHON: construye sistema ✅ + escala ✅ (dinero indirecto: habilita todos los proyectos).

## Por confirmar antes de Fase 2 (no bloquea Fase 1)
1. ¿La API FastAPI del kanban está servida y en qué puerto/host? (¿auth?). Si no, ¿AgentOS asume
   Hermes Agent arriba o lo levanta con `start_hermes_services.sh`?
2. ¿Hermes Agent corre continuo o on-demand?
3. Mapeo de los 51 agentes ↔ presencia en la colmena (para unificar "Biblioteca" con "Agentes").
