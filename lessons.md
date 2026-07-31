# lessons.md — Loop de Autocorrección de AgentOS

> Registro vivo de errores de lógica/arquitectura descubiertos y cómo se corrigieron.
> **Leer este archivo ANTES de tocar `server.ts` o `src/App.tsx`.** Cada lección tiene
> fecha, el error, la causa raíz y la regla para no repetirlo.

---

## L1 — Dos fuentes de verdad para una misión en ejecución (2026-07-13)
**Error:** el endpoint de guía (`POST /api/mission/:id/guide`) leía la misión de disco,
la mutaba y la escribía — mientras `executeMission` trabajaba con SU PROPIO objeto en
memoria y lo flusheaba con throttle. La guía nunca llegaba a las tareas en curso y el
siguiente flush del executor la borraba del disco.
**Causa raíz:** estado mutable duplicado (memoria + disco) sin dueño claro.
**Regla:** mientras una misión ejecuta, su objeto en memoria es la ÚNICA fuente de
verdad (`activeMissions: Map<string, Mission>`); el disco es solo snapshot. Cualquier
endpoint que mute una misión activa debe mutar el objeto del Map, no el de disco.

## L2 — Timeout que rechaza la promesa pero no mata el proceso (2026-07-02)
**Error:** el dispatcher viejo usaba `setTimeout(() => reject(...))` sobre `execFile`
sin matar el child process → CLIs zombie consumiendo CPU/tokens tras el "timeout", y
el reintento lanzaba OTRO proceso encima.
**Regla:** todo timeout de proceso debe hacer `child.kill("SIGTERM")` + `SIGKILL` de
respaldo a los 5s (ver `spawnStreaming`). Nunca rechazar sin matar.

## L3 — E2BIG: prompts enriquecidos por argv (2026-07-13)
**Error:** el prompt del validador concatenaba plan + outputs de TODOS los especialistas
(hasta 4 MB) y se pasaba como UN argumento de argv. Linux limita cada string de argv a
~128 KB (`MAX_ARG_STRLEN`) → el validador fallaba SIEMPRE en misiones productivas.
**Regla:** prompts grandes van por **stdin** (Claude lo soporta con `-p`); para CLIs
que solo aceptan argv, truncar con `capText(prompt, MAX_ARGV_PROMPT)`. Los outputs
intermedios inyectados se acotan (24 KB plan / 16 KB por especialista).

## L4 — Misión atascada en "executing" para siempre (2026-07-13)
**Error:** `executeMission` no tenía try/catch propio; si `writeMission`/`firmar`
lanzaban después de poner `phase="executing"`, la misión quedaba inertemente en esa
fase: `/approve` y `/validate` la rechazaban y no había recovery.
**Regla:** (1) el orquestador SIEMPRE termina en un estado final (`try/catch` → failed);
(2) al arrancar el servidor, `reconcileStuckMissions()` marca failed lo que quedó en
executing/planning (los procesos ya murieron con el reinicio); (3) si TODAS las tareas
fallaron, la misión es `failed`, no `awaiting_validation` — no se le pide a Juan validar
un resultado hecho de mensajes de error.

## L5 — "Los agentes no aparecen como utilizables" (2026-07-13)
**Error:** Oak asignaba runners (claude-code/opencode/kiro/codex/hermes) sin verificar
que el binario existiera o que el gateway de Hermes estuviera vivo → tareas nacían
condenadas a fallar 3 intentos y la misión parecía "caja negra rota".
**Causa raíz:** el mapeo agente→runner era estático; la disponibilidad es dinámica.
**Regla:** `getRunnerRegistry()` verifica disponibilidad REAL (fs.access al binario,
/health del gateway) y `POST /api/mission` reasigna tareas de runners caídos al primer
fallback disponible ANTES de pedir aprobación, marcándolo en `task.reassignedFrom`
para que la UI lo muestre. Un agente que no puede ejecutarse nunca llega al equipo.

