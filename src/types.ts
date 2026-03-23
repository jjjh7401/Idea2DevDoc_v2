export interface SpecDocs {
  [key: string]: string;
}

export interface HistoryItem {
  id: string;
  idea: string;
  docs: SpecDocs;
  created_at: string;
}

export interface GenerationOptions {
  detailLevel: 'Full' | 'Minimal';
  language: 'ko' | 'en';
  selectedDocs: string[];
}

export const DOC_TYPES = [
  "Agent.md",
  "Skill.md",
  "PRD.md",
  "ARCHITECTURE.md",
  "DIRECTORY_STRUCTURE.md",
  "TECH_STACK.md",
  "TASKS.md",
  "USER_STORIES.md",
  "TEST_SCENARIOS.md",
  "WIREFRAME.md",
  "SYSTEM_BASELINE.md"
];
