import React, { useEffect, useState } from 'react';
import { generateComparisonAnalysis } from '../services/gemini';
import { AnalysisResponse, ModelData } from '../types';

interface AnalysisProps {
  models: ModelData[];
}

const Analysis = ({ models }: AnalysisProps) => {
  const [data, setData] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchAnalysis = async () => {
      setLoading(true);
      
      // If no live data, use fallback (though App usually passes fallback)
      const inputData = models && models.length > 0 ? models : [];
      
      const result = await generateComparisonAnalysis(inputData);
      if (mounted && result) {
        setData(result);
        setLoading(false);
      }
    };
    
    fetchAnalysis();
    return () => { mounted = false; };
  }, [models]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] space-y-6">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-lg animate-pulse">Analyzing leaderboard data & generating recommendations...</p>
      </div>
    );
  }

  if (!data || (!data.report && !data.markdown)) {
    return (
      <div className="text-center text-red-400 p-10 bg-slate-800/50 rounded-xl border border-red-900/50">
        Failed to generate analysis. Please retry.
      </div>
    );
  }

  // Use structured report if available, otherwise fall back to markdown
  const report = data.report;

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fadeIn">
      {/* Header & Executive Summary */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
        <h2 className="text-2xl font-bold text-white mb-4 relative z-10">Market Intelligence Report</h2>
        <div className="text-blue-200 text-lg leading-relaxed relative z-10 italic">
           "{report?.executive_summary || "Analysis generated based on current metrics."}"
        </div>
      </div>

      {/* Structured Top Models Cards */}
      {report?.top_models && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {report.top_models.map((model, idx) => (
            <div key={idx} className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-blue-500/50 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-900/50 text-blue-400 font-bold text-sm border border-blue-800">
                    #{model.rank}
                  </span>
                  <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{model.model_name}</h3>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-slate-900 text-slate-400 border border-slate-800">
                  {model.primary_advantage}
                </span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase text-slate-500 font-semibold mb-2">Recommended For</p>
                  <div className="flex flex-wrap gap-2">
                    {model.recommended_for.map((rec, i) => (
                      <span key={i} className="px-2 py-1 rounded text-xs bg-emerald-900/30 text-emerald-400 border border-emerald-900/50">
                        {rec}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-xs uppercase text-slate-500 font-semibold mb-2">Tool Stack</p>
                  <div className="flex flex-wrap gap-2">
                    {model.compatible_tools.map((tool, i) => (
                      <span key={i} className="px-2 py-1 rounded text-xs bg-indigo-900/30 text-indigo-400 border border-indigo-900/50 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scenario Matrix */}
      {report?.scenario_matrix && (
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-900">
            <h3 className="font-bold text-slate-300">Scenario Recommendations</h3>
          </div>
          <div className="divide-y divide-slate-800">
            {report.scenario_matrix.map((item, idx) => (
              <div key={idx} className="p-6 flex flex-col md:flex-row gap-4 items-start hover:bg-slate-800/30 transition-colors">
                <div className="md:w-1/3">
                  <h4 className="text-white font-medium mb-1">{item.scenario}</h4>
                  <span className="text-xs text-blue-400 font-mono">Suggested: {item.suggested_model}</span>
                </div>
                <div className="md:w-2/3 text-sm text-slate-400 leading-relaxed border-l border-slate-800 md:pl-6 border-l-0 md:border-t-0 border-t pt-4 md:pt-0">
                  {item.reasoning}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fallback for legacy markdown if JSON fails */}
      {!report && data.markdown && (
        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-lg prose prose-invert max-w-none text-slate-300 whitespace-pre-wrap">
          {data.markdown}
        </div>
      )}
      
      <div className="flex justify-center">
        <p className="text-xs text-slate-600 italic">
           Analysis generated by Gemini 3 Pro based on current Leaderboard metrics.
        </p>
      </div>
    </div>
  );
};

export default Analysis;