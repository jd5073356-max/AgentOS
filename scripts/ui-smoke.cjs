/*
 * Smoke test de UI por CDP — sin dependencias nuevas.
 * Usa el chromium del sistema + el paquete `ws` que ya trae vite.
 *
 * Requiere el server corriendo en :3000. Uso:
 *   npm run smoke
 *
 * Verifica que la SPA monta en un navegador REAL (tsc no atrapa crashes de
 * runtime), clickea Gimnasios/CommandCode/Centro y caza excepciones JS.
 * Nota: los botones del rail son solo-ícono (label en title=) y los headers
 * usan la clase `uppercase` — innerText llega transformado, comparar en lower.
 */
const { spawn } = require("child_process");
const http = require("http");
const os = require("os");
const path = require("path");
const WebSocket = require("ws");

const APP_URL = "http://127.0.0.1:3000/";
const CDP_PORT = 9223;
const jsErrors = [];

function httpJson(method, url) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method }, res => {
      let b = "";
      res.on("data", c => (b += c));
      res.on("end", () => { try { resolve(JSON.parse(b)); } catch { reject(new Error(b.slice(0, 120))); } });
    });
    req.on("error", reject);
    req.end();
  });
}

async function main() {
  const profile = path.join(os.tmpdir(), `agentos-smoke-${Date.now()}`);
  const chrome = spawn("chromium", [
    "--headless=new", "--disable-gpu", "--no-sandbox",
    `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${profile}`, "about:blank"
  ], { stdio: "ignore" });

  try {
    await new Promise(r => setTimeout(r, 3000));
    const target = await httpJson("PUT", `http://127.0.0.1:${CDP_PORT}/json/new?${APP_URL}`);
    const ws = new WebSocket(target.webSocketDebuggerUrl, { perMessageDeflate: false });
    let id = 0;
    const pending = new Map();
    const send = (method, params = {}) => new Promise((resolve) => {
      const mid = ++id;
      pending.set(mid, resolve);
      ws.send(JSON.stringify({ id: mid, method, params }));
    });

    ws.on("message", (raw) => {
      const msg = JSON.parse(raw.toString());
      if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result); pending.delete(msg.id); }
      if (msg.method === "Runtime.exceptionThrown") {
        jsErrors.push(msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text || "excepción");
      }
      if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
        const txt = (msg.params.args || []).map(a => a.value || a.description || "").join(" ");
        if (!/favicon|net::|Failed to load resource/.test(txt)) jsErrors.push("console.error: " + txt.slice(0, 150));
      }
    });

    await new Promise(r => ws.on("open", r));
    await send("Runtime.enable");
    await new Promise(r => setTimeout(r, 4000)); // montar React + fetches iniciales

    const evalJs = async (expr) => {
      const res = await send("Runtime.evaluate", { expression: expr, returnByValue: true });
      return res?.result?.value;
    };
    const clickModule = (label) =>
      evalJs(`(() => { const b = [...document.querySelectorAll('button')].find(x => (x.title || '').includes(${JSON.stringify(label)}) || x.textContent.includes(${JSON.stringify(label)})); if (b) { b.click(); return true; } return false; })()`);

    const results = {};

    results.gimnasiosClick = await clickModule("Gimnasios");
    await new Promise(r => setTimeout(r, 5000)); // registry tarda ~2.6s si Hermes está caído
    results.gimnasios = await evalJs(`(() => {
      const t = document.body.innerText.toLowerCase();
      return {
        lanzador: t.includes("nueva idea"),
        selectorProyecto: !!document.querySelector("select") && t.includes("sin proyecto"),
        franjaEjecutores: t.includes("ejecutores") && t.includes("se reasignan solos"),
        proyectosLocales: [...document.querySelectorAll("select option")].length
      };
    })()`);

    results.commandcodeClick = await clickModule("CommandCode");
    await new Promise(r => setTimeout(r, 1500));
    results.commandcode = await evalJs(`(() => {
      const t = document.body.innerText.toLowerCase();
      return { titulo: t.includes("commandcode"), stats: t.includes("nodos") || t.includes("cargando grafo") || t.includes("no se encontró") };
    })()`);

    results.centroClick = await clickModule("Centro Pokémon");
    await new Promise(r => setTimeout(r, 800));

    const flat = [
      results.gimnasiosClick, results.gimnasios?.lanzador, results.gimnasios?.selectorProyecto,
      results.gimnasios?.franjaEjecutores, results.commandcodeClick, results.commandcode?.titulo,
      results.commandcode?.stats, results.centroClick
    ];
    const ok = flat.every(Boolean) && jsErrors.length === 0;
    console.log(JSON.stringify({ ...results, jsErrors, ok }, null, 2));
    ws.close();
    process.exitCode = ok ? 0 : 1;
  } finally {
    chrome.kill("SIGTERM");
  }
}

main().catch(e => { console.error("smoke falló:", e.message); process.exit(2); });