## L6 — Streaming: `stream-json` de Claude necesita parser de líneas (2026-07-02)
**Error:** asumir que el stdout de `claude -p --output-format stream-json` se puede
mostrar crudo. Son NDJSON events; mostrados tal cual son ruido.
**Regla:** parsear línea a línea con buffer (`makeClaudeStreamParser`): eventos
`assistant` → texto incremental para la UI; evento `result` → output final. Si una
línea no parsea como JSON, tratarla como texto plano (fallback, nunca crash).
`--output-format stream-json` requiere `--verbose`.

## L7 — useEffect de SSE con dependencias inestables (2026-07-13)
**Error (evitado):** `refreshActiveMission` dependía del objeto `activeMission` entero,
que cambia de identidad en cada poll → un `useEffect` de EventSource que dependa de él
se reconectaría cada 3 segundos.
**Regla:** los callbacks/efectos de misión dependen de primitivos estables
(`activeMission?.id`, `activeMission?.phase`), nunca del objeto completo.

## L8 — Endpoints muertos con destructuring sin guard (2026-07-13)
**Error:** los 4 endpoints Gemini del scaffold (strategic/analyze, agent/chat,
discuss-task, code-review) simulaban agentes ficticios (Sara/Lucas/…), el frontend no
los llamaba, y `const { x } = req.body` sin guard tumbaba el proceso con un POST sin
Content-Type. Se eliminaron (~500 líneas).
**Regla:** todo handler usa `req.body || {}`; los endpoints que ningún cliente llama
se borran, no se mantienen "por si acaso". La conversación real con agentes es el
chat de guía de misiones, no simulaciones.

## L9 — IDs con `Date.now()` colisionan; ids de URL van al filesystem (2026-07-13)
**Error:** `mission-${Date.now()}` — doble click = misma misión sobreescrita. Además
`readMission(req.params.id)` concatenaba el id crudo al path (`..%2F` = path traversal).
**Regla:** ids con sufijo aleatorio (`Date.now()`+`Math.random().toString(36)`) y
validación `MISSION_ID_RE` antes de tocar el filesystem.

## L10 — Contexto de proyecto = cwd + prompt, no solo prompt (2026-07-13)
**Error original:** las misiones "de proyecto" corrían en el directorio del servidor;
los agentes alucinaban la estructura del proyecto porque no podían verla.
**Regla:** el Project Workspace se implementa con DOS piezas: (1) `cwd` real del spawn
= raíz del proyecto (`mission.project.path`, validado contra `~/proyectos` sin
traversal), y (2) bloque `PROYECTO:` en el prompt que le dice al agente que su cwd ya
es el proyecto y que explore archivos reales. Claude además recibe
`--permission-mode acceptEdits` solo cuando hay cwd de proyecto.

## L11 — Los flags de los CLIs cambian entre versiones: verificar con --help (2026-07-14)
**Error:** el dispatcher original usaba `opencode run --format json` — ese flag YA NO existe
en la versión instalada (el runner fallaba silenciosamente). Y `codex exec` resultó aceptar
el prompt por **stdin** (`-`), mejor que argv truncado.
**Regla:** antes de cablear (o tocar) un runner, correr `<cli> <subcomando> --help` en el
sistema real y validar cada flag. Codex: `exec --skip-git-repo-check -` + stdin;
`-s workspace-write` solo con proyecto (paridad con acceptEdits de claude).

## L12 — En este tsconfig, Object.values devuelve unknown[] (2026-07-14)
**Error:** `Object.values(record).map(r => r.id)` falla con TS2339 "on type 'unknown'" en
App.tsx aunque el record esté bien tipado — rareza del tsconfig del scaffold (reproducida
con un probe mínimo; en un tsconfig por defecto NO pasa).
**Regla:** en este repo, castear: `(Object.values(x) as T[]).map(...)`. No perder tiempo
re-tipando el estado: el problema es del entorno de compilación, no de la declaración.

