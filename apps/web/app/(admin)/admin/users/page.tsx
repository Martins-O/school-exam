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
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/users', { name, email, password, role });
      toast.success('User created successfully');
      setShowModal(false);
      setName('');
      setEmail('');
      setPassword('');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    }
  };

  const handleDelete = async (id: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}?`)) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('User removed');
      fetchUsers();
    } catch (_err) {
      toast.error('Failed to delete user');
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-950 p-8 text-white">Loading directory...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-blue-500/30 font-sans">
      <nav className="border-b border-white/5 bg-slate-950/50 backdrop-blur-md px-6 h-20 flex items-center justify-between">
        <Link href="/admin/dashboard" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl uppercase tracking-tighter">Admin</div>
          <span className="text-xl font-bold tracking-tight">CBT System Control</span>
        </Link>
        <button 
          onClick={() => setShowModal(true)}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-blue-600/20"
        >
          + CREATE NEW USER
        </button>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <header className="mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">User Directory</h1>
          <p className="text-slate-400">Total registered accounts: {users.length}</p>
        </header>

        <div className="glass-card rounded-3xl overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-[10px] uppercase tracking-[0.2em] font-black text-slate-500 border-b border-white/5">
                <th className="px-8 py-6">User Identity</th>
                <th className="px-8 py-6">Email Address</th>
                <th className="px-8 py-6">Access Role</th>
                <th className="px-8 py-6">Status</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.04] transition-colors group">
                  <td className="px-8 py-6 font-bold text-slate-200">{u.name}</td>
                  <td className="px-8 py-6 font-mono text-slate-400 text-xs">{u.email}</td>
                  <td className="px-8 py-6">
                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                      u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="flex items-center gap-1.5 text-xs text-emerald-500">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                      ACTIVE
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => handleDelete(u.id, u.name)}
                      className="text-xs font-bold text-slate-600 hover:text-red-500 transition-colors"
                    >
                      DELETE
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-card max-w-md w-full p-8 animate-in zoom-in duration-300">
            <h2 className="text-2xl font-bold mb-6">Enroll New User</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Name</label>
                <input 
                  type="text" required value={name} onChange={e => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Email</label>
                <input 
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Initial Password</label>
                <input 
                  type="password" required value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">System Role</label>
                <select 
                  value={role} onChange={e => setRole(e.target.value as any)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 focus:border-blue-500 outline-none text-white appearance-none"
                >
                  <option value="student">Student Account</option>
                  <option value="admin">Admin / Teacher Account</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 bg-white/5 rounded-xl font-bold transition-all hover:bg-white/10"
                >
                  CANCEL
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 rounded-xl font-bold transition-all hover:bg-blue-500"
                >
                  ENROLL USER
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
