import React, { useState } from 'react';
import { CheckCircle2, ShieldCheck, Share2, ArrowLeft } from 'lucide-react';

export const ScorecardView: React.FC<{
  candidateName?: string;
  onBackToReplay?: () => void;
}> = ({ candidateName = 'Sarah Jenkins', onBackToReplay }) => {
  const [viewMode, setViewMode] = useState<'form' | 'public'>('form');
  const [problemSolving, setProblemSolving] = useState(4);
  const [codeQuality, setCodeQuality] = useState(5);
  const [communication, setCommunication] = useState(4);
  const [speed, setSpeed] = useState(4);
  const [notes, setNotes] = useState(
    'Sarah demonstrated senior-level grasp of data structures under pressure. She self-corrected an edge case regarding capacity zero before running the Judge0 test suite. Finished clean TypeScript implementation within 32 minutes.'
  );
  const [shareToken, setShareToken] = useState('tok_94fa2e109bc8721104aef912');
  const [copied, setCopied] = useState(false);

  const average = ((problemSolving + codeQuality + communication + speed) / 4).toFixed(1);

  const copyShareLink = () => {
    navigator.clipboard?.writeText?.(window.location.origin + '/scorecards/' + shareToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 w-full">
      {/* View Switcher Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-black/[0.08]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">Candidate Scorecard</h1>
          <p className="text-xs text-[#86868B] mt-0.5">Evaluate technical competency or preview public hiring manager link</p>
        </div>
        <div className="bg-black/[0.04] border border-black/[0.06] p-1 rounded-xl flex text-xs font-semibold">
          <button
            onClick={() => setViewMode('form')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'form' ? 'bg-white shadow-sm text-[#1D1D1F]' : 'text-[#86868B]'
            }`}
          >
            Interviewer Form
          </button>
          <button
            onClick={() => setViewMode('public')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'public' ? 'bg-white shadow-sm text-[#1D1D1F]' : 'text-[#86868B]'
            }`}
          >
            Public View (No-Auth)
          </button>
        </div>
      </div>

      {viewMode === 'form' ? (
        <div className="bg-white border border-black/[0.07] rounded-3xl p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-black/[0.06]">
            <div>
              <span className="text-xs text-[#86868B]">Candidate:</span>
              <div className="font-bold text-lg text-[#1D1D1F]">{candidateName}</div>
            </div>
            <div className="text-right">
              <span className="text-xs text-[#86868B]">Overall Score:</span>
              <div className="text-xl font-bold font-mono text-blue-600">{average} / 5.0</div>
            </div>
          </div>

          {/* 4 Pillars Rating */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-[#1D1D1F]">Problem Solving & Algorithms</span>
                <span className="font-mono font-bold text-blue-600">{problemSolving} / 5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={problemSolving}
                onChange={(e) => setProblemSolving(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-[#1D1D1F]">Code Quality & Idioms</span>
                <span className="font-mono font-bold text-blue-600">{codeQuality} / 5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={codeQuality}
                onChange={(e) => setCodeQuality(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-[#1D1D1F]">Communication & Collaboration</span>
                <span className="font-mono font-bold text-blue-600">{communication} / 5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={communication}
                onChange={(e) => setCommunication(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-[#1D1D1F]">Execution Speed & Debugging</span>
                <span className="font-mono font-bold text-blue-600">{speed} / 5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">Interviewer Technical Notes</label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 rounded-2xl border border-black/10 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="pt-4 border-t border-black/[0.06] flex items-center justify-between">
            <span className="text-xs text-[#86868B]">
              Share Token: <code className="font-mono text-[#1D1D1F] bg-black/[0.04] px-2 py-0.5 rounded">{shareToken}</code>
            </span>
            <button
              onClick={() => setViewMode('public')}
              className="px-5 py-2.5 rounded-xl bg-[#1D1D1F] text-white font-semibold text-xs hover:bg-black transition-all shadow-sm"
            >
              Save & Preview Public Link
            </button>
          </div>
        </div>
      ) : (
        /* PUBLIC VIEW (NO-AUTH) */
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span>Public No-Auth View: Accessible by hiring stakeholders via secure 32-character token.</span>
            </div>
            <button
              onClick={copyShareLink}
              className="px-3 py-1 bg-white border border-amber-300 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 hover:bg-neutral-50"
            >
              <Share2 className="w-3 h-3" />
              <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
            </button>
          </div>

          <div className="bg-white border border-black/[0.07] rounded-3xl p-8 shadow-sm space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/[0.06]">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Strong Hire Recommendation
                </div>
                <h2 className="text-2xl font-bold text-[#1D1D1F]">{candidateName}</h2>
                <p className="text-xs text-[#86868B] mt-0.5">Session: <span className="font-mono">a8f9-c2e1-4b7d</span> • Conducted by Technical Lead</p>
              </div>

              {onBackToReplay && (
                <button
                  onClick={onBackToReplay}
                  className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold hover:bg-blue-100 transition-all flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Watch Session Replay</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-black/[0.03] p-4 rounded-2xl text-center border border-black/[0.04]">
                <div className="text-[11px] font-medium text-[#86868B] uppercase tracking-wider">Problem Solving</div>
                <div className="text-3xl font-bold font-mono text-[#1D1D1F] mt-1">{problemSolving}.0<span className="text-xs text-[#86868B] font-normal">/5</span></div>
              </div>
              <div className="bg-black/[0.03] p-4 rounded-2xl text-center border border-black/[0.04]">
                <div className="text-[11px] font-medium text-[#86868B] uppercase tracking-wider">Code Quality</div>
                <div className="text-3xl font-bold font-mono text-[#1D1D1F] mt-1">{codeQuality}.0<span className="text-xs text-[#86868B] font-normal">/5</span></div>
              </div>
              <div className="bg-black/[0.03] p-4 rounded-2xl text-center border border-black/[0.04]">
                <div className="text-[11px] font-medium text-[#86868B] uppercase tracking-wider">Communication</div>
                <div className="text-3xl font-bold font-mono text-[#1D1D1F] mt-1">{communication}.0<span className="text-xs text-[#86868B] font-normal">/5</span></div>
              </div>
              <div className="bg-black/[0.03] p-4 rounded-2xl text-center border border-black/[0.04]">
                <div className="text-[11px] font-medium text-[#86868B] uppercase tracking-wider">Speed & Tests</div>
                <div className="text-3xl font-bold font-mono text-[#1D1D1F] mt-1">{speed}.0<span className="text-xs text-[#86868B] font-normal">/5</span></div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#86868B] mb-2">Evaluator Remarks</h3>
              <div className="p-4 rounded-2xl bg-black/[0.02] border border-black/[0.06] text-xs leading-relaxed text-[#1D1D1F]">
                "{notes}"
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