## L13 — Abortar ≠ rechazar la promesa: un proceso matado puede "resolver" (2026-07-14)
**Error:** al abortar, el SIGTERM hacía que `spawnStreaming` resolviera con el stdout
parcial (había output → `resolve`), y `runTask` marcaba la tarea como `done` con basura.
**Regla:** el flag de aborto manda sobre CUALQUIER resultado: verificarlo antes del
dispatch, en el catch, Y después de que el dispatch resuelva. Patrón killers:
cada dispatch registra su función de kill en `missionKillers`; abortar = dispararlas
todas + marcar `abortedMissions` para frenar los reintentos.

## L14 — pkill -f se mata a sí mismo; matar por dueño real del puerto (2026-07-14)
**Error:** `pkill -f "tsx server.ts"` mató mi propio shell (el patrón coincide con la
línea de comandos que lo contiene). Y matar solo el wrapper de tsx deja vivo al hijo
que posee el puerto → el server "reiniciado" muere con EADDRINUSE y sigue corriendo
el código viejo (los endpoints nuevos dan 404 fantasma).
**Regla:** para reiniciar: (1) obtener el PID dueño del puerto con
`ss -tlnp | grep :3000`, (2) matar ESE pid, (3) patrones pgrep con truco de corchetes
(`"[s]erver.ts"`) para no auto-coincidir, (4) confirmar puerto libre antes de arrancar.

## L15 — Fase 3 desbloqueada: el kanban de Hermes no necesita puerto/auth (2026-07-14)
**Hallazgo:** el pendiente "confirmar puerto/auth de la API del kanban" era innecesario:
`hermes kanban <create|comment|complete|show|archive>` escribe DIRECTO a
`~/.hermes/kanban.db` (SQLite) sin gateway. (La API HTTP existe pero es un plugin del
dashboard `hermes dashboard` en :9119 con `X-Hermes-Session-Token` — no hace falta.)
**Regla:** crear los espejos con `--initial-status blocked` — un task `ready` podría
ser RECLAMADO por un worker de Hermes y ejecutar la misión por segunda vez.

## L16 — bestRunner() asignaba runners que el dispatcher no conocía (2026-07-14)
**Error:** `bestRunner()` itera TODOS los ejecutores de `EXECUTOR_MODELS` (incluidos
`odysseus` y `antigravity`), pero `dispatchToRunner` no tenía rama para ellos →
"Runner desconocido" tras 3 intentos. Y el registry tampoco los conocía, así que la
reasignación no los tocaba (`registry[t.runner]` undefined → skip). Doble agujero.
**Regla:** todo id presente en `EXECUTOR_MODELS`/asignable por Oak debe (a) tener rama
en `dispatchToRunner` O (b) existir en el registry con `available:false` para que se
reasigne. Fix aplicado: odysseus = runner real (bridge OpenAI-compatible en
`172.17.0.1:9001`, interfaz docker — NO localhost; modelo `google/gemini-3.5-flash`;
sin filesystem, se le avisa en el prompt); antigravity = `available:false` permanente.

## L17 — lsof -i :PORT da falso "ya está corriendo" tras un kill (2026-07-14)
**Error:** el lanzador `agentos` chequeaba el puerto con `lsof -i :3000`, que también
matchea conexiones TIME_WAIT/CLOSE_WAIT de requests recién cerradas — tras
`agentos restart`, el kill liberaba el LISTEN pero lsof seguía viendo sockets
residuales → "ya está corriendo" → no arrancaba nada → puerto muerto.
**Regla:** para detectar un servidor, chequear SOLO estado LISTEN con match exacto:
`ss -tln | awk '{print $4}' | grep -qE "[:.]3000$"`. Nunca lsof/grep laxos.

## L18 — "available:true" en el registry no garantiza que el CLI responda (2026-07-30)
**Hallazgo (no arreglado, fuera de alcance de la tarea que lo encontró):** al probar el
verificador independiente (ver abajo), el runner `opencode` falló 3/3 intentos en runtime
con "Unexpected server error" — pero `getRunnerRegistry()` lo reportaba `available:true`
porque para runners tipo `cli` solo hace `fs.access(bin)` (el binario existe). Solo los
runners tipo `gateway` (hermes-agent, odysseus) se verifican de verdad con un `/health`.
**Regla (pendiente de aplicar):** si se repite, considerar una probada liviana real para
runners CLI (ej. `<bin> --version` con timeout corto) antes de asignarlos, no solo
`fs.access`. No se implementó ahora porque no era el objetivo de la tarea en curso.

