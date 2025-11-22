import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION_JUDGE, FALLBACK_MODELS } from '../constants';
import { ModelData, AnalysisResponse } from '../types';

// Initialize the Gemini API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Timeout setting for real-time fetches
const SEARCH_TIMEOUT_MS = 150000;

// Cache Configuration - Bumped to v11
const CACHE_KEY = 'codellm_leaderboard_cache_v11';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 Hours

// Logging Callback Type
type LogCallback = (msg: string) => void;

// Standardized Brand Colors
const PROVIDER_COLORS: Record<string, string> = {
  'DeepSeek': '#6366f1',      // Indigo
  'Anthropic': '#d97706',     // Amber
  'OpenAI': '#10a37f',        // Emerald
  'Google': '#3b82f6',        // Blue
  'Alibaba Cloud': '#0ea5e9', // Sky
  'Meta': '#0668E1',          // Facebook Blue
  'xAI': '#FFFFFF',           // White
  'Mistral': '#f59e0b',       // Yellow
  'Moonshot AI': '#ec4899',   // Pink (Kimi)
  '01.AI': '#14b8a6',         // Teal
  'Microsoft': '#00a4ef',     // Light Blue
  'Other': '#94a3b8'          // Slate
};

// Helper: Infer provider from model name if API returns generic/unknown
const inferProvider = (name: string, givenProvider?: string): string => {
  const n = name.toLowerCase();
  const p = (givenProvider || '').toLowerCase();

  if (n.includes('gpt') || n.includes('o1') || n.includes('o3') || n.includes('o4') || p.includes('openai')) return 'OpenAI';
  if (n.includes('claude') || p.includes('anthropic')) return 'Anthropic';
  if (n.includes('gemini') || p.includes('google')) return 'Google';
  if (n.includes('deepseek') || p.includes('deepseek')) return 'DeepSeek';
  if (n.includes('qwen') || p.includes('alibaba') || p.includes('qwen')) return 'Alibaba Cloud';
  if (n.includes('llama') || p.includes('meta') || p.includes('facebook')) return 'Meta';
  if (n.includes('grok') || p.includes('xai') || p.includes('twitter')) return 'xAI';
  if (n.includes('kimi') || p.includes('moonshot')) return 'Moonshot AI';
  if (n.includes('mistral') || p.includes('mistral')) return 'Mistral AI';
  
  if (givenProvider && givenProvider.length > 2 && givenProvider !== 'Unknown') {
    return givenProvider.charAt(0).toUpperCase() + givenProvider.slice(1);
  }
  
  return 'Other';
};

const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
};

const inferOpenSource = (name: string, provider: string): boolean => {
  const n = name.toLowerCase();
  const p = provider.toLowerCase();
  return (
    n.includes('llama') || 
    n.includes('qwen') || 
    n.includes('deepseek') || 
    n.includes('mistral') ||
    n.includes('gemma') ||
    p.includes('meta') ||
    p.includes('mistral') ||
    p.includes('01.ai')
  );
};

export const generateCodeResponse = async (prompt: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_JUDGE,
        thinkingConfig: { thinkingBudget: 4096 }, 
      }
    });
    return response.text || "No response generated.";
  } catch (error) {
    console.error("Error generating code:", error);
    return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
};

