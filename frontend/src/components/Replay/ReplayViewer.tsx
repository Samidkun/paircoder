import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, FastForward } from 'lucide-react';

interface KeystrokeDelta {
  ts_ms: number;
  author: string;
  code: string;
  note?: string;
}

export const ReplayViewer: React.FC<{
  candidateName: string;
  onViewScorecard: () => void;
}> = ({ candidateName, onViewScorecard }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(35);
  const [speed, setSpeed] = useState<1 | 2 | 5>(1);

  const snapshots: KeystrokeDelta[] = [
    { ts_ms: 0, author: 'Interviewer', code: '// Problem: Implement LRU Cache\ninterface LRUCache<K, V> {\n  get(key: K): V | null;\n  put(key: K, value: V): void;\n}', note: 'Problem spec provided' },
    { ts_ms: 312000, author: candidateName, code: '// Problem: Implement LRU Cache\nclass DoublyLinkedListNode {\n  constructor(public key: number, public val: number) {}\n}', note: 'Candidate defined node structure' },
    { ts_ms: 780000, author: candidateName, code: '// Problem: Implement LRU Cache\nclass DoublyLinkedListNode {\n  constructor(public key: number, public val: number) {}\n}\n\nexport function solve(capacity: number) {\n  const map = new Map<number, DoublyLinkedListNode>();\n  // sentinel pointers\n}', note: 'Added sentinels & map hash' },
    { ts_ms: 1420000, author: candidateName, code: '// Problem: Implement LRU Cache\nclass DoublyLinkedListNode {\n  constructor(public key: number, public val: number) {}\n}\n\nexport function solve(capacity: number) {\n  const map = new Map<number, DoublyLinkedListNode>();\n  // Eviction logic completed\n  return { success: true };\n}', note: 'Full implementation ready for test' },
  ];

  const currentIdx = Math.min(
    snapshots.length - 1,
    Math.floor((progress / 100) * snapshots.length)
  );
  const activeSnapshot = snapshots[currentIdx];

  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 100;
          }
          return prev + 1 * speed;
        });
      }, 200);
    }
    return () => clearInterval(timer);
  }, [isPlaying, speed]);

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-900 text-neutral-100">
      {/* Control Strip */}
      <div className="h-14 border-b border-neutral-800 bg-neutral-950 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-all shadow"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          <button
            onClick={() => setProgress(0)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <span className="font-mono text-xs text-neutral-300 w-28">
            {Math.floor((progress * 42) / 100)}m : {((progress * 35) % 60).toString().padStart(2, '0')}s / 42m
          </span>
        </div>

        {/* Scrubber Range */}
        <div className="flex-1 max-w-xl mx-6">
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        {/* Speed & Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-neutral-800 p-0.5 rounded-lg text-xs font-mono">
            {([1, 2, 5] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-0.5 rounded ${speed === s ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white'}`}
              >
                {s}x
              </button>
            ))}
          </div>

          <button
            onClick={onViewScorecard}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-all"
          >
            Scorecard &rarr;
          </button>
        </div>
      </div>

      {/* Replay Code View */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 bg-[#0E1116] p-6 font-mono text-sm leading-relaxed overflow-y-auto">
          <div className="text-neutral-500 text-xs mb-4 pb-2 border-b border-neutral-800 flex justify-between">
            <span>Snapshot: {activeSnapshot.note}</span>
            <span className="text-blue-400 font-mono">Delta #{currentIdx + 1} by {activeSnapshot.author}</span>
          </div>
          <pre className="text-neutral-200 whitespace-pre-wrap">{activeSnapshot.code}</pre>
        </div>

        <div className="w-80 border-l border-neutral-800 bg-neutral-950 p-4 font-mono text-xs overflow-y-auto hidden md:block">
          <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-3">Keystroke Milestones</div>
          <div className="space-y-2.5">
            {snapshots.map((s, idx) => (
              <div
                key={idx}
                onClick={() => setProgress((idx / (snapshots.length - 1)) * 100)}
                className={`p-2.5 rounded-xl cursor-pointer border transition-all ${
                  idx === currentIdx
                    ? 'bg-blue-950/40 border-blue-500 text-blue-200'
                    : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:bg-neutral-900'
                }`}
              >
                <div className="text-[10px] text-neutral-500">T+{Math.floor(s.ts_ms / 60000)}m</div>
                <div className="text-xs font-medium mt-0.5">{s.note}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
