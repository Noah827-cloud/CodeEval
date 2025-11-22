import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { FALLBACK_MODELS } from '../constants';
import { fetchRealtimeLeaderboard } from '../services/gemini';
import { ModelData } from '../types';

type MetricType = 'sweBench' | 'humanEval' | 'liveCodeBench';

const Leaderboard: React.FC = () => {
  const [activeMetric, setActiveMetric] = useState<MetricType>('sweBench');
  const [selectedProvider, setSelectedProvider] = useState<string>('All');
  const [fetchModel, setFetchModel] = useState<string>('gemini-2.5-flash');
  const [models, setModels] = useState<ModelData[]>([]); 
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [isCached, setIsCached] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState<boolean>(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const loadData = async (force = false) => {
    setModels([]); 
    setIsLoading(true);
    setErrorMsg(null);
    setLogs([]); 
    
    const addLog = (msg: string) => {
      setLogs(prev => [...prev, msg]);
    };
    
    addLog(`Initializing data load using ${fetchModel}...`);
    addLog("Cleared previous leaderboard data.");

    const { models: fetchedModels, isLive: liveStatus, isCached: cachedStatus, error } = await fetchRealtimeLeaderboard(force, addLog, fetchModel);
    
    if (fetchedModels && fetchedModels.length > 0) {
      setModels(fetchedModels);
      addLog(`State updated with ${fetchedModels.length} models.`);
    } else {
      addLog("No data returned. Using Fallback.");
      setModels(FALLBACK_MODELS);
    }
    
    setIsLive(liveStatus);
    setIsCached(!!cachedStatus);
    if (error) setErrorMsg(error);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (logsEndRef.current && showLogs) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, showLogs]);

  // --- DYNAMIC HIGHLIGHTS CALCULATION ---
  const highlights = useMemo(() => {
    if (models.length === 0) return null;

    // 1. Price/Perf King: Lowest input price (parsed) with sweBench > 40
    let bestValue = models[0];
    let bestPrice = 9999;

    models.forEach(m => {
      // Parse price string "$0.50" -> 0.50. "Open" -> 0. "TBD" -> 9999.
      let price = 9999;
      const pStr = m.inputPrice.toLowerCase();
      if (pStr.includes('open') || pStr.includes('free')) price = 0;
      else if (pStr.includes('$')) price = parseFloat(pStr.replace(/[^0-9.]/g, ''));
      
      if (m.sweBench > 40 && price < bestPrice) {
        bestPrice = price;
        bestValue = m;
      }
    });

    // 2. Open Weights Leader: Highest sweBench among open source
    const openModels = models.filter(m => m.isOpenSource);
    const bestOpen = openModels.sort((a, b) => b.sweBench - a.sweBench)[0];

    // 3. Reasoning King: Highest LiveCodeBench (or sweBench if missing)
    const bestReasoning = [...models].sort((a, b) => {
      const scoreA = a.liveCodeBench > 0 ? a.liveCodeBench : a.sweBench;
      const scoreB = b.liveCodeBench > 0 ? b.liveCodeBench : b.sweBench;
      return scoreB - scoreA;
    })[0];

    return { bestValue, bestOpen, bestReasoning };
  }, [models]);

  const providers = ['All', ...Array.from(new Set(models.map(m => m.provider))).sort()];
  const filteredModels = models.filter(model => 
    selectedProvider === 'All' || model.provider === selectedProvider
  );
  
  // Filter out models that have 0 or N/A score for the current metric so the chart looks clean
  const chartData = filteredModels
    .filter(m => m[activeMetric] > 0)
    .sort((a, b) => b[activeMetric] - a[activeMetric]);

  const getMetricLabel = (metric: MetricType) => {
    switch (metric) {
      case 'sweBench': return 'SWE-bench Verified (%)';
      case 'humanEval': return 'HumanEval Pass@1 (%)';
      case 'liveCodeBench': return 'LiveCodeBench (%)';
      default: return '';
    }
  };

  const getMetricDescription = (metric: MetricType) => {
    switch (metric) {
      case 'sweBench': return 'Solves real-world GitHub issues. The gold standard for Software Engineering.';
      case 'humanEval': return 'Classic python code generation benchmark. Measures basic syntax and logic.';
      case 'liveCodeBench': return 'Evaluates on recent LeetCode/Codeforces problems. Prevents data leakage.';
      default: return '';
    }
  };

  const formatValue = (val: number) => (val <= 0 ? 'N/A' : `${val}%`);

  return (
    <div className="space-y-8 animate-fadeIn">
      {errorMsg && (
        <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-3 flex items-center justify-between gap-3">
           <div className="flex items-start gap-3">
             <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
             <div>
               <h4 className="text-sm font-bold text-amber-200">Using Fallback Data</h4>
               <p className="text-xs text-amber-400/80">{errorMsg}</p>
             </div>
           </div>
           <div className="flex gap-2">
             <button onClick={() => setShowLogs(!showLogs)} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded border border-slate-600">Logs</button>
             <button onClick={() => loadData(true)} className="px-3 py-1 bg-amber-800/50 hover:bg-amber-700/50 text-amber-200 text-xs rounded border border-amber-700">Retry</button>
           </div>
        </div>
      )}

      {showLogs && (
        <div className="bg-black rounded-lg border border-slate-800 p-4 font-mono text-xs text-green-400 overflow-y-auto max-h-48 shadow-inner">
          <div className="flex justify-between items-center mb-2 border-b border-slate-800 pb-2">
            <span className="font-bold text-slate-400">DEBUG CONSOLE</span>
            <button onClick={() => setLogs([])} className="text-slate-500 hover:text-white">Clear</button>
          </div>
          <div className="space-y-1">
            {logs.map((log, i) => (<div key={i} className="break-words">{log}</div>))}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-bold text-white">LLM Coding Leaderboard</h2>
            {isLoading ? (
              <span className="flex items-center px-2 py-0.5 bg-amber-900/30 border border-amber-700/50 text-amber-400 text-[10px] font-mono uppercase tracking-wide rounded animate-pulse">Scanning...</span>
            ) : (
               <div className="flex items-center gap-2">
                 <span className={`px-2 py-0.5 border text-[10px] font-mono uppercase tracking-wide rounded flex items-center gap-1 ${isCached ? 'bg-blue-900/30 border-blue-700/50 text-blue-400' : 'bg-emerald-900/50 border-emerald-700/50 text-emerald-400'}`}>
                   {isCached ? 'Cached Data' : 'Live Update'}
                 </span>
                 <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 ml-2">
                   <select value={fetchModel} onChange={(e) => setFetchModel(e.target.value)} className="bg-transparent text-xs text-slate-300 outline-none px-2 py-1 border-r border-slate-700">
                     <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fast)</option>
                     <option value="gemini-3-pro-preview">Gemini 3 Pro (Deep)</option>
                   </select>
                   <button onClick={() => loadData(true)} className="text-slate-400 hover:text-white transition-colors px-2 py-1 hover:bg-slate-700 rounded-r">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                   </button>
                 </div>
               </div>
            )}
          </div>
          <p className="text-slate-400 text-sm">Top 10 Models ranked by Engineering Capability</p>
        </div>
        <div className="bg-slate-800 p-1 rounded-lg border border-slate-700 flex gap-1">
          {[{ id: 'sweBench', label: 'SWE-bench (Eng)' }, { id: 'liveCodeBench', label: 'LiveCode (Hard)' }, { id: 'humanEval', label: 'HumanEval (Basic)' }].map((m) => (
            <button key={m.id} onClick={() => setActiveMetric(m.id as MetricType)} className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${activeMetric === m.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}`}>{m.label}</button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">Filter Provider:</span>
        {providers.map((provider) => (
          <button key={provider} onClick={() => setSelectedProvider(provider)} className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${selectedProvider === provider ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'}`}>{provider}</button>
        ))}
      </div>

      {/* Main Chart */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg relative min-h-[350px]">
         {isLoading && <div className="absolute inset-0 bg-slate-900/80 z-10 flex items-center justify-center rounded-xl"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>}
         <div className="h-[350px] w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" hide />
                <YAxis dataKey="name" type="category" stroke="#f8fafc" width={140} tick={{fontSize: 11, fill: '#cbd5e1'}} />
                <Tooltip content={({ active, payload }) => active && payload && payload.length ? <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl"><p className="font-bold text-white">{payload[0].payload.name}</p><p className="text-white">{formatValue(Number(payload[0].value))}</p></div> : null} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                <Bar dataKey={activeMetric} radius={[0, 4, 4, 0]} barSize={24}>
                  {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color || '#64748b'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : !isLoading && <div className="h-full flex items-center justify-center text-slate-500">No data available for this metric.</div>}
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden relative">
        {isLoading && <div className="absolute inset-0 bg-slate-900/50 z-10"></div>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-300">
            <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
              <tr><th className="px-6 py-4">Rank</th><th className="px-6 py-4">Model</th><th className="px-6 py-4">Release</th><th className="px-6 py-4 text-right text-blue-400">SWE-bench</th><th className="px-6 py-4 text-right text-emerald-400">LiveCode</th><th className="px-6 py-4 text-right text-purple-400">HumanEval</th><th className="px-6 py-4">Input Price</th></tr>
            </thead>
            <tbody>
              {filteredModels.map((model, index) => (
                <tr key={model.name} className="border-b border-slate-700 hover:bg-slate-700/30">
                  <td className="px-6 py-4 font-mono text-slate-500">#{index + 1}</td>
                  <td className="px-6 py-4 font-medium text-white">{model.name}<div className="text-xs text-slate-500">{model.provider}</div></td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs">{model.releaseDate}</span></td>
                  <td className={`px-6 py-4 text-right font-mono ${activeMetric === 'sweBench' ? 'font-bold text-blue-400' : 'text-slate-400'}`}>
                    {formatValue(model.sweBench)}
                  </td>
                  <td className={`px-6 py-4 text-right font-mono ${activeMetric === 'liveCodeBench' ? 'font-bold text-emerald-400' : 'text-slate-400'}`}>
                    {formatValue(model.liveCodeBench)}
                  </td>
                  <td className={`px-6 py-4 text-right font-mono ${activeMetric === 'humanEval' ? 'font-bold text-purple-400' : 'text-slate-400'}`}>
                    {formatValue(model.humanEval)}
                  </td>
                  <td className="px-6 py-4 font-mono">{model.inputPrice}</td>
                </tr>
              ))}
              {filteredModels.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                    No models found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DYNAMIC HIGHLIGHTS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
            <div className="flex items-center gap-3 mb-3">
               <div className="bg-indigo-900/50 p-2 rounded-lg text-indigo-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div>
               <h4 className="font-bold text-white">Price/Perf King</h4>
            </div>
            <p className="text-slate-300 text-sm mb-3">
               {highlights?.bestValue ? (
                 <><span className="font-bold text-white">{highlights.bestValue.name}</span> offers high performance ({highlights.bestValue.sweBench}% SWE) at <span className="text-emerald-400">{highlights.bestValue.inputPrice}</span>.</>
               ) : "Scanning..."}
            </p>
         </div>

         <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
            <div className="flex items-center gap-3 mb-3">
               <div className="bg-sky-900/50 p-2 rounded-lg text-sky-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg></div>
               <h4 className="font-bold text-white">Open Weights</h4>
            </div>
            <p className="text-slate-300 text-sm mb-3">
               {highlights?.bestOpen ? (
                 <><span className="font-bold text-white">{highlights.bestOpen.name}</span> is the top open model available ({highlights.bestOpen.sweBench}% SWE).</>
               ) : "No open weight models found in top 10."}
            </p>
         </div>

         <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
            <div className="flex items-center gap-3 mb-3">
               <div className="bg-emerald-900/50 p-2 rounded-lg text-emerald-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg></div>
               <h4 className="font-bold text-white">Reasoning</h4>
            </div>
            <p className="text-slate-300 text-sm mb-3">
               {highlights?.bestReasoning ? (
                 <><span className="font-bold text-white">{highlights.bestReasoning.name}</span> leads in complex logic (LiveCode: {formatValue(highlights.bestReasoning.liveCodeBench)}).</>
               ) : "Scanning..."}
            </p>
         </div>
      </div>
    </div>
  );
};

export default Leaderboard;