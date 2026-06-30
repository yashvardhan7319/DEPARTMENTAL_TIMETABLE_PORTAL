import React from 'react';
import { useAuth } from '../context/AuthContext';

const roleColors = {
  ADMIN:   'from-blue-700 to-blue-900',
  FACULTY: 'from-violet-700 to-violet-900',
  STUDENT: 'from-emerald-700 to-emerald-900',
};

const roleLabels = { ADMIN: 'Admin', FACULTY: 'Faculty', STUDENT: 'Student' };

export default function Sidebar({ activeTab, setActiveTab, tabs }) {
  const { user, logout } = useAuth();
  const gradient = roleColors[user?.role] ?? 'from-gray-700 to-gray-900';

  return (
    <aside className={`w-64 min-h-screen bg-gradient-to-b ${gradient} text-white flex flex-col`}>
      {/* Brand */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="text-lg font-bold tracking-tight">🎓 Timetable Portal</div>
        <div className="text-xs text-white/50 mt-0.5">Departmental Schedule System</div>
      </div>

      {/* User */}
      <div className="px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
            {user?.fullName?.[0] ?? '?'}
          </div>
          <div className="overflow-hidden">
            <div className="font-semibold text-sm truncate">{user?.fullName}</div>
            <div className="text-xs text-white/50">{roleLabels[user?.role]}{user?.program ? ` · ${user.program}` : ''}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 flex items-center gap-3
              ${activeTab === tab.id
                ? 'bg-white/20 text-white'
                : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-6">
        <button
          onClick={logout}
          className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-all duration-150 flex items-center gap-3"
        >
          <span>🚪</span> Logout
        </button>
      </div>
    </aside>
  );
}
