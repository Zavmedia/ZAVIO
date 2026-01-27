import React from 'react';
import { AnalysisResult, DecisionClassification, RiskLevel } from '../types';
import { AlertTriangle, ShieldCheck, Eye, Zap, Info, ExternalLink, Activity, CheckCircle, Play } from 'lucide-react';

interface AnalysisCardProps {
  result: AnalysisResult;
  onExecute: (command: string) => void;
}

const AnalysisCard: React.FC<AnalysisCardProps> = ({ result, onExecute }) => {
  const getStatusColor = (cls: DecisionClassification) => {
    switch (cls) {
      case DecisionClassification.ALERT: return 'border-[#FF5252] text-[#FF5252] bg-[#FF5252]/10';
      case DecisionClassification.ACTION_READY: return 'border-[#00C853] text-[#00C853] bg-[#00C853]/10';
      case DecisionClassification.EXECUTING: return 'border-[#00E5FF] text-[#00E5FF] bg-[#00E5FF]/10';
      case DecisionClassification.ADVISE: return 'border-[#00E5FF] text-[#00E5FF] bg-[#00E5FF]/5';
      case DecisionClassification.MONITOR: return 'border-[#78909C] text-[#78909C] bg-[#78909C]/5';
      default: return 'border-[#455A64] text-[#78909C] bg-[#263238]/20';
    }
  };

  const getIcon = (cls: DecisionClassification) => {
    switch (cls) {
      case DecisionClassification.ALERT: return <AlertTriangle size={18} />;
      case DecisionClassification.ACTION_READY: return <Zap size={18} />;
      case DecisionClassification.EXECUTING: return <Activity size={18} />;
      case DecisionClassification.ADVISE: return <ShieldCheck size={18} />;
      case DecisionClassification.MONITOR: return <Eye size={18} />;
      case DecisionClassification.NO_ACTION: return <CheckCircle size={18} />;
      default: return <Info size={18} />;
    }
  };

  return (
    <div className={`border-l-2 p-4 mb-4 ${getStatusColor(result.classification)} relative overflow-hidden group`}>
      {/* Tech decoration */}
      <div className="absolute top-0 right-0 p-1">
        <div className={`w-2 h-2 ${result.riskLevel === RiskLevel.HIGH ? 'bg-[#FF5252]' : 'bg-[#78909C]'} opacity-50`}></div>
      </div>

      <div className="flex justify-between items-start mb-3 border-b border-current border-opacity-20 pb-2">
        <div className="flex items-center gap-3 font-bold tracking-widest text-sm uppercase">
          {getIcon(result.classification)}
          <span>{result.classification}</span>
        </div>
        <div className="flex flex-col items-end text-[10px] tracking-wider opacity-80">
          <span>CONFIDENCE: {result.confidence}%</span>
          <span className={result.riskLevel === RiskLevel.HIGH ? 'text-[#FF5252] font-bold' : ''}>
            RISK: {result.riskLevel}
          </span>
        </div>
      </div>

      <div className="mb-2 text-sm font-bold opacity-90 text-[#E0E0E0]">
        &gt; {result.inputSummary}
      </div>

      <div className="text-sm opacity-80 leading-relaxed mb-4 whitespace-pre-wrap font-light text-[#B0BEC5]">
        {result.reasoning}
      </div>

      {result.actionableStep && (
        <div className="mt-3 p-3 bg-[#0A0C10] border border-[#00C853] text-[#00C853] flex items-center justify-between">
          <div className="flex-1 mr-4">
            <span className="text-[10px] uppercase block mb-1 opacity-70">Recommended Execution</span>
            <p className="font-bold text-sm font-mono break-all">run: {result.actionableStep}</p>
          </div>
          <button 
             onClick={() => result.actionableStep && onExecute(result.actionableStep)}
             className="px-4 py-2 border border-[#00C853] hover:bg-[#00C853] hover:text-[#0A0C10] transition-all text-[10px] uppercase tracking-widest font-bold flex items-center gap-2 shrink-0 shadow-[0_0_10px_rgba(0,200,83,0.1)] hover:shadow-[0_0_15px_rgba(0,200,83,0.4)]"
          >
             <Play size={10} fill="currentColor" />
             EXECUTE
          </button>
        </div>
      )}

      {(result.keyAssumptions.length > 0 || result.failureScenarios.length > 0) && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px] text-[#78909C]">
            <div>
                <strong className="block mb-1 uppercase opacity-60">Assumptions</strong>
                <ul className="list-square pl-4 space-y-1 opacity-70 border-l border-[#78909C]/30 ml-1">
                    {result.keyAssumptions.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
            </div>
            <div>
                <strong className="block mb-1 uppercase opacity-60 text-[#FF5252]">Failure Scenarios</strong>
                <ul className="list-square pl-4 space-y-1 opacity-70 border-l border-[#FF5252]/30 ml-1">
                    {result.failureScenarios.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
            </div>
        </div>
      )}

      {result.groundingUrls && result.groundingUrls.length > 0 && (
        <div className="mt-4 pt-2 border-t border-[#78909C]/20">
           <strong className="block mb-2 text-[10px] uppercase opacity-60">Verified Sources</strong>
           <div className="flex flex-wrap gap-2">
             {result.groundingUrls.map((url, idx) => (
               <a 
                 key={idx} 
                 href={url.uri} 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="flex items-center gap-1 bg-[#263238] hover:bg-[#37474F] px-2 py-1 text-[10px] transition-colors border border-transparent hover:border-[#00E5FF] text-[#00E5FF]"
               >
                 <ExternalLink size={10} />
                 {url.title || 'Source'}
               </a>
             ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisCard;