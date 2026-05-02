'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'admin'>('student');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (_err) {
      toast.error('Directory access failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/users', { name, email, password, role });
      toast.success('Official user profile created');
      setShowModal(false);
      setName('');
      setEmail('');
      setPassword('');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Enrollment failed');
    }
  };

  const handleDelete = async (id: string, userName: string) => {
    if (!confirm(`Permanently de-register ${userName}? This action is irreversible.`)) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('Registration removed');
      fetchUsers();
    } catch (_err) {
      toast.error('Deletion operation failed');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-jamb-green border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-green-100">
      <header className="jamb-header relative z-10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-4 group">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-black text-jamb-green text-xl border-b-2 border-slate-300">
              J
            </div>
            <span className="text-xl font-black tracking-tight flex items-center gap-2">
              JAMB <span className="text-xs font-bold text-jamb-gold/80 block uppercase tracking-widest border-l border-white/20 pl-4 mt-1">Directory</span>
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/admin/dashboard" className="text-[10px] font-black uppercase tracking-widest hover:text-jamb-gold transition-colors">BACK TO DASHBOARD</Link>
            <button 
              onClick={() => setShowModal(true)}
              className="px-6 py-2 bg-jamb-gold text-jamb-green font-black rounded-lg text-xs uppercase tracking-widest shadow-lg shadow-black/20 hover:scale-105 transition-all"
            >
              + Create Account
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight mb-2 text-jamb-green">Profile Management</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Validated Accounts: {users.length}</p>
        </div>

        <div className="portal-card overflow-hidden bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 border-b border-slate-200">
                <th className="px-8 py-6">Official Identity</th>
                <th className="px-8 py-6">Protocol Address</th>
                <th className="px-8 py-6">Access Tier</th>
                <th className="px-8 py-6">Status Node</th>
                <th className="px-8 py-6 text-right">Records Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-green-50/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="font-black text-slate-800 uppercase tracking-tight group-hover:text-jamb-green transition-colors">{u.name}</div>
                  </td>
                  <td className="px-8 py-6 font-mono text-slate-400 text-[10px] uppercase">{u.email}</td>
                  <td className="px-8 py-6">
                    <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${
                      u.role === 'admin' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                      Verified
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => handleDelete(u.id, u.name)}
                      className="text-[10px] font-black text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest"
                    >
                      De-register
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
          <div className="portal-card max-w-md w-full p-10 animate-in zoom-in duration-300 bg-white">
            <h2 className="text-2xl font-black mb-8 text-jamb-green uppercase tracking-tight">Create Authorized Profile</h2>
            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Display Name</label>
                <input 
                  type="text" required value={name} onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-6 py-4 text-slate-800 font-bold focus:border-jamb-green/40 outline-none transition-all"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                <input 
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-6 py-4 text-slate-800 font-bold focus:border-jamb-green/40 outline-none transition-all"
                  placeholder="name@node.edu"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Private Key (Password)</label>
                <input 
                  type="password" required value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-6 py-4 text-slate-800 font-bold focus:border-jamb-green/40 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">System Access Tier</label>
                <select 
                  value={role} onChange={e => setRole(e.target.value as any)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-6 py-4 text-slate-800 font-bold focus:border-jamb-green/40 outline-none appearance-none"
                >
                  <option value="student">Candidate Account</option>
                  <option value="admin">Board Administrator</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-4 bg-slate-100 text-slate-600 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all"
                >
                  Discard
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-4 bg-jamb-green text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-green-800 transition-all shadow-lg"
                >
                  Enroll Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
