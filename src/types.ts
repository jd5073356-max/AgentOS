/**
 * Types for AgentOS - Centro de Operaciones de Agentes IA
 */

export interface Agent {
  id: string;
  name: string;
  specialty: string;
  description: string;
  avatar: string; // Emoji
  color: string; // Tailwind tint class name
  status: 'available' | 'working' | 'thinking' | 'blocked';
  vibe: string;
  tools: string[];
  experience: string; // e.g., "Sénior", "Experto", "Principal"
  projectsCount: number;
  performanceMetric: number; // e.g., 98
  recentActivity: string;
  area?: 'Desarrollo' | 'Contenido' | 'Marketing' | 'Negocios' | 'Educación' | 'Finanzas' | 'Automatización';
  strengths?: string[];
  weaknesses?: string[];
  avgTime?: string;
  modelsUsed?: string[];
}

export interface GlobalGoal {
  id: string;
  title: string; // e.g., "Generar 5,000 USD mensuales"
  targetValue: string;
  progress: number; // e.g., 65
  relatedProjects: string[]; // List of project names or IDs
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'strategic_planning' | 'team_assembling' | 'active' | 'completed';
  globalGoalId: string;
  team: string[]; // List of agent IDs
  blockers: string[];
  nextSteps: string[];
}

export interface VisualProgressCard {
  id: string;
  projectId: string;
  agentId: string;
  action: string; // e.g., "Diseñé la arquitectura inicial"
  explanation: string;
  evidenceType: 'diagram' | 'code' | 'schema' | 'report';
  evidenceData: {
    title?: string;
    code?: string;
    language?: string;
    details?: string;
    diagramType?: 'flow' | 'radial' | 'grid';
  };
  timestamp: string;
}

export interface TimelineEvent {
  id: string;
  projectId: string;
  time: string;
  title: string;
  description: string;
  agentId?: string;
}

export interface DependencyNode {
  id: string;
  label: string;
  type: 'meta' | 'project' | 'architecture' | 'backend' | 'database' | 'testing';
  responsibleId?: string;
  status: 'backlog' | 'in_progress' | 'completed' | 'blocked';
  dependencies: string[]; // IDs of node dependencies
  risk: 'bajo' | 'medio' | 'alto';
}

export interface ChatMessage {
  id: string;
  senderId: 'user' | 'system' | string; // 'user', 'system', or agent id
  senderName: string;
  senderAvatar: string;
  senderColor: string;
  text: string;
  timestamp: string;
  isSystem?: boolean;
  mentionedAgentId?: string;
  codeBlock?: {
    language: string;
    code: string;
  };
}

export interface AgentReport {
  agentId: string;
  summary: string;
  achievements: string[];
  issues: string[];
  recommendations: string[];
}