## L19 — Verificador independiente en el pipeline (2026-07-30)
**Qué se añadió:** `runVerifier()` — un nodo extra, después del pipeline fijo
(coordinador→especialistas∥→validador) y antes de `awaiting_validation`, que reutiliza
`runTask` para lanzar un escéptico con contexto fresco sobre el resultado consolidado.
Nunca el mismo runner que ya se usó en la misión cuando hay otro disponible (regla del
graph engineering: "nunca dejes que un agente corrija su propio examen" —
`.hive/conocimiento/graph-engineering.md`, Bloque 3 #9).
**Regla:** el verificador es SIEMPRE informativo — su output se anexa a `mission.result`,
nunca cambia `mission.phase` ni bloquea la misión. Si su runner falla, se anota el error y
la misión sigue a `awaiting_validation` igual (consistente con L4: nunca atascar la misión).
Verificado E2E con dos misiones reales de 1 tarea (una con el verificador fallando por L18,
otra con el verificador detectando un problema real de formato en el output de `kiro`).
`ss -tln | awk '{print $4}' | grep -qE "[:.]3000$"`. Nunca lsof/grep laxos.

## L20 — Loop-until-dry: plantilla original de especialista queda "pending" para siempre (2026-07-30)
**Error:** al añadir el modo descubrimiento (`mission.discovery`, `runDiscoveryRounds()`),
las tareas especialista de la ronda se clonan (`task-1-r1`, `task-1-r2`...) pero la tarea
PLANTILLA original (`task-1`) nunca se ejecuta directo — se queda en `status:"pending"` para
siempre aunque la misión ya haya llegado a `awaiting_validation`. Esto además corrompía
`allDone = mission.tasks.every(t => t.status === "done")` en `executeMission` (nunca era
`true` con descubrimiento activo, aunque todo el trabajo real hubiera terminado bien).
**Regla:** cuando una tarea plantilla se reemplaza por N clones ejecutados (rondas, o
cualquier patrón de fan-out dinámico futuro), la plantilla original debe marcarse `done`
con una nota que apunte a sus clones — nunca dejarla en un estado que no sea terminal.
**Contexto — modo descubrimiento (loop-until-dry):** `mission.discovery: {maxRounds,
maxDryStreak}` (clamps duros: maxRounds∈[1,8], maxDryStreak∈[1,4], ver `POST /api/mission`).
`runDiscoveryRounds()` relanza los especialistas en rondas, cada una viendo TODO lo
encontrado en rondas anteriores (no solo lo confirmado — el error clásico del patrón que
haría reaparecer hallazgos ya vistos) vía un corpus acumulado en el prompt, y cada tarea
debe terminar con una línea `"NUEVOS: <n>"` que el código parsea con regex para decidir si
la ronda fue seca. Si no parsea, se asume conservador que SÍ hubo algo nuevo (nunca cortar
el loop por una respuesta con formato raro — el tope de rondas ya acota el costo). El
validador final corre UNA sola vez sobre el acumulado de todas las rondas (no se repite el
coordinador ni el validador por ronda — solo los especialistas/buscadores).
Verificado E2E con una misión real de 3 tareas + descubrimiento (buscar "colores primarios"
en rondas): ronda 1 encontró los 3 colores (`NUEVOS: 3`), ronda 2 correctamente reportó
`NUEVOS: 0` y el loop se detuvo ahí (`maxDryStreak:1`) sin gastar las rondas 3-4 del tope.

---

### Proceso (el loop)
1. **Generar** el cambio mínimo que resuelve el hito.
2. **Criticar** simulando ejecución: ¿tipos?, ¿estado perdido entre llamadas?,
   ¿bloqueos sin reporte al usuario?, ¿procesos huérfanos?
3. **Registrar** aquí la lección si hubo error de lógica/arquitectura.
4. `npx tsc --noEmit` + curl a los endpoints tocados antes de declarar terminado.
