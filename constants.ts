import { ModelData } from './types';

// FALLBACK DATA: Used if the live web search fails or API is unavailable.
// Updated Feb 2025 baseline.

export const FALLBACK_MODELS: ModelData[] = [
  {
    name: 'DeepSeek R1',
    provider: 'DeepSeek',
    releaseDate: '2025-01',
    humanEval: 96.3,
    sweBench: 79.2, 
    liveCodeBench: 69.8,
    contextWindow: '128K',
    inputPrice: '$0.55', 
    outputPrice: '$2.19',
    strengths: ['#1 Reasoning', 'Open Weights', 'Chain of Thought'],
    color: '#6366f1',
    isOpenSource: true
  },
  {
    name: 'Claude 3.7 Sonnet',
    provider: 'Anthropic',
    releaseDate: '2025-02',
    humanEval: 95.8,
    sweBench: 74.5, 
    liveCodeBench: 67.2,
    contextWindow: '200K',
    inputPrice: '$3.00',
    outputPrice: '$15.00',
    strengths: ['Hybrid Reasoning', 'Best Coding UX', 'Thinking Mode'],
    color: '#d97706',
    isOpenSource: false
  },
  {
    name: 'OpenAI o3-mini',
    provider: 'OpenAI',
    releaseDate: '2025-01',
    humanEval: 95.0,
    sweBench: 71.5,
    liveCodeBench: 66.1,
    contextWindow: '128K',
    inputPrice: '$1.10',
    outputPrice: '$4.40',
    strengths: ['Fast Reasoning', 'STEM Expert', 'Efficiency'],
    color: '#10a37f',
    isOpenSource: false
  },
  {
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    releaseDate: '2025-Preview',
    humanEval: 94.2,
    sweBench: 64.8,
    liveCodeBench: 62.5,
    contextWindow: '1M',
    inputPrice: '$0.10',
    outputPrice: '$0.40',
    strengths: ['Context Window', 'Multimodal', 'Speed'],
    color: '#3b82f6',
    isOpenSource: false
  },
  {
    name: 'Qwen 2.5-Max',
    provider: 'Alibaba Cloud',
    releaseDate: '2024-12',
    humanEval: 93.5,
    sweBench: 61.5,
    liveCodeBench: 58.4,
    contextWindow: '128K',
    inputPrice: '$2.50', 
    outputPrice: '$10.00',
    strengths: ['Top Chinese Model', 'Balanced Performance'],
    color: '#0ea5e9',
    isOpenSource: false // Commercial API usually
  },
  {
    name: 'Qwen 2.5 Coder 32B',
    provider: 'Alibaba Cloud',
    releaseDate: '2024-11',
    humanEval: 91.5,
    sweBench: 55.5,
    liveCodeBench: 50.4,
    contextWindow: '128K',
    inputPrice: 'Open',
    outputPrice: 'Open',
    strengths: ['Best Small Model', 'Local Coding'],
    color: '#38bdf8',
    isOpenSource: true
  },
  {
    name: 'Grok 3',
    provider: 'xAI',
    releaseDate: '2025-02',
    humanEval: 93.0,
    sweBench: 60.2,
    liveCodeBench: 59.8,
    contextWindow: '128K',
    inputPrice: 'TBD',
    outputPrice: 'TBD',
    strengths: ['Real-time Data', 'Strong Logic'],
    color: '#FFFFFF',
    isOpenSource: false
  },
  {
    name: 'GPT-4o',
    provider: 'OpenAI',
    releaseDate: '2024-05',
    humanEval: 90.2,
    sweBench: 43.2,
    liveCodeBench: 43.5,
    contextWindow: '128K',
    inputPrice: '$2.50',
    outputPrice: '$10.00',
    strengths: ['Tool Calling', 'Reliability', 'Speed'],
    color: '#10b981',
    isOpenSource: false
  },
  {
    name: 'DeepSeek-V3',
    provider: 'DeepSeek',
    releaseDate: '2024-12',
    humanEval: 90.5,
    sweBench: 48.2,
    liveCodeBench: 45.8,
    contextWindow: '64K',
    inputPrice: '$0.14',
    outputPrice: '$0.28',
    strengths: ['Price/Perf King', 'Efficiency'],
    color: '#818cf8',
    isOpenSource: true
  },
  {
    name: 'Llama 3.1 405B',
    provider: 'Meta',
    releaseDate: '2024-07',
    humanEval: 89.0,
    sweBench: 38.5,
    liveCodeBench: 40.1,
    contextWindow: '128K',
    inputPrice: 'Open',
    outputPrice: 'Open',
    strengths: ['Open Source Flagship', 'General Knowledge'],
    color: '#0668E1',
    isOpenSource: true
  }
];

export const DEFAULT_PROMPT = `Write a Python script using 'pandas' and 'scikit-learn' to create a Random Forest classifier.
It should load a CSV, handle missing values, and output the accuracy score.
Explain the feature importance selection.`;

// Updated system prompt to force web search behavior in analysis
export const SYSTEM_INSTRUCTION_JUDGE = `You are an expert Senior Software Architect and AI Researcher. 
Your goal is to evaluate the current landscape of LLMs specifically for coding tasks.
You must provide objective comparisons including US models (Claude 3.7, o3-mini, Gemini 2.0) and top Chinese models (DeepSeek R1, Qwen 2.5 Max).

When asked for analysis, you MUST use Google Search to find the latest dates and benchmark scores. 
Do not rely on your internal cutoff knowledge. Always cite the current date.
`;