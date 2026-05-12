'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';

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
  super_admin: 'bg-red-50 text-red-600 border-red-100',
  administrator: 'bg-purple-50 text-purple-600 border-purple-100',
  teacher: 'bg-blue-50 text-blue-600 border-blue-100',
  student: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  parent: 'bg-amber-50 text-amber-600 border-amber-100',
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
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [newStudents, setNewStudents] = useState<NewStudentEntry[]>([]);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setSelectedClassIds([]);
    setSelectedStudentIds([]);
    setNewStudents([]);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedRole === 'student' && selectedClassIds.length === 0) {
      toast.error('Students must be assigned to at least one class');
      return;
    }

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
      <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <>
      <AdminHeader
        subtitle="Directory"
        actions={
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="px-6 py-2 bg-brand-gold text-brand-green font-black rounded-lg text-xs uppercase tracking-widest shadow-lg shadow-black/20 hover:scale-105 transition-all"
          >
            + Create Account
          </button>
        }
      />
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight mb-2 text-brand-green">Profile Management</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Total Accounts: {users.length}</p>
          </div>
          <div className="flex items-center gap-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filter by role:</label>
            <select 
              value={filterRole} 
              onChange={e => setFilterRole(e.target.value)}
              className="bg-white border-2 border-slate-200 rounded-lg px-4 py-2 text-xs font-bold text-slate-600 focus:border-brand-green/40 outline-none"
            >
              <option value="all">All Roles</option>
              <option value="student">Students</option>
              <option value="teacher">Teachers</option>
              <option value="parent">Parents</option>
              <option value="administrator">Administrators</option>
            </select>
          </div>
        </div>

        <div className="portal-card overflow-hidden bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 border-b border-slate-200">
                <th className="px-8 py-6">Identity</th>
                <th className="px-8 py-6">Email</th>
                <th className="px-8 py-6">Role</th>
                <th className="px-8 py-6">Status</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-green-50/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="font-black text-slate-800 uppercase tracking-tight group-hover:text-brand-green transition-colors">{u.name}</div>
                  </td>
                  <td className="px-8 py-6 font-mono text-slate-400 text-[10px] uppercase">{u.email}</td>
                  <td className="px-8 py-6">
                    <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${ROLE_COLORS[u.role] || 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                      {u.role === 'super_admin' ? 'Super Admin' : u.role}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${u.isActive ? 'text-emerald-500' : 'text-slate-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => handleToggleStatus(u)}
                      className={`text-[10px] font-black uppercase tracking-widest transition-colors ${u.isActive ? 'text-amber-500 hover:text-amber-600' : 'text-emerald-500 hover:text-emerald-600'}`}
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No accounts found for this filter.</p>
            </div>
          )}
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
          <div className="portal-card max-w-2xl w-full p-10 animate-in zoom-in duration-300 bg-white max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-black mb-8 text-brand-green uppercase tracking-tight">Create Authorized Profile</h2>
            
            <form onSubmit={handleCreate} className="space-y-8">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Select Account Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {(Object.entries(ROLE_CONFIG) as [string, typeof ROLE_CONFIG.student][]).map(([key, config]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => { setSelectedRole(key); setSelectedClassIds([]); setSelectedStudentIds([]); setNewStudents([]); }}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        selectedRole === key 
                          ? 'border-brand-green bg-green-50 ring-2 ring-green-100' 
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <span className="text-2xl">{config.icon}</span>
                      <p className="font-black text-slate-800 text-sm mt-2 uppercase tracking-tight">{config.label}</p>
                      <p className="text-[10px] font-medium text-slate-400 mt-1 leading-tight">{config.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
                  <input 
                    type="text" required value={name} onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-6 py-4 text-slate-800 font-bold focus:border-brand-green/40 outline-none transition-all"
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                  <input 
                    type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-6 py-4 text-slate-800 font-bold focus:border-brand-green/40 outline-none transition-all"
                    placeholder="name@node.edu"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Password</label>
                  <input 
                    type="password" required value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-6 py-4 text-slate-800 font-bold focus:border-brand-green/40 outline-none transition-all"
                    placeholder="Minimum 8 characters"
                    minLength={8}
                  />
                </div>
              </div>

              {(selectedRole === 'student' || selectedRole === 'teacher') && (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    {selectedRole === 'student' ? 'Assign to Classes (Required)' : 'Assign to Classes (Optional)'}
                  </label>
                  {classes.length === 0 ? (
                    <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-center">
                      <p className="text-xs font-bold text-amber-600">No classes exist yet. Create classes first in Class Management.</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {classes.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => toggleClass(c.id)}
                          className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest border-2 transition-all ${
                            selectedClassIds.includes(c.id)
                              ? 'border-brand-green bg-green-50 text-brand-green'
                              : 'border-slate-200 text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedRole === 'student' && selectedClassIds.length === 0 && classes.length > 0 && (
                    <p className="text-[10px] font-bold text-red-500 mt-2">At least one class is required</p>
                  )}
                </div>
              )}

              {selectedRole === 'parent' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Link Existing Students</label>
                    {existingStudents.length === 0 ? (
                      <p className="text-xs font-bold text-slate-400">No existing students. Create new ones below.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {existingStudents.map(s => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => toggleExistingStudent(s.id)}
                            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest border-2 transition-all ${
                              selectedStudentIds.includes(s.id)
                                ? 'border-amber-500 bg-amber-50 text-amber-600'
                                : 'border-slate-200 text-slate-500 hover:border-slate-300'
                            }`}
                          >
                            👨\u200d🎓 {s.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Create & Link New Students</label>
                      <button
                        type="button"
                        onClick={addNewStudentRow}
                        className="text-[10px] font-black text-brand-green uppercase tracking-widest hover:underline"
                      >
                        + Add Student
                      </button>
                    </div>
                    {newStudents.length === 0 && (
                      <p className="text-xs font-bold text-slate-400 mb-2">No new students to create.</p>
                    )}
                    {newStudents.map((student, index) => (
                      <div key={index} className="bg-slate-50 border-2 border-slate-200 rounded-xl p-5 mb-3">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Student #{index + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeNewStudentRow(index)}
                            className="text-[10px] font-black text-red-500 hover:text-red-600"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="space-y-3">
                          <input 
                            type="text" required value={student.name} onChange={e => updateNewStudent(index, 'name', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm font-bold focus:border-brand-green/40 outline-none"
                            placeholder="Student name"
                          />
                          <input 
                            type="email" required value={student.email} onChange={e => updateNewStudent(index, 'email', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm font-bold focus:border-brand-green/40 outline-none"
                            placeholder="Student email"
                          />
                          <input 
                            type="password" required value={student.password} onChange={e => updateNewStudent(index, 'password', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm font-bold focus:border-brand-green/40 outline-none"
                            placeholder="Student password (min 8 chars)"
                            minLength={8}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <button 
                  type="button" onClick={() => { setShowModal(false); resetForm(); }}
                  className="flex-1 px-4 py-4 bg-slate-100 text-slate-600 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-4 bg-brand-green text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-green-800 transition-all shadow-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : `Create ${ROLE_CONFIG[selectedRole as keyof typeof ROLE_CONFIG].label}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
