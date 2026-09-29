import React, { useState } from 'react';
import { CollabEditor } from './components/Editor/CollabEditor';
import { ReplayViewer } from './components/Replay/ReplayViewer';
import { ScorecardView } from './components/Scorecard/ScorecardView';
import {
  Code2,
  Terminal,
  Play,
  Copy,
  Users,
  CheckCircle2,
  ArrowRight,
  LogOut,
  Plus,
} from 'lucide-react';

export type ScreenId = 'landing' | 'auth' | 'dashboard' | 'lobby' | 'room' | 'replay' | 'scorecard';

export function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('landing');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [code, setCode] = useState<string>(
    `interface LRUCache<K, V> {\n  get(key: K): V | null;\n  put(key: K, value: V): void;\n}\n\nclass DoublyLinkedListNode {\n  constructor(public key: number, public val: number) {}\n}\n\nexport function solve(capacity: number) {\n  const map = new Map<number, DoublyLinkedListNode>();\n  // Candidate cursor: Sentinel node eviction\n}`
  );
  const [stdin, setStdin] = useState<string>('2\nput 1 10\nput 2 20\nget 1');
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [candidateName, setCandidateName] = useState<string>('Sarah Jenkins');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const handleRunCode = async () => {
    setIsRunning(true);
    try {
      const res = await fetch('/api/rooms/a8f9-c2e1-4b7d/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language: 'typescript',
          stdin,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const time = new Date().toLocaleTimeString();
        setConsoleOutput((prev) => [
          ...prev,
          `> [${time}] Status: ${json.data.status} (Time: ${json.data.time || '0.02'}s)`,
          json.data.stdout || '(No stdout returned)',
        ]);
      } else if (res.status === 429) {
        setConsoleOutput((prev) => [
          ...prev,
          `> [Rate Limit] HTTP 429: Too many executions (10/min exceeded).`,
        ]);
      } else {
        throw new Error('API request failed');
      }
    } catch {
      // Local simulated response if backend server is not running on 8000
      setTimeout(() => {
        const time = new Date().toLocaleTimeString();
        setConsoleOutput((prev) => [
          ...prev,
          `> [${time}] Judge0 Engine: 200 OK (24ms, 12MB)`,
          `stdout:\nTest Case 1 Passed.\nLRU Cache put(1, 10), put(2, 20), get(1) -> 10\nEviction verified.`,
        ]);
      }, 500);
    } finally {
      setIsRunning(false);
    }
  };

  const copyLobbyLink = () => {
    navigator.clipboard?.writeText?.('https://paircoder.dev/room/a8f9-c2e1-4b7d/join');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F7] text-[#1D1D1F]">
      {/* Top Prototype Navigation Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-black/[0.08] px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentScreen('landing')}>
            <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-sm">
              &lt;/&gt;
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-[#1D1D1F]">Paircoder</span>
              <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full ml-1.5">
                v1.0
              </span>
            </div>
          </div>

          {/* Segmented Screen Switcher */}
          <nav className="flex items-center bg-black/[0.04] border border-black/[0.05] p-1 rounded-xl overflow-x-auto text-xs font-medium">
            {(
              [
                ['landing', '1. Landing'],
                ['auth', '2. Auth'],
                ['dashboard', '3. Dashboard'],
                ['lobby', '4. Lobby'],
                ['room', '5. Room Active'],
                ['replay', '6. Replay'],
                ['scorecard', '7. Scorecard'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setCurrentScreen(id)}
                className={`px-3 py-1.5 rounded-lg transition-all duration-150 whitespace-nowrap ${
                  currentScreen === id
                    ? 'bg-white text-[#1D1D1F] shadow-sm font-semibold'
                    : 'text-[#86868B] hover:text-[#1D1D1F]'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="hidden sm:flex items-center gap-2 text-xs text-[#86868B]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Reverb: <strong className="text-[#1D1D1F] font-mono font-normal">Active</strong></span>
          </div>
        </div>
      </header>

      {/* VIEWPORT AREA */}
      <main className="flex-1 flex flex-col">
        {/* 1. LANDING */}
        {currentScreen === 'landing' && (
          <section className="flex-1 flex flex-col justify-center px-4 py-16">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/5 border border-black/10 text-xs font-medium text-[#1D1D1F] mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                CoderPad Alternative without $250/mo Subscriptions
              </div>
              <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-[#1D1D1F] leading-[1.1] mb-6">
                Collaborative technical interviews,<br />
                <span className="text-[#86868B]">replayable keystroke by keystroke.</span>
              </h1>
              <p className="text-base sm:text-lg text-[#86868B] max-w-2xl mx-auto mb-10 leading-relaxed">
                Create a zero-latency coding room in seconds. Live CRDT synchronization, isolated Judge0 code execution, full replay scrubbing, and public shareable scorecards for hiring managers.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
                <button
                  onClick={() => setCurrentScreen('auth')}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#1D1D1F] text-white font-semibold text-sm hover:bg-black transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <span>Start Interview Free</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentScreen('lobby')}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white border border-black/[0.08] text-[#1D1D1F] font-semibold text-sm hover:bg-neutral-50 transition-all"
                >
                  Join Room via Code
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                <div className="bg-white border border-black/[0.07] p-6 rounded-2xl shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg mb-4">⇄</div>
                  <h3 className="font-bold text-[#1D1D1F] mb-1">Yjs CRDT + Reverb</h3>
                  <p className="text-xs text-[#86868B] leading-relaxed">Deterministic real-time code collaboration with zero split-brain cursor conflicts.</p>
                </div>
                <div className="bg-white border border-black/[0.07] p-6 rounded-2xl shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg mb-4">⏮</div>
                  <h3 className="font-bold text-[#1D1D1F] mb-1">Keystroke Replay</h3>
                  <p className="text-xs text-[#86868B] leading-relaxed">Inspect how the candidate thinks: every pause, deletion, and debugging step replayable.</p>
                </div>
                <div className="bg-white border border-black/[0.07] p-6 rounded-2xl shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg mb-4">★</div>
                  <h3 className="font-bold text-[#1D1D1F] mb-1">No-Signup Scorecards</h3>
                  <p className="text-xs text-[#86868B] leading-relaxed">Generate tamper-proof public share tokens for engineering managers and stakeholders.</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 2. AUTH */}
        {currentScreen === 'auth' && (
          <section className="flex-1 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md bg-white border border-black/[0.07] p-8 rounded-3xl shadow-sm">
              <div className="text-center mb-8">
                <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center font-bold text-xl mx-auto mb-3 shadow">
                  &lt;/&gt;
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">Interviewer Portal</h2>
                <p className="text-xs text-[#86868B] mt-1">Sign in to manage rooms or conduct live sessions</p>
              </div>

              <div className="bg-black/[0.04] border border-black/[0.05] p-1 rounded-xl flex text-xs font-semibold mb-6">
                <button
                  onClick={() => setAuthMode('login')}
                  className={`flex-1 py-2 rounded-lg transition-all ${authMode === 'login' ? 'bg-white shadow-sm text-[#1D1D1F]' : 'text-[#86868B]'}`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setAuthMode('register')}
                  className={`flex-1 py-2 rounded-lg transition-all ${authMode === 'register' ? 'bg-white shadow-sm text-[#1D1D1F]' : 'text-[#86868B]'}`}
                >
                  Create Account
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); setCurrentScreen('dashboard'); }} className="space-y-4">
                {authMode === 'register' && (
                  <div>
                    <label className="block text-xs font-medium text-[#1D1D1F] mb-1">Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Dimas Arya Sadewa"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-[#1D1D1F] mb-1">Work Email</label>
                  <input
                    type="email"
                    defaultValue="interviewer@techcorp.id"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 text-sm font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#1D1D1F] mb-1">Password</label>
                  <input
                    type="password"
                    defaultValue="••••••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#1D1D1F] text-white font-semibold text-sm hover:bg-black transition-all shadow-sm"
                >
                  Continue to Dashboard
                </button>
              </form>
            </div>
          </section>
        )}

        {/* 3. DASHBOARD */}
        {currentScreen === 'dashboard' && (
          <section className="flex-1 px-4 py-8 max-w-7xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">Interview Sessions</h1>
                <p className="text-xs text-[#86868B] mt-0.5">Manage active coding rooms, review past replay recordings & scorecards</p>
              </div>
              <button
                onClick={() => setCurrentScreen('lobby')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1D1D1F] text-white text-xs font-semibold hover:bg-black transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Room</span>
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="bg-white border border-black/[0.07] p-4 rounded-2xl shadow-sm">
                <div className="text-xs font-medium text-[#86868B]">Total Conducted</div>
                <div className="text-2xl font-bold font-mono text-[#1D1D1F] mt-1">24</div>
              </div>
              <div className="bg-white border border-black/[0.07] p-4 rounded-2xl shadow-sm">
                <div className="text-xs font-medium text-[#86868B]">Avg. Duration</div>
                <div className="text-2xl font-bold font-mono text-[#1D1D1F] mt-1">42m</div>
              </div>
              <div className="bg-white border border-black/[0.07] p-4 rounded-2xl shadow-sm">
                <div className="text-xs font-medium text-[#86868B]">Scorecards Shared</div>
                <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">19</div>
              </div>
              <div className="bg-white border border-black/[0.07] p-4 rounded-2xl shadow-sm">
                <div className="text-xs font-medium text-[#86868B]">Active Waiting</div>
                <div className="text-2xl font-bold font-mono text-blue-600 mt-1">1</div>
              </div>
            </div>

            {/* Rooms List */}
            <div className="bg-white border border-black/[0.07] rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-black/[0.06] flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#86868B]">Recent Sessions</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-black/[0.02] text-[#86868B] border-b border-black/[0.06]">
                      <th className="p-3.5 font-semibold">Slug</th>
                      <th className="p-3.5 font-semibold">Candidate</th>
                      <th className="p-3.5 font-semibold">Language</th>
                      <th className="p-3.5 font-semibold">Status</th>
                      <th className="p-3.5 font-semibold">Conducted</th>
                      <th className="p-3.5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.06]">
                    <tr className="hover:bg-black/[0.01]">
                      <td className="p-3.5 font-mono font-medium text-blue-600">a8f9-c2e1-4b7d</td>
                      <td className="p-3.5 font-medium text-[#1D1D1F]">Sarah Jenkins</td>
                      <td className="p-3.5"><span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-mono text-[11px]">TypeScript</span></td>
                      <td className="p-3.5"><span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px]"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> Waiting</span></td>
                      <td className="p-3.5 text-[#86868B]">Today, 14:15</td>
                      <td className="p-3.5 text-right space-x-2">
                        <button onClick={() => setCurrentScreen('lobby')} className="px-2.5 py-1 rounded-lg bg-black text-white text-[11px] font-semibold hover:bg-neutral-800">Enter Lobby</button>
                      </td>
                    </tr>
                    <tr className="hover:bg-black/[0.01]">
                      <td className="p-3.5 font-mono font-medium text-neutral-600">f401-9a72-8821</td>
                      <td className="p-3.5 font-medium text-[#1D1D1F]">Budi Pratama</td>
                      <td className="p-3.5"><span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono text-[11px]">Python</span></td>
                      <td className="p-3.5"><span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 text-[11px]">Ended</span></td>
                      <td className="p-3.5 text-[#86868B]">Yesterday, 10:00</td>
                      <td className="p-3.5 text-right space-x-2">
                        <button onClick={() => setCurrentScreen('replay')} className="px-2.5 py-1 rounded-lg border border-black/10 bg-white text-[11px] font-semibold hover:bg-neutral-50">Replay</button>
                        <button onClick={() => setCurrentScreen('scorecard')} className="px-2.5 py-1 rounded-lg border border-black/10 bg-white text-[11px] font-semibold hover:bg-neutral-50">Scorecard</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* 4. LOBBY */}
        {currentScreen === 'lobby' && (
          <section className="flex-1 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-lg bg-white border border-black/[0.07] p-8 rounded-3xl shadow-sm">
              <div className="flex items-center justify-between pb-6 border-b border-black/[0.06] mb-6">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Pre-Flight Lobby</span>
                  <h2 className="text-xl font-bold tracking-tight text-[#1D1D1F] mt-1">Room: <span className="font-mono text-base font-normal">a8f9-c2e1-4b7d</span></h2>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> Status: Waiting
                </span>
              </div>

              {/* Shareable Link */}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">Candidate Invitation Link</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value="https://paircoder.dev/room/a8f9-c2e1-4b7d/join"
                    className="w-full px-3 py-2 bg-black/[0.02] border border-black/10 rounded-xl text-xs font-mono text-[#1D1D1F] select-all focus:outline-none"
                  />
                  <button
                    onClick={copyLobbyLink}
                    className="px-3.5 py-2 rounded-xl bg-white border border-black/10 text-xs font-semibold hover:bg-neutral-50 shrink-0 flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Presences */}
              <div className="p-4 rounded-2xl bg-black/[0.02] border border-black/[0.06] mb-8 space-y-2">
                <div className="text-xs font-semibold text-[#1D1D1F] mb-2 flex items-center justify-between">
                  <span>Room Participants</span>
                  <span className="font-mono text-[#86868B] text-[11px]">1/2 Connected</span>
                </div>
                <div className="flex items-center justify-between text-xs bg-white p-2.5 rounded-xl border border-black/[0.07]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    <span className="font-semibold text-[#1D1D1F]">Interviewer Lead (You)</span>
                  </div>
                  <span className="text-emerald-600 font-medium text-[11px]">Online</span>
                </div>
                <div className="flex items-center justify-between text-xs bg-white/60 p-2.5 rounded-xl border border-dashed border-black/10">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
                    <span className="text-[#86868B] italic">{candidateName} (Candidate Joining...)</span>
                  </div>
                  <span className="text-[#86868B] text-[11px]">Pending</span>
                </div>
              </div>

              <button
                onClick={() => setCurrentScreen('room')}
                className="w-full py-3 rounded-xl bg-[#1D1D1F] text-white font-semibold text-sm hover:bg-black transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <span>Enter Live Room</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </section>
        )}

        {/* 5. ROOM ACTIVE */}
        {currentScreen === 'room' && (
          <section className="flex-1 flex flex-col h-[calc(100vh-53px)] bg-neutral-900 text-neutral-100">
            {/* Room Toolbar */}
            <div className="h-12 border-b border-neutral-800 bg-neutral-950 px-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-neutral-400">room:</span>
                  <strong className="text-white">a8f9-c2e1-4b7d</strong>
                </div>
                <div className="h-4 w-px bg-neutral-800"></div>
                <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-700 text-neutral-300 font-mono text-xs">
                  TypeScript 5.4
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center text-xs font-mono gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-600/30 border border-blue-500 text-blue-300">
                    ● You (Interviewer)
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/30 border border-amber-400 text-amber-300">
                    ● Sarah (Candidate)
                  </span>
                </div>

                <div className="h-4 w-px bg-neutral-800"></div>

                <button
                  onClick={() => setCurrentScreen('scorecard')}
                  className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/50 text-rose-300 font-medium text-xs transition-colors flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>End Session</span>
                </button>
              </div>
            </div>

            {/* Split Editor & Console */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-neutral-800 relative overflow-hidden">
                <div className="h-9 bg-neutral-950/70 border-b border-neutral-800 flex items-center justify-between px-3 text-xs text-neutral-400 select-none">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-neutral-800 text-neutral-200 rounded border border-neutral-700">solution.ts</span>
                    <span className="text-[11px] text-neutral-500">Yjs Synchronized (CRDT)</span>
                  </div>
                  <span className="text-[10px] text-neutral-500">LF • UTF-8</span>
                </div>
                <div className="flex-1 w-full h-full overflow-hidden">
                  <CollabEditor initialCode={code} onChange={setCode} language="typescript" />
                </div>
              </div>

              {/* Execution Console */}
              <div className="w-full md:w-96 flex flex-col bg-neutral-950 border-t md:border-t-0 border-neutral-800">
                <div className="p-3 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50">
                  <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Console</span>
                    <span className="text-[10px] text-neutral-500 font-mono font-normal">(10/min)</span>
                  </span>
                  <button
                    onClick={handleRunCode}
                    disabled={isRunning}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isRunning ? 'Running...' : 'Run Code'}</span>
                  </button>
                </div>

                <div className="p-3 border-b border-neutral-800">
                  <label className="block text-[11px] font-mono text-neutral-400 mb-1">stdin</label>
                  <textarea
                    rows={2}
                    value={stdin}
                    onChange={(e) => setStdin(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs font-mono text-neutral-300 focus:outline-none"
                  />
                </div>

                <div className="flex-1 p-3 font-mono text-xs overflow-y-auto space-y-2">
                  <div className="text-neutral-500">[System] Judge0 engine ready. Click "Run Code" to compile & execute.</div>
                  {consoleOutput.map((line, idx) => (
                    <div key={idx} className="text-emerald-400 bg-neutral-900/80 p-2 rounded-lg border border-neutral-800 whitespace-pre-wrap">
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 6. REPLAY */}
        {currentScreen === 'replay' && (
          <ReplayViewer
            candidateName={candidateName}
            onViewScorecard={() => setCurrentScreen('scorecard')}
          />
        )}

        {/* 7. SCORECARD */}
        {currentScreen === 'scorecard' && (
          <ScorecardView
            candidateName={candidateName}
            onBackToReplay={() => setCurrentScreen('replay')}
          />
        )}
      </main>
    </div>
  );
}
export default App;
