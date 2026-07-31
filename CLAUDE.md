# AgentOS — reglas del repo

> **OBLIGATORIO: leer [lessons.md](lessons.md) antes de tocar `server.ts` o `src/App.tsx`.**
> Son 16 lecciones de errores ya cometidos (E2BIG, memoria vs disco, procesos zombie,
> flags de CLIs, EADDRINUSE fantasma…). Repetir uno de esos errores = no leíste el archivo.

## Qué es esto
Centro de operaciones de los agentes IA del ecosistema AETHON. Express + Vite en un solo
proceso (`npm run dev` → tsx server.ts, sirve API + SPA en `127.0.0.1:3000`).
- `server.ts` — toda la API (~2000 líneas): colmena (~/.hive), Pokédex, misiones,
  registry de runners, kanban de Hermes, SSE en vivo.
- `src/App.tsx` — SPA React 19 + Tailwind 4, módulos por `activeModule`.
- Skill de la colmena con el playbook completo: `~/.claude/skills/aethon-agentos-misiones/`.

## Arquitectura de misiones (lo que no es obvio)
- Misión ejecutando → su objeto en `activeMissions` (memoria) es LA fuente de verdad;
  el JSON en `~/.hive/missions/` es snapshot con throttle. Los endpoints que mutan
  misiones activas (guía, abort) mutan el objeto del Map.
- Runners: claude-code/codex reciben el prompt por **stdin**; opencode/kiro por argv
  truncado (MAX_ARG_STRLEN). hermes-agent y odysseus son gateways OpenAI-compatibles
  con streaming SSE. Antigravity NO es ejecutable (sin CLI headless).
- Todo dispatch registra un killer en `missionKillers` — el aborto depende de eso.
- El kanban de Hermes se opera por CLI (`hermes kanban`, SQLite directo) — espejos
  con `--initial-status blocked` para que ningún worker los reclame.

## Verificación mínima antes de declarar terminado
1. `npm run lint` (tsc) limpio y `npm run build` pasa.
2. Reiniciar el server matando al **dueño del puerto** (`ss -tlnp | grep :3000`),
   nunca con `pkill -f` (lessons.md L14).
3. `npm run smoke` — abre la SPA en chromium headless (CDP), clickea los módulos
   y caza excepciones JS. Debe terminar con `"ok": true`. (tsc NO atrapa crashes
   de runtime en JSX; esto sí.)
4. Misión E2E de 1 tarea barata (prompt "responde únicamente X") escrita a mano en
   `~/.hive/missions/` → approve → verificar SSE y estado final → borrar el JSON
   y archivar el task espejo del kanban.

## Reglas del ecosistema
- No exponer .env/keys. El token de acceso viene de `AGENTOS_TOKEN` (fallback hardcoded
  documentado en la colmena).
- Registrar avances en `~/.hive/` (estado.md, proyectos/agentos.md, decisiones.md).
- Si descubres un error de arquitectura nuevo: añadirlo a lessons.md ANTES de arreglar.
