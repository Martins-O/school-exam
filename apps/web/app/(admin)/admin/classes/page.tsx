'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import PortalModal from '@/components/admin/PortalModal';
import PortalSpinner from '@/components/ui/PortalSpinner';

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
  const [showRoster, setShowRoster] = useState(false);
  const [classRoster, setClassRoster] = useState<any[]>([]);
  const [showAssignTeacher, setShowAssignTeacher] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string; name: string }>({
    open: false,
    id: '',
    name: ''
  });
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const router = useRouter();

  const refreshData = () => {
    return Promise.all([
      api.get('/classes').catch(() => ({ data: [] })),
      api.get('/users?role=student').catch(() => ({ data: [] })),
      api.get('/users?role=teacher').catch(() => ({ data: [] })),
    ]).then(([classesRes, studentsRes, teachersRes]) => {
      setClasses(classesRes.data);
      setStudents(studentsRes.data);
      setTeachers(teachersRes.data);
    });
  };

  useEffect(() => {
    refreshData().then(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/classes', { name, description });
      toast.success('Class created successfully');
      setShowCreate(false);
      setName('');
      setDescription('');
      refreshData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Creation failed');
    }
  };

  const executeDelete = async () => {
    try {
      await api.delete(`/classes/${deleteModal.id}`);
      toast.success('Class deleted');
      setDeleteModal({ ...deleteModal, open: false });
      refreshData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Deletion failed');
    }
  };

  const handleEnroll = async () => {
    if (!selectedClass || selectedStudents.length === 0) return;
    try {
      const res = await api.post(`/classes/${selectedClass.id}/students/bulk`, { studentIds: selectedStudents });
      const msg = res.data.message || 'Student(s) enrolled successfully';
      if (res.data.errors?.length > 0) {
        toast(`${msg}. ${res.data.errors.length} error(s) occurred.`, { icon: '⚠️' });
      } else {
        toast.success(msg);
      }
      setShowEnroll(false);
      setSelectedStudents([]);
      refreshData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Enrollment failed for one or more students');
      refreshData();
    }
  };

  const loadClassRoster = async (classId: string) => {
    try {
      const res = await api.get(`/classes/${classId}/students`);
      setClassRoster(res.data);
    } catch (err) {
      toast.error('Failed to load roster');
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!selectedClass) return;
    try {
      await api.delete(`/classes/${selectedClass.id}/students/${studentId}`);
      toast.success('Student removed from class');
      loadClassRoster(selectedClass.id);
      refreshData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove student');
    }
  };

  const handleAssignTeacher = async () => {
    if (!selectedClass || selectedTeachers.length === 0) return;
    try {
      const res = await api.post(`/classes/${selectedClass.id}/teachers/bulk`, { teacherIds: selectedTeachers });
      const msg = res.data.message || 'Advisor(s) assigned';
      if (res.data.errors?.length > 0) {
        toast(`${msg}. ${res.data.errors.length} error(s) occurred.`, { icon: '⚠️' });
      } else {
        toast.success(msg);
      }
      setShowAssignTeacher(false);
      setSelectedTeachers([]);
      refreshData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Assignment failed for one or more advisors');
      refreshData();
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <PortalSpinner size="lg" color="green" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans selection:bg-green-100 pb-20">
      <AdminHeader
        subtitle="Class Management"
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="px-4 py-2 text-[10px] font-black text-white/60 hover:text-white transition-all uppercase tracking-[0.2em] hover:translate-x-[-4px]"
            >
              ← Dashboard
            </button>
            <div className="h-6 w-[1px] bg-white/10 mx-1"></div>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-xl ${
                showCreate ? 'bg-red-600 text-white ring-4 ring-red-100' : 'bg-brand-gold text-brand-green hover:brightness-110 shadow-gold/20'
              }`}
            >
              {showCreate ? 'Discard Record' : '+ New Class'}
            </button>
          </div>
        }
      />
      
      <main className="max-w-7xl mx-auto px-8 py-16">
        {showCreate && (
          <div className="premium-card p-12 mb-16 animate-in fade-in slide-in-from-top-8 duration-700 ease-out">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-4">
                  <span className="w-2 h-10 bg-brand-gold rounded-full"></span>
                  Initialize New Class
                </h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em] mt-2 ml-6">Academic Structural Node</p>
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-8">
              <div className="floating-label-group">
                <input 
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  className="institutional-input pt-10"
                  placeholder=" "
                  required
                />
                <label>Institutional Class Designation (e.g. Grade 10A)</label>
              </div>

              <div className="floating-label-group">
                <textarea 
                  value={description} onChange={e => setDescription(e.target.value)}
                  className="institutional-input min-h-[120px] pt-10 italic"
                  placeholder=" "
                />
                <label>Operational Description (Optional)</label>
              </div>

              <div className="pt-8 border-t border-slate-100 flex justify-end gap-4">
                <button 
                  type="button" onClick={() => setShowCreate(false)}
                  className="px-10 py-4 bg-slate-50 text-slate-400 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 transition-all"
                >
                  Discard
                </button>
                <button 
                  type="submit"
                  className="px-12 py-4 bg-brand-green text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-green-800 transition-all shadow-2xl shadow-green-900/20 active:scale-95"
                >
                  Deploy Node
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="mb-16">
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-4">Structural Registry</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">{classes.length} NODES REGISTERED IN HIERARCHY</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {classes.map((c) => (
            <div key={c.id} className="premium-card group hover:translate-y-[-8px] transition-all flex flex-col h-full">
              <div className="p-10 flex-grow">
                <div className="flex items-start justify-between mb-8">
                  <div className="w-16 h-16 bg-slate-50 text-brand-green rounded-2xl flex items-center justify-center text-3xl border border-slate-100 transition-all group-hover:scale-110 group-hover:bg-brand-green group-hover:text-white">
                    🏫
                  </div>
                  <button
                    onClick={() => setDeleteModal({ open: true, id: c.id, name: c.name })}
                    className="w-10 h-10 bg-slate-50 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-xl flex items-center justify-center transition-all active:scale-90"
                    title="Purge Node"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>

                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">{c.name}</h3>
                {c.description && (
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed mb-10">{c.description}</p>
                )}

                <div className="grid grid-cols-2 gap-4 mb-10">
                  <div className="bg-slate-50/50 p-6 rounded-2xl text-center border border-slate-50 group-hover:bg-white transition-colors">
                    <p className="text-3xl font-black text-slate-900 tabular-nums">{c.studentCount || 0}</p>
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mt-1">Personnel</p>
                  </div>
                  <div className="bg-slate-50/50 p-6 rounded-2xl text-center border border-slate-50 group-hover:bg-white transition-colors">
                    <p className="text-3xl font-black text-slate-900 tabular-nums">{c.teacherCount || 0}</p>
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mt-1">Advisors</p>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex flex-col gap-3">
                <button
                  onClick={() => { setSelectedClass(c); loadClassRoster(c.id); setShowRoster(true); }}
                  className="w-full px-6 py-4 bg-brand-green text-white hover:bg-green-800 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm shadow-green-900/10 active:scale-95"
                >
                  Manage Roster
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { setSelectedClass(c); setShowEnroll(true); }}
                    className="w-full px-4 py-3 bg-white hover:bg-indigo-600 hover:text-white border border-slate-100 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95"
                  >
                    + Add Student
                  </button>
                  <button
                    onClick={() => { setSelectedClass(c); setShowAssignTeacher(true); }}
                    className="w-full px-4 py-3 bg-white hover:bg-brand-gold hover:text-brand-green-dark border border-slate-100 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95"
                  >
                    + Add Advisor
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {classes.length === 0 && (
          <div className="text-center py-40 premium-card bg-white border-dashed border-2 border-slate-200">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-10">
              <svg className="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
            <h3 className="text-2xl font-black text-slate-300 uppercase tracking-[0.3em] mb-4">Structural Repository Empty</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No classes have been initialized in the structural registry.</p>
          </div>
        )}
      </main>

      {/* Class Roster Modal */}
      {showRoster && selectedClass && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="premium-card max-w-3xl w-full p-12 bg-white shadow-[0_0_100px_rgba(0,0,0,0.2)] max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-brand-green/10 text-brand-green rounded-2xl flex items-center justify-center text-2xl">
                  📋
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Class Roster</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Class Node: {selectedClass.name}</p>
                </div>
              </div>
              <button 
                onClick={() => { setShowRoster(false); setClassRoster([]); }}
                className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 hover:text-slate-600 transition-all active:scale-90"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-[300px] border border-slate-100 rounded-2xl">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 sticky top-0 z-10">
                  <tr className="text-[9px] uppercase tracking-widest font-black text-slate-400 border-b border-slate-100">
                    <th className="px-6 py-4">Candidate Identity</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classRoster.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-16 text-center">
                        <p className="text-xs font-black text-slate-300 uppercase tracking-widest">No candidates enrolled in this node.</p>
                      </td>
                    </tr>
                  ) : classRoster.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-black text-sm text-slate-800">{student.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-1">{student.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        {student.isActive ? (
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[9px] font-black uppercase tracking-widest">
                            Active
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-slate-100 text-slate-500 border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-widest" title={`Unenrolled at ${new Date(student.unenrolledAt).toLocaleString()}`}>
                            Archived
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {student.isActive && (
                          <button
                            onClick={() => handleRemoveStudent(student.id)}
                            className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest transition-colors px-3 py-2 hover:bg-red-50 rounded-lg"
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => { setShowRoster(false); setShowEnroll(true); }}
                className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-900/20 active:scale-95"
              >
                + Add Candidate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enroll Student Modal */}
      {showEnroll && selectedClass && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="premium-card max-w-xl w-full p-12 bg-white shadow-[0_0_100px_rgba(0,0,0,0.2)]">
            <div className="flex items-center gap-6 mb-10">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl">
                👤
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Personnel Enrollment</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Class Node: {selectedClass.name}</p>
              </div>
            </div>

            <div className="space-y-10">
              <div className="floating-label-group">
                <select 
                  multiple
                  value={selectedStudents} onChange={e => setSelectedStudents(Array.from(e.target.selectedOptions, option => option.value))}
                  className="institutional-input pt-8 pb-4 h-32"
                  required
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                  ))}
                </select>
                <label>Target Candidates (Hold Ctrl/Cmd to select multiple)</label>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" onClick={() => { setShowEnroll(false); setSelectedStudents([]); }}
                  className="flex-1 px-8 py-5 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 transition-all"
                >
                  Cancel Protocol
                </button>
                <button 
                  type="button" onClick={handleEnroll}
                  className="flex-1 px-8 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-900/20 active:scale-95"
                >
                  Enroll Personnel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Teacher Modal */}
      {showAssignTeacher && selectedClass && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="premium-card max-w-xl w-full p-12 bg-white shadow-[0_0_100px_rgba(0,0,0,0.2)]">
            <div className="flex items-center gap-6 mb-10">
              <div className="w-16 h-16 bg-brand-green/10 text-brand-green rounded-2xl flex items-center justify-center text-2xl">
                👨‍🏫
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Advisor Assignment</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Class Node: {selectedClass.name}</p>
              </div>
            </div>

            <div className="space-y-10">
              <div className="floating-label-group">
                <select 
                  multiple
                  value={selectedTeachers} onChange={e => setSelectedTeachers(Array.from(e.target.selectedOptions, option => option.value))}
                  className="institutional-input pt-8 pb-4 h-32"
                  required
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
                  ))}
                </select>
                <label>Authorized Advisors (Hold Ctrl/Cmd to select multiple)</label>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" onClick={() => { setShowAssignTeacher(false); setSelectedTeachers([]); }}
                  className="flex-1 px-8 py-5 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 transition-all"
                >
                  Cancel Protocol
                </button>
                <button 
                  type="button" onClick={handleAssignTeacher}
                  className="flex-1 px-8 py-5 bg-brand-green text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-green-800 transition-all shadow-2xl shadow-green-900/20 active:scale-95"
                >
                  Assign Advisor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <PortalModal 
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ ...deleteModal, open: false })}
        onConfirm={executeDelete}
        title="Confirm Node Purge"
        message={`Are you certain you wish to permanently decommission the class node "${deleteModal.name}"? This action removes all structural links and is tracked in the institutional audit log.`}
        confirmText="Purge Record"
        cancelText="Abort Operation"
        type="danger"
      />

      <footer className="max-w-7xl mx-auto px-8 py-12 text-center border-t border-slate-100">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Institutional Structural Matrix v4.2.0 © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
