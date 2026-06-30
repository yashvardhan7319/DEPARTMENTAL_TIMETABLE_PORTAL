import React from 'react';
import { useAuth } from '../context/AuthContext';

const NAV_STUDENT = [
  { id: 'home',       label: 'Home' },
  { id: 'time-table', label: 'Time Table' },
  { id: 'notice',     label: 'Notice' },
];
const NAV_FACULTY = [
  { id: 'home',           label: 'Home' },
  { id: 'my-schedule',    label: 'My Schedule' },
  { id: 'request-change', label: 'Request Change' },
  { id: 'notice',         label: 'Notice' },
];
const NAV_ADMIN = [
  { id: 'home',     label: 'Home' },
  { id: 'timetable',label: 'Timetable' },
  { id: 'manage',   label: 'Manage Entries' },
  { id: 'upload',   label: 'Upload CSV' },
  { id: 'users',    label: 'User Management' },
  { id: 'requests', label: 'Faculty Requests', badge: true },
];

function navItems(role) {
  if (role === 'FACULTY') return NAV_FACULTY;
  if (role === 'ADMIN')   return NAV_ADMIN;
  return NAV_STUDENT;
}

export default function Navbar({ activeTab, setActiveTab, pendingRequests = 0 }) {
  const { user, logout } = useAuth();
  const items = navItems(user?.role);

  return (
    <div>
      <div className="bg-primary px-5 py-3 flex items-center gap-3">
        <div className="w-9 h-9 bg-white/25 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0">SM</div>
        <div className="flex-1">
          <div className="text-white/70 text-[10px] leading-none">smit's™</div>
          <div className="text-white font-bold text-base leading-tight">DPT Portal<span className="text-white/50 text-xs">®</span></div>
          <div className="text-white/60 text-[10px] hidden sm:block">The cornerstone to an effective quality assurance system for higher education</div>
        </div>
        <button className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-lg transition-colors">🎓</button>
      </div>

      <div style={{ background: '#222' }} className="px-5 flex items-center gap-1 overflow-x-auto">
        {items.map((item) => (
          <button key={item.id} onClick={() => setActiveTab(item.id)}
            className={`px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 relative ${
              activeTab === item.id ? 'text-primary border-primary' : 'text-gray-400 hover:text-white border-transparent'
            }`}>
            {item.label}
            {item.badge && pendingRequests > 0 && (
              <span className="absolute -top-0.5 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                {pendingRequests > 9 ? '9+' : pendingRequests}
              </span>
            )}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-3 pl-4 shrink-0 py-1">
          <span className="text-gray-400 text-xs whitespace-nowrap">
            Welcome: <span className="text-white font-medium">{user?.fullName}</span>
          </span>
          <button onClick={logout}
            className="text-xs text-gray-400 hover:text-red-400 transition-colors whitespace-nowrap border border-gray-600 hover:border-red-400 px-3 py-1.5 rounded">
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
