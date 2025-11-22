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

// Updated to support grounded search responses (Markdown + Citations)
export interface AnalysisResponse {
  markdown: string;
  groundingChunks?: Array<{
    web?: {
      uri?: string;
      title?: string;
    };
  }>;
}