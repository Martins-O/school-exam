export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-green-100">
      {children}
    </div>
  );
}
