'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Class {
  id: string;
  name: string;
  description: string | null;
  studentCount?: number;
  teacherCount?: number;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showEnroll, setShowEnroll] = useState(false);
  const [showAssignTeacher, setShowAssignTeacher] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      api.get('/classes').catch(() => ({ data: [] })),
      api.get('/users?role=student').catch(() => ({ data: [] })),
      api.get('/users?role=teacher').catch(() => ({ data: [] })),
    ]).then(([classesRes, studentsRes, teachersRes]) => {
      setClasses(classesRes.data);
      setStudents(studentsRes.data);
      setTeachers(teachersRes.data);
      setLoading(false);
    });
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/classes', { name, description });
      toast.success('Class created successfully');
      setShowCreate(false);
      setName('');
      setDescription('');
      window.location.reload();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Creation failed');
    }
  };

  const handleDelete = async (id: string, className: string) => {
    if (!confirm(`Delete class "${className}"? This action is irreversible.`)) return;
    try {
      await api.delete(`/classes/${id}`);
      toast.success('Class deleted');
      window.location.reload();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Deletion failed');
    }
  };

  const handleEnroll = async () => {
    if (!selectedClass || !selectedStudent) return;
    try {
      await api.post(`/classes/${selectedClass.id}/students`, { studentId: selectedStudent });
      toast.success('Student enrolled');
      setShowEnroll(false);
      setSelectedStudent('');
      window.location.reload();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Enrollment failed');
    }
  };

  const handleAssignTeacher = async () => {
    if (!selectedClass || !selectedTeacher) return;
    try {
      await api.post(`/classes/${selectedClass.id}/teachers`, { teacherId: selectedTeacher });
      toast.success('Teacher assigned');
      setShowAssignTeacher(false);
      setSelectedTeacher('');
      window.location.reload();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Assignment failed');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-green-100">
      <header className="cbt-header relative z-10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-4 group">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border-b-2 border-slate-300">
              <svg className="w-5 h-5 text-brand-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <span className="text-xl font-black tracking-tight flex items-center gap-2">
              CBT Exam <span className="text-xs font-bold text-brand-gold/80 block uppercase tracking-widest border-l border-white/20 pl-4 mt-1">Classes</span>
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/admin/dashboard" className="text-[10px] font-black uppercase tracking-widest hover:text-brand-gold transition-colors">BACK TO DASHBOARD</Link>
            <button 
              onClick={() => setShowCreate(true)}
              className="px-6 py-2 bg-brand-gold text-brand-green font-black rounded-lg text-xs uppercase tracking-widest shadow-lg shadow-black/20 hover:scale-105 transition-all"
            >
              + New Class
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight mb-2">Class Management</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">{classes.length} CLASS(ES) REGISTERED</p>
          </div>
        </div>

        {showCreate && (
          <div className="portal-card p-10 mb-12 bg-white">
            <h2 className="text-2xl font-black mb-8 text-brand-green uppercase tracking-tight flex items-center gap-3">
              <span className="w-1.5 h-8 bg-brand-gold rounded-full"></span>
              Create New Class
            </h2>
            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Class Name</label>
                <input 
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-6 py-4 text-slate-800 font-bold focus:border-brand-green/40 outline-none"
                  placeholder="e.g. Grade 10A, JSS 2"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Description (optional)</label>
                <textarea 
                  value={description} onChange={e => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-6 py-4 text-slate-800 font-bold focus:border-brand-green/40 outline-none transition-all min-h-[80px]"
                  placeholder="e.g. Science stream, 2025 cohort..."
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 px-4 py-4 bg-slate-100 text-slate-600 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all"
                >
                  Discard
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-4 bg-brand-green text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-green-800 transition-all shadow-lg"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {classes.map((c) => (
            <div key={c.id} className="portal-card bg-white overflow-hidden">
              <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{c.name}</h3>
                    {c.description && (
                      <p className="text-xs text-slate-500 mt-2">{c.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(c.id, c.name)}
                    className="text-[10px] font-black text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest"
                  >
                    Delete
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-50 p-4 rounded-xl text-center">
                    <p className="text-2xl font-black text-slate-800">{c.studentCount || 0}</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Students</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl text-center">
                    <p className="text-2xl font-black text-slate-800">{c.teacherCount || 0}</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Teachers</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => { setSelectedClass(c); setShowEnroll(true); }}
                    className="w-full px-4 py-3 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all"
                  >
                    + Enroll Student
                  </button>
                  <button
                    onClick={() => { setSelectedClass(c); setShowAssignTeacher(true); }}
                    className="w-full px-4 py-3 bg-green-50 text-brand-green rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-green-100 transition-all"
                  >
                    + Assign Teacher
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {classes.length === 0 && (
          <div className="portal-card p-20 text-center border-dashed">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No classes registered yet.</p>
            <p className="text-[10px] text-slate-300 mt-2">Use the New Class button to create your first class.</p>
          </div>
        )}
      </main>

      {/* Enroll Student Modal */}
      {showEnroll && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
          <div className="portal-card max-w-md w-full p-10 bg-white">
            <h2 className="text-2xl font-black mb-8 text-brand-green uppercase tracking-tight">Enroll Student in {selectedClass.name}</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Student</label>
                <select 
                  value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-6 py-4 text-slate-800 font-bold focus:border-brand-green/40 outline-none"
                  required
                >
                  <option value="">Select a student...</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" onClick={() => { setShowEnroll(false); setSelectedStudent(''); }}
                  className="flex-1 px-4 py-4 bg-slate-100 text-slate-600 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="button" onClick={handleEnroll}
                  className="flex-1 px-4 py-4 bg-brand-green text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-green-800 transition-all shadow-lg"
                >
                  Enroll
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Teacher Modal */}
      {showAssignTeacher && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
          <div className="portal-card max-w-md w-full p-10 bg-white">
            <h2 className="text-2xl font-black mb-8 text-brand-green uppercase tracking-tight">Assign Teacher to {selectedClass.name}</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Teacher</label>
                <select 
                  value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-6 py-4 text-slate-800 font-bold focus:border-brand-green/40 outline-none"
                  required
                >
                  <option value="">Select a teacher...</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" onClick={() => { setShowAssignTeacher(false); setSelectedTeacher(''); }}
                  className="flex-1 px-4 py-4 bg-slate-100 text-slate-600 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="button" onClick={handleAssignTeacher}
                  className="flex-1 px-4 py-4 bg-brand-green text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-green-800 transition-all shadow-lg"
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
