export interface ModelData {
  name: string;
  provider: string;
  releaseDate: string;
  // Benchmarks
  humanEval: number;      // EvalPlus/HumanEval Pass@1
  sweBench: number;       // SWE-bench Verified
  liveCodeBench: number;  // LiveCodeBench (Pass@1)
  
  contextWindow: string;
  inputPrice: string;     // Normalized to $/1M tokens for easier comparison
  outputPrice: string;    // Normalized to $/1M tokens
  strengths: string[];
  color: string;
  isOpenSource?: boolean; // New field for dynamic filtering
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export enum Tab {
  LEADERBOARD = 'LEADERBOARD',
  PLAYGROUND = 'PLAYGROUND',
  ANALYSIS = 'ANALYSIS',
}

// New Structured Analysis Interface
export interface AnalysisReport {
  executive_summary: string;
  top_models: Array<{
    model_name: string;
    rank: number;
    primary_advantage: string;
    recommended_for: string[]; // e.g. "Backend API", "Data Science"
    compatible_tools: string[]; // e.g. "Cursor", "Continue.dev"
  }>;
  scenario_matrix: Array<{
    scenario: string; // e.g. "Local Deployment on Consumer Hardware"
    suggested_model: string;
    reasoning: string;
  }>;
}

export interface AnalysisResponse {
  report?: AnalysisReport;
  // Fallback for raw markdown if JSON parsing fails
  markdown?: string;
  groundingChunks?: Array<{
    web?: {
      uri?: string;
      title?: string;
    };
  }>;
}