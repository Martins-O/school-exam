'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import AdminHeader from '@/components/admin/AdminHeader';
import { useRouter } from 'next/navigation';
import PortalSpinner from '@/components/ui/PortalSpinner';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface AppClass {
  id: string;
  name: string;
  description: string | null;
}

interface NewStudentEntry {
  name: string;
  email: string;
  password: string;
}

const ROLE_CONFIG = {
  student: { label: 'Student', icon: '👨\u200d🎓', desc: 'Examinee account — class enrollment required' },
  teacher: { label: 'Teacher', icon: '👨\u200d🏫', desc: 'Instructor account — optional class assignment' },
  parent: { label: 'Parent', icon: '👪', desc: 'Guardian account — student linking required' },
  administrator: { label: 'Administrator', icon: '🛡️', desc: 'Full system access' },
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-red-600 text-white shadow-red-900/10',
  administrator: 'bg-purple-600 text-white shadow-purple-900/10',
  teacher: 'bg-blue-600 text-white shadow-blue-900/10',
  student: 'bg-brand-green text-white shadow-green-900/10',
  parent: 'bg-brand-gold text-brand-green shadow-gold-900/10',
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [classes, setClasses] = useState<AppClass[]>([]);
  const [existingStudents, setExistingStudents] = useState<User[]>([]);

  const [selectedRole, setSelectedRole] = useState<string>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [subFormShowPassword, setSubFormShowPassword] = useState(false);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [newStudents, setNewStudents] = useState<NewStudentEntry[]>([]);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (showModal) {
      loadClasses();
      if (selectedRole === 'parent') {
        loadExistingStudents();
      }
    }
  }, [showModal, selectedRole]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch {
      toast.error('Directory access failed');
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const res = await api.get('/classes');
      setClasses(res.data);
    } catch {}
  };

  const loadExistingStudents = async () => {
    try {
      const res = await api.get('/users?role=student');
      setExistingStudents(res.data);
    } catch {}
  };

  const toggleClass = (classId: string) => {
    setSelectedClassIds(prev =>
      prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]
    );
  };

  const toggleExistingStudent = (studentId: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  const addNewStudentRow = () => {
    setNewStudents(prev => [...prev, { name: '', email: '', password: '' }]);
  };

  const updateNewStudent = (index: number, field: keyof NewStudentEntry, value: string) => {
    setNewStudents(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const removeNewStudentRow = (index: number) => {
    setNewStudents(prev => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setSelectedRole('student');
    setName('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setSelectedClassIds([]);
    setSelectedStudentIds([]);
    setNewStudents([]);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedRole === 'parent' && selectedStudentIds.length === 0 && newStudents.length === 0) {
      toast.error('Parents must be linked to at least one student');
      return;
    }

    const payload: any = { name, email, password, role: selectedRole };

    if (selectedClassIds.length > 0) {
      payload.classIds = selectedClassIds;
    }

    if (selectedRole === 'parent') {
      if (selectedStudentIds.length > 0) {
        payload.studentIds = selectedStudentIds;
      }
      if (newStudents.length > 0) {
        payload.newStudents = newStudents;
      }
    }

    setIsSubmitting(true);
    try {
      await api.post('/users', payload);
      toast.success(`${ROLE_CONFIG[selectedRole as keyof typeof ROLE_CONFIG].label} account created`);
      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Enrollment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await api.patch(`/users/${user.id}/toggle-status`);
      toast.success(`${user.name} ${user.isActive ? 'deactivated' : 'activated'}`);
      fetchUsers();
    } catch {
      toast.error('Status update failed');
    }
  };

  const filteredUsers = filterRole === 'all' ? users : users.filter(u => u.role === filterRole);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <PortalSpinner size="lg" color="green" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans selection:bg-green-100 pb-20">
      <AdminHeader
        subtitle="User Registry"
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
              onClick={() => { resetForm(); setShowModal(true); }}
              className="px-6 py-2.5 bg-brand-gold text-brand-green rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-gold/20 hover:brightness-110"
            >
              + Create Authorized Profile
            </button>
          </div>
        }
      />
      
      <main className="max-w-7xl mx-auto px-8 py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div>
            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-4">Personnel Management</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">{users.length} AUTHORIZED IDENTITIES DETECTED</p>
          </div>
          <div className="flex flex-col md:items-end gap-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Registry Filter</label>
            <div className="flex items-center gap-2">
              <select 
                value={filterRole} 
                onChange={e => setFilterRole(e.target.value)}
                className="bg-white border-2 border-slate-100 rounded-xl px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest focus:border-brand-green outline-none transition-all shadow-sm"
              >
                <option value="all">Complete Registry</option>
                <option value="student">Candidate Pool</option>
                <option value="teacher">Instructional Core</option>
                <option value="parent">Guardian Network</option>
                <option value="administrator">System Security</option>
              </select>
            </div>
          </div>
        </div>

        <div className="institutional-table-wrapper">
          <table className="institutional-table">
            <thead>
              <tr>
                <th>Identity Identifier</th>
                <th>Communication Node (Email)</th>
                <th className="text-center">Authorization Level</th>
                <th className="text-center">Operational Status</th>
                <th className="text-right">Registry Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id} className="group">
                  <td>
                    <div className="font-black text-slate-900 group-hover:text-brand-green transition-colors uppercase tracking-tight text-sm">{u.name}</div>
                    <div className="text-[9px] font-black text-slate-400 mt-1 uppercase tracking-widest">ID: {u.id.split('-')[0]}</div>
                  </td>
                  <td className="font-mono text-slate-500 text-xs tracking-tight">{u.email}</td>
                  <td className="text-center">
                    <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm border border-transparent ${ROLE_COLORS[u.role] || 'bg-slate-50 text-slate-600'}`}>
                      {u.role === 'super_admin' ? 'Root Administrator' : u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="text-center">
                    <span className={`flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest ${u.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500 animate-pulse ring-4 ring-emerald-100' : 'bg-slate-300 ring-4 ring-slate-50'}`}></span>
                      {u.isActive ? 'VIGILANT' : 'DECOMMISSIONED'}
                    </span>
                  </td>
                  <td className="text-right">
                    <button 
                      onClick={() => handleToggleStatus(u)}
                      className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border ${
                        u.isActive 
                          ? 'text-amber-600 border-amber-100 hover:bg-amber-50' 
                          : 'text-brand-green border-green-100 hover:bg-green-50'
                      }`}
                    >
                      {u.isActive ? 'Suspend' : 'Reinstate'}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                       <svg className="w-8 h-8 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                    <h3 className="text-xl font-black text-slate-300 uppercase tracking-[0.3em] mb-2">Registry Subset Empty</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No identities found within the current filter parameters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="premium-card max-w-3xl w-full bg-white shadow-[0_0_100px_rgba(0,0,0,0.2)] max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-10 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Credential Synthesis Terminal</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Authorized Profile Initialization</p>
              </div>
              <button 
                onClick={() => { setShowModal(false); resetForm(); }}
                className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-all active:scale-90"
              >
                <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-12 overflow-y-auto flex-grow custom-scrollbar">
              <form onSubmit={handleCreate} className="space-y-12">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Structural Authorization Level</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(Object.entries(ROLE_CONFIG) as [string, typeof ROLE_CONFIG.student][]).map(([key, config]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => { setSelectedRole(key); setSelectedClassIds([]); setSelectedStudentIds([]); setNewStudents([]); }}
                        className={`p-6 rounded-2xl border-2 text-left transition-all relative overflow-hidden group ${
                          selectedRole === key 
                            ? 'border-brand-green bg-green-50 ring-4 ring-green-100/50' 
                            : 'border-slate-100 hover:border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-4 mb-3">
                           <span className="text-3xl transition-transform group-hover:scale-110 duration-300">{config.icon}</span>
                           <p className={`font-black text-sm uppercase tracking-tight ${selectedRole === key ? 'text-brand-green' : 'text-slate-800'}`}>
                             {config.label}
                           </p>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 leading-relaxed uppercase tracking-widest">{config.desc}</p>
                        {selectedRole === key && (
                          <div className="absolute top-0 right-0 p-3">
                             <div className="w-4 h-4 bg-brand-green rounded-full flex items-center justify-center">
                                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                             </div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-10">
                  <div className="floating-label-group">
                    <input 
                      type="text" required value={name} onChange={e => setName(e.target.value)}
                      className="institutional-input pt-10"
                      placeholder=" "
                    />
                    <label>Personnel Full Designation</label>
                  </div>
                  <div className="floating-label-group">
                    <input 
                      type="email" required value={email} onChange={e => setEmail(e.target.value)}
                      className="institutional-input pt-10"
                      placeholder=" "
                    />
                    <label>Authorized Communication Node (Email)</label>
                  </div>
                  <div className="floating-label-group relative">
                    <input 
                      type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                      className="institutional-input pt-10 pr-14"
                      placeholder=" "
                      minLength={8}
                    />
                    <label>Cryptographic Access Key (Password)</label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-6 flex items-center text-slate-400 hover:text-brand-green transition-colors z-10 focus:outline-none"
                      title={showPassword ? 'Hide passkey' : 'Show passkey'}
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {(selectedRole === 'student' || selectedRole === 'teacher') && (
                  <div className="bg-slate-50/80 p-8 rounded-3xl border border-slate-100">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 text-center">
                      {selectedRole === 'student' ? 'Required Structural Linkages (Classes)' : 'Optional Structural Linkages (Classes)'}
                    </label>
                    {classes.length === 0 ? (
                      <div className="p-8 bg-amber-50 border border-amber-100 rounded-2xl text-center">
                        <p className="text-xs font-black text-amber-600 uppercase tracking-widest">Structural Repository Empty</p>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-3 justify-center">
                        {classes.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => toggleClass(c.id)}
                            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all active:scale-95 ${
                              selectedClassIds.includes(c.id)
                                ? 'border-brand-green bg-brand-green text-white shadow-xl shadow-green-900/10'
                                : 'border-white bg-white text-slate-400 hover:border-slate-200 shadow-sm'
                            }`}
                          >
                            {c.name}
                          </button>
                        ))}
                      </div>
                    )}
                    {selectedRole === 'student' && selectedClassIds.length === 0 && classes.length > 0 && (
                      <p className="text-[9px] font-black text-red-500 mt-6 text-center uppercase tracking-widest animate-pulse">Minimum of one structural linkage is mandatory for candidates</p>
                    )}
                  </div>
                )}

                {selectedRole === 'parent' && (
                  <div className="space-y-10">
                    <div className="bg-slate-50/80 p-8 rounded-3xl border border-slate-100">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 text-center">Guardian-Candidate Linkage Registry</label>
                      {existingStudents.length === 0 ? (
                        <p className="text-[10px] font-black text-slate-400 text-center uppercase tracking-widest">No existing candidates detected in pool.</p>
                      ) : (
                        <div className="flex flex-wrap gap-3 justify-center">
                          {existingStudents.map(s => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => toggleExistingStudent(s.id)}
                              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all active:scale-95 ${
                                selectedStudentIds.includes(s.id)
                                  ? 'border-brand-gold bg-brand-gold text-brand-green shadow-xl shadow-gold/10'
                                  : 'border-white bg-white text-slate-400 hover:border-slate-200 shadow-sm'
                              }`}
                            >
                              👨\u200d🎓 {s.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-50/80 p-8 rounded-3xl border border-slate-100">
                      <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Initialize & Link New Candidates</label>
                        <button
                          type="button"
                          onClick={addNewStudentRow}
                          className="px-4 py-2 bg-brand-green text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:brightness-110 transition-all shadow-lg shadow-green-900/10"
                        >
                          + Add Sub-Node
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        {newStudents.length === 0 && (
                          <p className="text-[10px] font-black text-slate-300 text-center uppercase tracking-widest py-4 italic">No sub-node synthesis initialized.</p>
                        )}
                        {newStudents.map((student, index) => (
                          <div key={index} className="bg-white border border-slate-100 rounded-2xl p-8 relative group">
                            <button
                              type="button"
                              onClick={() => removeNewStudentRow(index)}
                              className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-red-50 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="floating-label-group">
                                <input 
                                  type="text" required value={student.name} onChange={e => updateNewStudent(index, 'name', e.target.value)}
                                  className="institutional-input pt-10 text-xs"
                                  placeholder=" "
                                />
                                <label>Candidate Name</label>
                              </div>
                              <div className="floating-label-group">
                                <input 
                                  type="email" required value={student.email} onChange={e => updateNewStudent(index, 'email', e.target.value)}
                                  className="institutional-input pt-10 text-xs font-mono"
                                  placeholder=" "
                                />
                                <label>Candidate Node (Email)</label>
                              </div>
                              <div className="floating-label-group relative">
                                <input 
                                  type={subFormShowPassword ? 'text' : 'password'} required value={student.password} onChange={e => updateNewStudent(index, 'password', e.target.value)}
                                  className="institutional-input pt-10 pr-14 text-xs"
                                  placeholder=" "
                                  minLength={8}
                                />
                                <label>Access Key (Password)</label>
                                <button
                                  type="button"
                                  onClick={() => setSubFormShowPassword(!subFormShowPassword)}
                                  className="absolute inset-y-0 right-0 pr-6 flex items-center text-slate-400 hover:text-brand-green transition-colors z-10 focus:outline-none"
                                  title={subFormShowPassword ? 'Hide passkey' : 'Show passkey'}
                                >
                                  {subFormShowPassword ? (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                  ) : (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-6 pt-10 border-t border-slate-100">
                  <button 
                    type="button" onClick={() => { setShowModal(false); resetForm(); }}
                    className="flex-1 px-8 py-5 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-slate-100 transition-all"
                  >
                    Abort Synthesis
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-8 py-5 bg-brand-green text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-green-800 transition-all shadow-2xl shadow-green-900/20 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-3"
                  >
                    {isSubmitting ? (
                      <>
                        <PortalSpinner size="sm" color="white" />
                        <span>SYNTHESIZING...</span>
                      </>
                    ) : (
                      `Finalize ${ROLE_CONFIG[selectedRole as keyof typeof ROLE_CONFIG].label} Record`
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <footer className="max-w-7xl mx-auto px-8 py-12 text-center border-t border-slate-100">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Institutional Identity Matrix v2.1.4 © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
