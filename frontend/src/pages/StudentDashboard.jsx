import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import TimetableView from '../components/TimetableView';
import { getSchedules } from '../services/api';
import { downloadTimetablePdf } from '../services/pdfGenerator';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const TODAY_DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export default function StudentDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [schedules, setSchedules] = useState([]);
  const [loading,   setLoading]   = useState(false);

  const program   = user?.program ?? 'BCA';
  const todayName = TODAY_DAYS[new Date().getDay()];

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try   { const r = await getSchedules(program); setSchedules(r.data); }
    catch { toast.error('Failed to load timetable'); }
    finally { setLoading(false); }
  }, [program]);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  const todaySchedule = schedules
    .filter(s => s.day === todayName)
    .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

  return (
    <div className="min-h-screen" style={{background:'#f0f0f0'}}>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="max-w-6xl mx-auto p-5 space-y-5">

        {/* HOME */}
        {activeTab === 'home' && (
          <>
            <div className="card">
              <div className="font-semibold text-gray-800 mb-3">
                Welcome : <span className="text-primary">{user?.fullName} ({user?.username})</span>
              </div>
              <ol className="text-sm text-gray-600 space-y-1 list-decimal ml-4">
                <li>Your identity/registration no. will not be disclosed. Feel free and frank to use the portal.</li>
                <li>Use the menu to access your Timetable and Notices.</li>
                <li>Contact your faculty or admin for any discrepancy in records.</li>
              </ol>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Program',      value: program,                                              sub: 'Enrolled' },
                { label: 'Subjects',     value: [...new Set(schedules.map(s => s.subject))].length,  sub: 'This semester' },
                { label: 'Active Days',  value: [...new Set(schedules.map(s => s.day))].length,      sub: 'Per week' },
              ].map(stat => (
                <div key={stat.label} className="card text-center">
                  <div className="text-2xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm font-semibold text-gray-600 mt-1">{stat.label}</div>
                  <div className="text-xs text-gray-400">{stat.sub}</div>
                </div>
              ))}
            </div>

            {/* Today's schedule */}
            <div className="card !p-0 overflow-hidden">
              <div className="section-header">Today's Schedule</div>
              <div className="overflow-x-auto">
                <table className="w-full table-orange">
                  <thead><tr><th>Time</th><th>Subject</th><th>Faculty</th><th>Room</th><th>Type</th></tr></thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={5} className="text-center py-8 text-gray-400">Loading…</td></tr>
                    ) : todaySchedule.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-8 text-gray-400">No classes today ({todayName})</td></tr>
                    ) : todaySchedule.map((s, i) => (
                      <tr key={i}>
                        <td className="font-mono text-xs font-medium">{s.timeSlot}</td>
                        <td className="font-semibold">{s.subject}</td>
                        <td>{s.facultyName}</td>
                        <td>{s.room}</td>
                        <td>
                          <span className={s.room?.toLowerCase().includes('lab') ? 'badge-lab' : 'badge-theory'}>
                            {s.room?.toLowerCase().includes('lab') ? 'lab' : 'theory'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* TIMETABLE */}
        {activeTab === 'time-table' && (
          <div className="card">
            <TimetableView schedules={schedules} loading={loading} />
          </div>
        )}

        {/* NOTICE */}
        {activeTab === 'notice' && (
          <div className="card text-center py-16">
            <div className="text-5xl mb-4">📢</div>
            <div className="text-lg font-bold text-gray-700 mb-2">Notice Board</div>
            <div className="text-gray-400 text-sm">No notices at this time. Check back later.</div>
          </div>
        )}
      </main>
    </div>
  );
}
