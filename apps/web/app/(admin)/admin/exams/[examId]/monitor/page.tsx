'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import api from '@/lib/api';

interface MonitoringEvent {
  id: string;
  type: 'violation' | 'submission';
  studentName: string;
  details: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error';
}

export default function AdminMonitorPage() {
  const { examId } = useParams();
  const [events, setEvents] = useState<MonitoringEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const router = useRouter();

  useEffect(() => {
    // 1. Join monitoring room
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3001';
    const socket = io(`${wsUrl}/exam-monitoring`, {
      auth: { token },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join-exam', examId);
    });

    socket.on('disconnect', () => setIsConnected(false));

    socket.on('violation', (data) => {
      const newEvent: MonitoringEvent = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'violation',
        studentName: data.studentName,
        details: `${data.type.replace('_', ' ')} (${data.violations} violations)`,
        timestamp: new Date().toISOString(),
        severity: data.autoSubmitted ? 'error' : 'warning',
      };
      setEvents((prev) => [newEvent, ...prev].slice(0, 50));
    });

    socket.on('submission', (data) => {
      const newEvent: MonitoringEvent = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'submission',
        studentName: data.studentName,
        details: `Submitted with score ${data.score}/${data.totalMarks}`,
        timestamp: data.submittedAt,
        severity: 'info',
      };
      setEvents((prev) => [newEvent, ...prev].slice(0, 50));
    });

    return () => {
      socket.disconnect();
    };
  }, [examId]);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Live Monitoring</h1>
            <p className="text-slate-400 mt-1">Real-time supervision for Exam ID: {examId}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-xs font-medium text-slate-300">{isConnected ? 'LIVE' : 'DISCONNECTED'}</span>
            </div>
            <button
              onClick={() => router.push(`/admin/exams`)}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm transition-colors"
            >
              Back to Exams
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-4">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              Recent Activity
            </h2>
            
            {events.length === 0 ? (
              <div className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-12 text-center text-slate-500">
                Waiting for events...
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <div 
                    key={event.id}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between animate-in fade-in slide-in-from-right-4 duration-500"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                        event.severity === 'error' ? 'bg-red-500/20 text-red-400' :
                        event.severity === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {event.type === 'violation' ? '⚠️' : '✅'}
                      </div>
                      <div>
                        <div className="font-bold">{event.studentName}</div>
                        <div className="text-sm text-slate-400">{event.details}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </div>
                      <div className={`text-[10px] font-bold uppercase mt-1 px-2 py-0.5 rounded-full inline-block ${
                        event.severity === 'error' ? 'bg-red-500/20 text-red-400' :
                        event.severity === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {event.type}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-blue-600 rounded-2xl p-6 shadow-lg shadow-blue-500/10">
              <h3 className="font-bold mb-2">Supervision Mode</h3>
              <p className="text-blue-100 text-xs leading-relaxed">
                You are currently viewing all violations and submissions for this exam. Alerts will appear instantly.
              </p>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="font-bold mb-4 text-sm uppercase tracking-wider text-slate-500">Stats Pool</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Total Violations</span>
                  <span className="font-bold">{events.filter(e => e.type === 'violation').length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Total Submissions</span>
                  <span className="font-bold">{events.filter(e => e.type === 'submission').length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
