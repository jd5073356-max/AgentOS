# Compendio de Capacidades — Modelos por Dominio (para nutrir al Profesor Oak)

> Destilado de 80 ejemplos de alto rendimiento (10 × 8 ejecutores). Dominios:
> **MAT** Matemática · **RAZ** Razonamiento · **ANL** Analítica · **SW** Estructuración de Software ·
> **EJE** Ejecución de Trabajo · **AGT** Potencia mediante Agentes · **HON** Honestidad/Alucinación.
> Oak usa esto para saber **quién es más capaz en qué**.

## Claude Code
- **Opus 4.8** — RAZ/MAT/HON. Depuración crítica, race conditions distribuidas, VaR Montecarlo+SIMD; se abstiene ante banderas obsoletas (honestidad extrema).
- **Opus 4.7** — SW/ANL. Migración monolito→DDD (Bounded Contexts); auditoría de fugas de memoria en logs de 500MB.
- **Sonnet 4.6** — EJE/AGT/SW. Refactor masivo en terminal (TS compiler API); orquesta subagentes paralelos (tests + contenedor PG); boilerplate Clean Architecture (NestJS).
- **Opus 4.6** — EJE/RAZ. Scaffolding FastAPI+Pydantic; transacciones anidadas y niveles de aislamiento SQL.

## Hermes Agent (Vertex)
- **DeepSeek R1** — MAT/RAZ/ANL. Criptografía ECC y canales laterales; teoría de juegos (Nash) en RTB; minería de churn en BigQuery.
- **Grok 4.3** — RAZ/EJE/HON. Detección de redes de bots; reportes ejecutivos sin adornos; aclara cuando no tiene datos auditados (facticidad). ← *cerebro de Oak*
- **Gemini 3.5** — AGT/ANL/SW/EJE. Orquestación multimodal (100h audio→CRM); búsqueda en 1.8M tokens de compliance; ETL Dataflow; metadatos de video.

## Odysseus (local/privado)
- **DeepSeek R1** — MAT/RAZ/HON. ZKP local; árboles de decisión bayesianos offline; se detiene sin tabla impositiva (honestidad).
- **Grok 4.3** — RAZ/ANL/EJE. Guion ramificado consistente; auditoría de biblioteca multimedia local; copys sin clichés.
- **Gemini 3.5** — SW/AGT/ANL/EJE. API offline-first (SQLite/PouchDB); clasificación autónoma de carpeta local; búsqueda en repos locales; transcripción de podcasts.

## OpenCode (terminal · GSD)
- **DeepSeek V4 Flash** — EJE/MAT/ANL. Corrección instantánea de sintaxis Rust; codecs binarios Endian en C; filtrado veloz de logs.
- **Gemini 3.5** — SW/AGT. Microservicios RabbitMQ; consenso de subagentes (seguridad+rendimiento) sobre SQL.
- **Grok 4.3** — RAZ/HON. Diagnóstico de red K8s (traceroute/iptables); frena comandos destructivos peligrosos.
- **DeepSeek R1** — MAT/RAZ/EJE. Árboles KD (vecino más cercano); deadlocks SQL; migraciones por lotes sin bloquear lecturas.

## Kiro (AWS · Spec-Driven)
- **Sonnet 4.5** — SW/EJE/HON/RAZ/ANL. Backend Go según EARS sin extras; persistencia SQLx con retroceso exponencial; frena ante specs contradictorias; reglas de negocio fiscales; detecta mock mal inicializado.
- **GLM 5** — MAT/AGT/SW/EJE/RAZ. Mochila multidimensional (carga marítima); coordina UML+OWASP+spec; pasarelas de pago (factory/adapter); migraciones up/down; máquinas de estado sin transiciones imposibles.

## Command (automatización NL · multi-modelo)
- **Kimi 2.7 / 2.6 / 2.5** — ANL/RAZ/EJE. Licitaciones de miles de páginas; patentes (cifrado homomórfico); manuales de integración extensos.
- **GLM 5.2 / 5.1 / 5** — SW/RAZ/MAT. Orquestación por intención (backup→S3→Slack); COBOL→Go con decimales fijos; ruta crítica CPM.
- **Minimax M3 / M2.7 / M2.5** — HON/EJE/ANL. Simulación de usuarios con EQ; respuestas empáticas; análisis de sentimiento.
- **Mimo v2.5 Pro** — EJE. Limpieza tabular y reportes (ISO 8601, agrupación por región).
- **Qwen 3.6 Max / 3.6 Plus / 3.7 Plus** — MAT/SW/AGT. Ecuaciones diferenciales de red eléctrica; nodo Raft en Rust; orquestador corporativo (PDF→impuestos→stock→SAP).

## Cloudflare (Edge · futuro MCP)
- **GLM 5.2** — EJE/RAZ/HON. Enrutador de tráfico en el Edge; bloqueo dinámico de prompt-injection (WAF); 503 honesto ante caída de BD.
- **DeepSeek V4 Pro** — MAT/ANL/AGT/SW. Cripto post-cuántica en Wasm; telemetría global predictiva; consenso de micro-agentes transoceánico; chat global (Durable Objects).
- **Seedance 2.0** — EJE. Vídeo publicitario con audio nativo en tiempo real.

## NVIDIA (NIMs · GPU) — descartado por cola
- **DeepSeek V4 Pro** — MAT/ANL/RAZ. Kernels CUDA (Tensor Core); data lakes con RAPIDS; macroeconomía en DGX.
- **GLM 5.1** — SW/EJE. Triton (dynamic batching); calibración FP8 sin perder precisión.
- **Nemotron** — AGT/HON/RAZ/MAT. Flotas de robots en Omniverse; NeMo Guardrails (rechaza desactivar seguridad); CFD; PINNs (Navier-Stokes).

## Concepto Movimiento Z (para el panel)
**Z-Move = skill/plugin** que un ejecutor invoca como superpoder temporal. Lógica:
Claude Code (Pokémon) → mega-evoluciona a un agente web → usa el **Z-Move "skills de construcción web"**.
Las skills viven en el directorio de skills de cada ejecutor (`~/.claude/skills`, `~/.hermes/skills`, etc.).
