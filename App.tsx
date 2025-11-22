import React, { useState } from 'react';
import Leaderboard from './components/Leaderboard';
import Playground from './components/Playground';
import Analysis from './components/Analysis';
import { Tab } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.LEADERBOARD);

  const renderContent = () => {
    switch (activeTab) {
      case Tab.LEADERBOARD:
        return <Leaderboard />;
      case Tab.PLAYGROUND:
        return <Playground />;
      case Tab.ANALYSIS:
        return <Analysis />;
      default:
        return <Leaderboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 selection:bg-blue-500/30">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-[#0f172a]/80 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
               <div className="bg-blue-600 p-1.5 rounded-lg">
                 <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                 </svg>
               </div>
               <h1 className="text-xl font-bold text-white tracking-tight">
                 Code<span className="text-blue-500">Eval</span>
               </h1>
            </div>
            
            <nav className="hidden md:flex space-x-1 bg-slate-800/50 p-1 rounded-xl border border-slate-700/50">
              {[
                { id: Tab.LEADERBOARD, label: 'Leaderboard' },
                { id: Tab.PLAYGROUND, label: 'Live Playground' },
                { id: Tab.ANALYSIS, label: 'AI Analysis' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Mobile Menu Button (Simplified) */}
            <div className="md:hidden">
               <button className="text-slate-400 hover:text-white">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                 </svg>
               </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Mobile Nav (Conditional) */}
      <div className="md:hidden border-b border-slate-800 bg-slate-900/50">
         <div className="flex justify-around p-2">
             {[
                { id: Tab.LEADERBOARD, label: 'Rankings' },
                { id: Tab.PLAYGROUND, label: 'Test' },
                { id: Tab.ANALYSIS, label: 'Analysis' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2 rounded text-xs font-medium ${
                    activeTab === tab.id ? 'bg-slate-800 text-blue-400' : 'text-slate-400'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
         </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-fadeIn">
          {renderContent()}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-12 py-8 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm">
            Powered by <span className="text-slate-300 font-medium">Gemini 3 Pro</span> • Comparison data is for educational purposes.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;