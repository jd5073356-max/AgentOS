# Compendio Maestro — Modelos × Ejecutores (2026)

> Referencia entregada por Juan. Mapea qué **modelo** corre mejor en cada **ejecutor**
> (entorno), porque el mismo modelo se comporta distinto según herramientas, protocolos y
> privacidad del ejecutor. Úsese para decidir el cerebro de cada rol (ej. el Director/Oak).
>
> ⚠️ Reality-check para AETHON: NVIDIA quedó **descartado** (cola free-tier). Confirmar si
> **Command** y **Cloudflare** son ejecutores que Juan realmente tiene o son aspiracionales.

## 1. Claude Code (terminal Anthropic · subagentes paralelos)
- **Opus 4.8** — honestidad extrema, se autocorrige a mitad de ejecución. Mejor: depurar/refactorizar monolitos críticos sin errores invisibles.
- **Opus 4.7** — razonamiento abstracto profundo. Mejor: specs técnicas iniciales y algoritmos complejos no tradicionales.
- **Sonnet 4.6** — caballo de batalla diario; 1M ctx + Computer Use. Mejor: vibe coding guiado, testing E2E, manipular UIs.
- **Opus 4.6** — solidez clásica, estable en directrices largas. Mejor: documentación y mantenimiento de legacy bien delimitado.

## 1b. Antigravity (IDE de Google · Gemini)
- **Gemini 3.5** — contexto masivo (>2M) y multimodal; búsqueda cruzada en repos.
- **Gemini 3.1 Pro** — razonamiento y generación de código de propósito general.
- **Opus 4.6** — razonamiento estructurado estable; documentación y legacy.
- **Sonnet 4.6** — vibe coding, testing E2E y Computer Use (1M ctx).

## 2. Hermes Agent (Vertex · empresarial, nube)
- **DeepSeek R1** — razonamiento lógico riguroso (CoT transparente). Mejor: optimización matemática, análisis de BBDD masivas. Caso: detección de fraude auditable.
- **Grok 4.3** — alta facticidad, EQ alto, info en tiempo real. Mejor: análisis predictivo de mercado, tendencias globales. Caso: inteligencia competitiva. ← *el que usa Oak*
- **Gemini 3.5** — ctx >2M, multimodal nativo. Mejor: "needle in a haystack" en repos documentales masivos. Caso: auditoría corporativa integral.

## 3. Odysseus (self-hosted · privacidad/soberanía local)
- **DeepSeek R1** — razonamiento local sin filtrar secretos. Mejor: diseño lógico de BBDD confidenciales y código bajo NDA.
- **Grok 4.3** — redacción creativa estructurada + EQ. Mejor: guiones, planes de contenido de alta retención, copys con datos locales.
- **Gemini 3.5** — ingesta local multiformato. Mejor: catalogar/etiquetar colecciones de vídeo/audio/gráfico en bruto.

## 4. OpenCode (TUI · "GSD", ejecución directa)
- **DeepSeek V4 Flash** — MoE 284B/13B activos, 1M ctx, ultra-rápido. Mejor: refactor iterativo veloz, scripts al vuelo.
- **Gemini 3.5** — lectura veloz de árboles de archivos. Mejor: hallar discrepancias en monorepos.
- **Grok 4.3** — rigor de sintaxis/consola. Mejor: comandos Docker/K8s, IaC Terraform.
- **DeepSeek R1** — pensamiento sistémico en terminal. Mejor: autocorrección de compilación (Rust/C++) iterando solo.

## 5. Kiro (AWS · Spec-Driven Development, Planner/Executor)
- **Sonnet 4.5** — ejecución ágil y disciplinada siguiendo specs Markdown. Mejor: módulos/controladores que cumplen specs al pie.
- **GLM 5** — lógica de arquitecturas multilingües; specs→código. Mejor: convertir requisitos a esquemas SQL/NoSQL, sintaxis EARS.

## 6. Command (automatización por lenguaje natural · multi-modelo)
- **Kimi 2.7 / 2.6 / 2.5** — retención de contexto masivo / análisis técnico estable / documentación barata.
- **GLM 5.2 / 5.1 / 5** — razonamiento hiper-rápido + JSON (orquestación de APIs) / debugging backend y traducción de lenguajes / Big-O y SQL.
- **Minimax M3 / M2.7 / M2.5** — voz hiperrealista y EQ / conversación de baja latencia / resúmenes ligeros.
- **Mimo v2.5 Pro** — tareas de oficina/tablas; limpieza de datos de leads.
- **Qwen 3.6 Max / 3.6 Plus / 3.7 Plus** — razonamiento bruto + mates / balance coste-velocidad (REST/microservicios) / contextual multilingüe (APIs distribuidas).

## 7. Cloudflare (Workers AI · Edge, baja latencia)
- **GLM 5.2** — Edge rápido, poca memoria. Mejor: traducción de baja latencia, filtrado de API en tiempo real (anti prompt-injection).
- **DeepSeek V4 Pro** — 1.6T (49B activos), 1M ctx, distribuido. Mejor: lógica empresarial global con mínima latencia.
- **Seedance 2.0** (ByteDance) — vídeo multimodal con audio nativo sincronizado. Mejor: vídeo promocional cinematográfico instantáneo.

## 8. NVIDIA (NIMs · GPU dedicada) — ⚠️ descartado en AETHON (cola free-tier)
- **DeepSeek V4 Pro** — TensorRT-LLM, KV cache comprimida. Mejor: analítica masiva concurrente en clúster privado.
- **GLM 5.1** — inferencia FP8/INT4. Mejor: mantenimiento predictivo y control industrial.
- **Nemotron / Llama-3-Nevada** — NeMo Guardrails + Omniverse. Mejor: simulación física y robótica en gemelos digitales.

## 9. Top Global por categoría
| Categoría | Modelo | Ejecutor | Ventaja |
|---|---|---|---|
| Desarrollo crítico | Claude Opus 4.8 | Claude Code | Detecta fallos invisibles de lógica |
| Iteración rápida | DeepSeek V4 Flash | OpenCode | Latencia imperceptible |
| Privacidad creativa | Grok 4.3 | Odysseus | Soberanía local de IP |
| Auditoría documental | Gemini 3.5 | Hermes (Vertex) | Anomalías en millones de registros |
| Producción audiovisual | Seedance 2.0 | Cloudflare | Vídeo cinematográfico + audio, baja latencia |
| Simulación industrial | Nemotron | NVIDIA NIMs | Física en gemelos virtuales |
