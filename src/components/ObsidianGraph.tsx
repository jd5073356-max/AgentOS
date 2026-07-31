import { useState, useEffect } from "react";
import { Project, Agent, DependencyNode } from "../types";
import { Network, RefreshCw, AlertTriangle, ShieldCheck, CheckCircle, Play, Ban, ShieldAlert } from "lucide-react";

interface ObsidianGraphProps {
  project: Project;
  nodes: DependencyNode[];
  agents: Agent[];
  onSelectNode: (node: DependencyNode) => void;
  selectedNodeId: string | null;
}

interface RenderNode {
  id: string;
  label: string;
  type: string;
  color: string;
  glow: string;
  icon: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  status: 'backlog' | 'in_progress' | 'completed' | 'blocked';
  responsibleId?: string;
  risk: 'bajo' | 'medio' | 'alto';
}

interface RenderLink {
  source: string;
  target: string;
}

export default function ObsidianGraph({ project, nodes, agents, onSelectNode, selectedNodeId }: ObsidianGraphProps) {
  const [renderNodes, setRenderNodes] = useState<RenderNode[]>([]);
  const [renderLinks, setRenderLinks] = useState<RenderLink[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Layout positioning and physics setup
  useEffect(() => {
    if (!nodes || nodes.length === 0) return;

    const width = 600;
    const height = 400;
    const cx = width / 2;
    const cy = height / 2;

    // We will place nodes in layers to represent the hierarchy beautifully:
    // Layer 0: Meta (Top)
    // Layer 1: Proyecto (Upper Middle)
    // Layer 2: Arquitectura (Center)
    // Layer 3: Backend & Database (Lower Middle)
    // Layer 4: Testing (Bottom)
    
    const calculatedNodes: RenderNode[] = nodes.map((node, i) => {
      let x = cx;
      let y = cy;
      let size = 20;
      let color = "#8b5cf6"; // default purple
      let glow = "rgba(139, 92, 246, 0.4)";
      let icon = "⚙️";

      // Calculate level based on node type
      if (node.type === 'meta') {
        x = cx;
        y = 50;
        size = 22;
        color = "#10b981"; // emerald
        glow = "rgba(16, 185, 129, 0.4)";
        icon = "🎯";
      } else if (node.type === 'project') {
        x = cx;
        y = 120;
        size = 26;
        color = "#3b82f6"; // blue
        glow = "rgba(59, 130, 246, 0.4)";
        icon = "🚀";
      } else if (node.type === 'architecture') {
        x = cx - 80;
        y = 200;
        size = 18;
        color = "#6366f1"; // indigo
        glow = "rgba(99, 102, 241, 0.4)";
        icon = "🧠";
      } else if (node.type === 'backend') {
        x = cx + 80;
        y = 200;
        size = 18;
        color = "#a855f7"; // purple
        glow = "rgba(168, 85, 247, 0.4)";
        icon = "⚡";
      } else if (node.type === 'database') {
        x = cx - 100;
        y = 290;
        size = 18;
        color = "#f59e0b"; // amber
        glow = "rgba(245, 158, 11, 0.4)";
        icon = "💾";
      } else if (node.type === 'testing') {
        x = cx + 100;
        y = 290;
        size = 18;
        color = "#f43f5e"; // rose
        glow = "rgba(244, 63, 94, 0.4)";
        icon = "🕵️";
      }

      // Slightly perturb positions so they float organically
      const offsetAngle = (i / nodes.length) * Math.PI * 2;
      x += Math.cos(offsetAngle) * 15;
      y += Math.sin(offsetAngle) * 15;

      return {
        id: node.id,
        label: node.label,
        type: node.type,
        color,
        glow,
        icon,
        x,
        y,
        vx: 0,
        vy: 0,
        size,
        status: node.status,
        responsibleId: node.responsibleId,
        risk: node.risk
      };
    });

    // Generate links based on node dependencies
    const calculatedLinks: RenderLink[] = [];
    nodes.forEach(node => {
      if (node.dependencies && node.dependencies.length > 0) {
        node.dependencies.forEach(depId => {
          // Add a link from dependency to target
          calculatedLinks.push({
            source: depId,
            target: node.id
          });
        });
      }
    });

    setRenderNodes(calculatedNodes);
    setRenderLinks(calculatedLinks);
  }, [nodes]);

  // Gentle physical force simulation loop for a high-end "organic glowing" feel
  useEffect(() => {
    if (renderNodes.length === 0) return;

    let animationFrameId: number;

    const tick = () => {
      setRenderNodes(prev => {
        // Apply tiny attractive/repulsive forces to let them float organically
        const nodesCopy = prev.map(n => ({ ...n }));

        // Attraction to home positions
        const width = 600;
        const height = 400;
        const cx = width / 2;
        const cy = height / 2;

        nodesCopy.forEach((node, i) => {
          let homeX = cx;
          let homeY = cy;

          if (node.type === 'meta') { homeX = cx; homeY = 60; }
          else if (node.type === 'project') { homeX = cx; homeY = 130; }
          else if (node.type === 'architecture') { homeX = cx - 110; homeY = 210; }
          else if (node.type === 'backend') { homeX = cx + 110; homeY = 210; }
          else if (node.type === 'database') { homeX = cx - 90; homeY = 310; }
          else if (node.type === 'testing') { homeX = cx + 90; homeY = 310; }

          // Pull towards home
          node.vx += (homeX - node.x) * 0.008;
          node.vy += (homeY - node.y) * 0.008;

          // Repulsion from other nodes to prevent overlaps
          for (let j = 0; j < nodesCopy.length; j++) {
            if (i === j) continue;
            const other = nodesCopy[j];
            const dx = node.x - other.x;
            const dy = node.y - other.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const minDist = 75; // separation padding

            if (dist < minDist) {
              const force = (minDist - dist) * 0.02;
              node.vx += (dx / dist) * force;
              node.vy += (dy / dist) * force;
            }
          }

          // Friction
          node.vx *= 0.88;
          node.vy *= 0.88;

          // Update position
          node.x += node.vx;
          node.y += node.vy;

          // Constrain within bounds
          node.x = Math.max(30, Math.min(width - 30, node.x));
          node.y = Math.max(30, Math.min(height - 30, node.y));
        });

        return nodesCopy;
      });

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [renderNodes.length]);

  return (
    <div id="obsidian-graph-container" className="relative bg-zinc-950 rounded border border-zinc-900 p-4 shadow-2xl overflow-hidden group">
      {/* Graph Header */}
      <div className="flex items-center justify-between mb-3 border-b border-zinc-900 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-zinc-900 rounded border border-zinc-800 text-zinc-400">
            <Network className="w-4 h-4 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-100 tracking-wider uppercase font-mono">
              Mapa de Dependencias del Proyecto
            </h3>
            <p className="text-[10px] text-zinc-500 font-mono">
              Ruta crítica de agentes: Meta → Proyecto → Arquitectura → Backend → DB → QA
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] bg-zinc-900/50 border border-zinc-800 text-zinc-400 px-2.5 py-0.5 rounded font-mono">
          <RefreshCw className="w-3 h-3 animate-spin text-zinc-600" />
          SINC_OPERATIVA
        </div>
      </div>

      {/* Main SVG Stage */}
      <div className="relative w-full h-[360px] bg-black rounded overflow-hidden border border-zinc-900 flex items-center justify-center">
        {/* Animated Cybergrid Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-25"></div>

        <svg
          viewBox="0 0 600 400"
          className="w-full h-full cursor-grab active:cursor-grabbing select-none relative z-10"
        >
          {/* Render Connection Links with flowing energy dashes */}
          {renderLinks.map((link, idx) => {
            const sourceNode = renderNodes.find(n => n.id === link.source);
            const targetNode = renderNodes.find(n => n.id === link.target);

            if (!sourceNode || !targetNode) return null;

            const isHighlighted = hoveredNode === link.source || hoveredNode === link.target;

            return (
              <g key={`link-${idx}`}>
                {/* Glow under-path */}
                <line
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke={isHighlighted ? "rgba(139, 92, 246, 0.4)" : "rgba(39, 39, 42, 0.5)"}
                  strokeWidth={isHighlighted ? 3 : 1.5}
                  className="transition-all duration-300"
                />
                {/* Flowing energy points */}
                <line
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke={isHighlighted ? "#8b5cf6" : "#27272a"}
                  strokeWidth={isHighlighted ? 1.5 : 1}
                  strokeDasharray="6 8"
                  className="animate-[dash_20s_linear_infinite]"
                  style={{
                    strokeDashoffset: idx * 5
                  }}
                />
              </g>
            );
          })}

          {/* Render Nodes */}
          {renderNodes.map((node) => {
            const isHovered = hoveredNode === node.id;
            const isSelected = selectedNodeId === node.id;
            const responsibleAgent = node.responsibleId ? agents.find(a => a.id === node.responsibleId) : null;

            // Compute border colors and status badge overlay
            let statusStroke = "#3f3f46";
            if (node.status === "completed") statusStroke = "#10b981"; // Emerald
            else if (node.status === "in_progress") statusStroke = "#eab308"; // Amber
            else if (node.status === "blocked") statusStroke = "#f43f5e"; // Rose

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => {
                  const rawNode = nodes.find(n => n.id === node.id);
                  if (rawNode) onSelectNode(rawNode);
                }}
                className="cursor-pointer group"
              >
                {/* Outer pulsing glow ring */}
                <circle
                  r={node.size + 8}
                  fill="transparent"
                  stroke={isSelected ? node.color : "transparent"}
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  className="animate-[spin_10s_linear_infinite] opacity-60"
                />

                {/* Main Node Circle */}
                <circle
                  r={node.size}
                  fill="#09090b"
                  stroke={isSelected ? node.color : statusStroke}
                  strokeWidth={isSelected ? 3 : 2}
                  className="transition-all duration-300 group-hover:stroke-white shadow-[0_0_15px_rgba(0,0,0,0.8)]"
                />

                {/* Outer halo background */}
                <circle
                  r={node.size - 2}
                  fill={isHovered ? "rgba(255,255,255,0.05)" : "transparent"}
                  className="transition-all duration-200"
                />

                {/* Node Emoji/Icon */}
                <text
                  textAnchor="middle"
                  dy=".3em"
                  fontSize={node.size - 4}
                  className="select-none pointer-events-none"
                >
                  {node.icon}
                </text>

                {/* Status Indicator Dot on top-right */}
                <circle
                  cx={node.size - 4}
                  cy={-node.size + 4}
                  r={4.5}
                  fill={
                    node.status === 'completed' ? "#10b981" :
                    node.status === 'in_progress' ? "#eab308" :
                    node.status === 'blocked' ? "#f43f5e" : "#52525b"
                  }
                  stroke="#09090b"
                  strokeWidth={1.5}
                />

                {/* Node Label Text */}
                <g transform={`translate(0, ${node.size + 14})`}>
                  {/* Subtle black backing rectangle for high contrast */}
                  <rect
                    x={-55}
                    y={-8}
                    width={110}
                    height={15}
                    fill="rgba(0,0,0,0.8)"
                    rx={3}
                    className="opacity-90 border border-zinc-900"
                  />
                  <text
                    textAnchor="middle"
                    fill={isSelected ? "#ffffff" : isHovered ? "#e4e4e7" : "#a1a1aa"}
                    fontSize="9px"
                    fontWeight={isSelected ? "bold" : "normal"}
                    className="font-mono uppercase tracking-tight pointer-events-none"
                  >
                    {node.label.length > 18 ? node.label.substring(0, 15) + "..." : node.label}
                  </text>
                </g>

                {/* Small responsible badge subtext */}
                {responsibleAgent && (
                  <g transform={`translate(0, ${node.size + 24})`}>
                    <text
                      textAnchor="middle"
                      fill="#71717a"
                      fontSize="7px"
                      className="font-mono pointer-events-none"
                    >
                      @{responsibleAgent.name}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Legend Overlay */}
        <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-x-3 gap-y-1 bg-zinc-950/95 border border-zinc-900 px-3 py-1.5 rounded text-[8px] font-mono text-zinc-500 shadow-xl backdrop-blur-sm select-none z-20">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span> COMPLETADO
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full inline-block"></span> EN PROGRESO
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full inline-block"></span> BLOQUEADO
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-zinc-650 rounded-full inline-block"></span> BACKLOG
          </div>
          <div className="ml-auto text-[7px] text-zinc-600 uppercase">
            Haga clic en un nodo para auditar
          </div>
        </div>
      </div>
    </div>
  );
}