export const generateComparisonAnalysis = async (models: ModelData[]): Promise<AnalysisResponse> => {
  try {
    const modelsJson = JSON.stringify(models.slice(0, 8)); 
    
    const prompt = `
      ACT AS: Senior AI Architect / CTO.
      INPUT DATA (Real-time Leaderboard): ${modelsJson}
      TASK: Analyze the provided model data. Ignore web search for this specific task. Produce a structured report in JSON.
      OUTPUT JSON SCHEMA:
      {
        "executive_summary": "Summary text.",
        "top_models": [{ "model_name": "", "rank": 1, "primary_advantage": "", "recommended_for": [], "compatible_tools": [] }],
        "scenario_matrix": [{ "scenario": "", "suggested_model": "", "reasoning": "" }]
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', 
      contents: prompt,
      config: {
        systemInstruction: "You are an expert analyst. Output strictly valid JSON.",
        thinkingConfig: { thinkingBudget: 2048 },
      }
    });

    const text = response.text || "";
    let report = null;
    
    try {
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
      report = JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse analysis JSON", e);
    }

    return { markdown: text, report: report };
  } catch (error) {
    console.error("Error generating analysis:", error);
    return { markdown: `Error fetching analysis: ${error instanceof Error ? error.message : 'Unknown error'}.` };
  }
};

// Internal helper to execute the actual API call
const executeLeaderboardSearch = async (modelName: string, log: LogCallback): Promise<ModelData[]> => {
  const prompt = `
      Context: You are a strict Data Analyst.
      TASK:
      1. Search Google for the **ACTUAL, CURRENT** "SWE-bench Verified Leaderboard", "EvalPlus Leaderboard" and "LiveCodeBench".
      2. Identify the **TOP 10 performing models** that are *currently released*. Do NOT include unreleased or rumored models.
      3. Extract their specific scores.
      
      CRITICAL RULES:
      - **NO HALLUCINATIONS**: Do not invent scores for models that don't exist yet.
      - **FORMAT**: Scores must be percentages (0-100). Example: 75.5, not 0.755.
      - **MISSING DATA**: If specific data is missing, perform a targeted search. If still missing, use -1.
      
      OUTPUT FORMAT:
      Return ONLY a valid JSON array. No markdown.
      [
        {
          "name": "Model Name",
          "provider": "Company",
          "releaseDate": "YYYY-MM",
          "humanEval": 90.5,
          "sweBench": 50.2,
          "liveCodeBench": 45.0,
          "contextWindow": "128K",
          "inputPrice": "$X.XX",
          "outputPrice": "$X.XX",
          "isOpenSource": true,
          "strengths": ["Tag1", "Tag2"],
          "color": "#HexCode"
        }
      ]
    `;

    log(`Sending request to API (${modelName}, Timeout: ${SEARCH_TIMEOUT_MS}ms)...`);

    const apiCall = ai.models.generateContent({
      model: modelName, 
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // Only add thinking config if we are using a Pro model that supports it
        thinkingConfig: modelName.includes('pro') ? { thinkingBudget: 2048 } : undefined
      }
    });

    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error(`TIMEOUT_REACHED: Search exceeded ${SEARCH_TIMEOUT_MS/1000}s`)), SEARCH_TIMEOUT_MS)
    );

    log("Waiting for API or Timeout...");
    const response = await Promise.race([apiCall, timeoutPromise]);
    
    log("API Response received!");
    const text = response.text || "";
    
    let jsonStr = "";
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    } else {
      const start = text.indexOf('[');
      const end = text.lastIndexOf(']');
      if (start !== -1 && end !== -1 && end > start) {
        jsonStr = text.substring(start, end + 1);
      }
    }
    
    if (!jsonStr) {
      throw new Error("Invalid data format received (No JSON)");
    }

    try {
      log("Parsing JSON...");
      const rawData = JSON.parse(jsonStr);
      
      if (Array.isArray(rawData) && rawData.length >= 1) {
         const getValue = (obj: any, keys: string[]): number => {
           let val = 0;
           for (const k of keys) {
             if (obj[k] !== undefined) {
               val = Number(obj[k]);
               break;
             }
             const lowerKey = Object.keys(obj).find(ok => ok.toLowerCase() === k.toLowerCase());
             if (lowerKey && obj[lowerKey] !== undefined) {
               val = Number(obj[lowerKey]);
               break;
             }
           }
           if (val > 0 && val <= 1.0) {
             return parseFloat((val * 100).toFixed(1));
           }
           return val;
         };

         const sanitizedModels: ModelData[] = rawData.map((m: any, idx: number) => {
            const provider = inferProvider(m.name || '', m.provider);
            let finalColor = PROVIDER_COLORS[provider] || PROVIDER_COLORS[Object.keys(PROVIDER_COLORS).find(key => provider.includes(key)) || ''];
            if (!finalColor) finalColor = stringToColor(m.name || 'unknown');
            if (finalColor && (finalColor.toLowerCase() === '#ffffff' || finalColor === '#000000')) {
               finalColor = '#FFFFFF';
            }
            const isOpenSource = m.isOpenSource !== undefined 
              ? Boolean(m.isOpenSource) 
              : inferOpenSource(m.name || '', provider);

            return {
              name: m.name || "Unknown Model",
              provider: provider,
              releaseDate: m.releaseDate || "2024-01",
              humanEval: getValue(m, ['humanEval', 'human_eval', 'HumanEval']),
              sweBench: getValue(m, ['sweBench', 'swe_bench', 'swe-bench', 'SWE-bench']),
              liveCodeBench: getValue(m, ['liveCodeBench', 'live_code_bench', 'LiveCodeBench']),
              contextWindow: m.contextWindow || "128K",
              inputPrice: m.inputPrice || "TBD",
              outputPrice: m.outputPrice || "TBD",
              strengths: Array.isArray(m.strengths) ? m.strengths : ["General Coding"],
              color: finalColor,
              isOpenSource: isOpenSource
            };
         });
         
         log(`PARSED MODELS: ${sanitizedModels.map(m => m.name).join(', ')}`);
         return sanitizedModels;
      }
      throw new Error("JSON parsed but structure invalid");
    } catch (e) {
      log(`JSON Parse Error: ${e}`);
      throw e;
    }
};

// NEW: Fetch real-time leaderboard data with Granular Logging and Auto-Fallback
export const fetchRealtimeLeaderboard = async (
  forceRefresh = false, 
  onLog?: LogCallback,
  modelName: string = 'gemini-2.5-flash'
): Promise<{ models: ModelData[], isLive: boolean, isCached?: boolean, usedModel?: string, error?: string }> => {
  
  const log = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const fullMsg = `[${timestamp}] ${msg}`;
    console.log(fullMsg);
    if (onLog) onLog(fullMsg);
  };

  log(`Starting fetchRealtimeLeaderboard...`);

  if (!forceRefresh) {
    log("Checking local cache (v11)...");
    try {
      const cachedRaw = localStorage.getItem(CACHE_KEY);
      if (cachedRaw) {
        const { timestamp, data } = JSON.parse(cachedRaw);
        const age = Date.now() - timestamp;
        if (age < CACHE_DURATION_MS && Array.isArray(data) && data.length > 0) {
          log("Cache valid. Returning cached data.");
          return { models: data, isLive: true, isCached: true, usedModel: 'Cache' };
        }
      }
    } catch (e) {
      log(`Cache read error: ${e}`);
    }
  } else {
    log("Force refresh requested. Skipping cache.");
  }

  // ATTEMPT 1: Requested Model
  try {
    const data = await executeLeaderboardSearch(modelName, log);
    
    // Cache Success
    try {
       localStorage.setItem(CACHE_KEY, JSON.stringify({
         timestamp: Date.now(),
         data: data
       }));
    } catch (e) { log(`Cache save failed: ${e}`); }

    return { models: data, isLive: true, isCached: false, usedModel: modelName };

  } catch (error) {
    let errMsg = error instanceof Error ? error.message : "Unknown error";
    log(`Primary model (${modelName}) failed: ${errMsg}`);

    // ATTEMPT 2: Fallback to Flash if we weren't already using it
    if (modelName !== 'gemini-2.5-flash') {
      log("⚠️ AUTO-FALLBACK: Switching to Gemini 2.5 Flash...");
      try {
        const data = await executeLeaderboardSearch('gemini-2.5-flash', log);
        
        try {
           localStorage.setItem(CACHE_KEY, JSON.stringify({
             timestamp: Date.now(),
             data: data
           }));
        } catch (e) { log(`Cache save failed: ${e}`); }

        return { models: data, isLive: true, isCached: false, usedModel: 'gemini-2.5-flash (Fallback)' };
      } catch (fallbackError) {
        const fbMsg = fallbackError instanceof Error ? fallbackError.message : "Unknown error";
        log(`Fallback model failed too: ${fbMsg}`);
        return { models: [], isLive: false, error: `All attempts failed. ${errMsg}` };
      }
    }

    return { models: [], isLive: false, error: errMsg };
  }
};