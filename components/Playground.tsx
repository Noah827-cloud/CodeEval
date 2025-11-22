import React, { useState, useRef, useEffect } from 'react';
import { generateCodeResponse } from '../services/gemini';
import { DEFAULT_PROMPT } from '../constants';

const Playground: React.FC = () => {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [output, setOutput] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setOutput('');
    setExecutionTime(null);
    const startTime = performance.now();
    
    try {
      const result = await generateCodeResponse(prompt);
      setOutput(result);
    } catch (error) {
      setOutput("Error generating code. Please try again.");
    } finally {
      const endTime = performance.now();
      setExecutionTime((endTime - startTime) / 1000);
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6 min-h-[600px]">
      {/* Input Panel */}
      <div className="w-full lg:w-1/3 flex flex-col gap-4">
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-semibold text-white">Prompt Engineering</h3>
             <span className="text-xs text-slate-400 px-2 py-1 bg-slate-900 rounded">Model: Gemini 3 Pro</span>
          </div>
          <textarea
            className="flex-1 w-full bg-slate-900 text-slate-200 p-4 rounded-lg border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none font-mono text-sm leading-relaxed"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the code you want to generate..."
          />
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={() => setPrompt('')}
              className="text-sm text-slate-500 hover:text-white transition-colors"
            >
              Clear
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className={`px-6 py-2 rounded-lg font-medium text-white transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 ${
                loading 
                  ? 'bg-slate-600 cursor-not-allowed opacity-70' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-900/30'
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Thinking...
                </>
              ) : (
                <>
                  <span>Generate</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
        
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 text-sm text-slate-400">
          <p className="mb-2 font-semibold text-slate-300">Pro Tip:</p>
          <p>Gemini 3 Pro excels at complex reasoning. Try asking it to refactor code, debug a race condition, or explain a complex algorithm step-by-step.</p>
        </div>
      </div>

      {/* Output Panel */}
      <div className="w-full lg:w-2/3 bg-slate-900 rounded-xl border border-slate-700 overflow-hidden flex flex-col relative">
        <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex justify-between items-center">
           <span className="text-xs font-mono text-slate-400">Output Terminal</span>
           {executionTime && (
             <span className="text-xs font-mono text-green-400">Completed in {executionTime.toFixed(2)}s</span>
           )}
        </div>
        <div className="flex-1 p-6 overflow-auto custom-scrollbar">
           {loading ? (
             <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                <div className="relative w-16 h-16">
                  <div className="absolute top-0 left-0 w-full h-full border-4 border-slate-700 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-full h-full border-4 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
                <p className="animate-pulse">Analyzing request & generating solution...</p>
             </div>
           ) : output ? (
             <pre className="font-mono text-sm text-slate-200 whitespace-pre-wrap">
               {output}
             </pre>
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-slate-600">
                <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <p>Ready to code. Enter a prompt to begin.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default Playground;