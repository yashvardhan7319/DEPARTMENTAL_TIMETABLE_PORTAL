import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import TimetableView from '../components/TimetableView';
import { getFacultySchedule } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const TODAY_DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DAYS  = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const SLOTS = ['9:00-10:00 AM','10:00-11:00 AM','11:00 AM-12:00 PM',
               '12:00-1:00 PM','2:00-3:00 PM','3:00-4:00 PM','4:00-5:00 PM'];
const REQ_KEY = 'dpt_faculty_requests';

function loadRequests() {
  try { return JSON.parse(localStorage.getItem(REQ_KEY) || '[]'); } catch { return []; }
}
function saveRequests(reqs) {
  localStorage.setItem(REQ_KEY, JSON.stringify(reqs));
  // trigger storage event for admin dashboard
  window.dispatchEvent(new Event('storage'));
}

export default function FacultyDashboard() {
  const { user }  = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [schedules, setSchedules] = useState([]);
  const [loading,   setLoading]   = useState(false);

  // request change modal
  const [showReqModal, setShowReqModal] = useState(false);
  const [reqForm, setReqForm] = useState({
    subject: '', currentDay: '', currentSlot: '',
    requestedDay: 'Monday', requestedSlot: '9:00-10:00 AM', reason: ''
  });
  const [myRequests, setMyRequests] = useState([]);

  const todayName = TODAY_DAYS[new Date().getDay()];

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try   { const r = await getFacultySchedule(); setSchedules(r.data); }
    catch { toast.error('Failed to load schedule'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  useEffect(() => {
    // Load only this faculty's requests
    const all = loadRequests();
    setMyRequests(all.filter(r => r.facultyId === user?.username));
  }, [activeTab, user?.username]);

  const todaySchedule = schedules
    .filter(s => s.day === todayName)
    .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

  const openRequestModal = (entry) => {
    setReqForm({
      subject: entry.subject,
      currentDay: entry.day,
      currentSlot: entry.timeSlot,
      requestedDay: entry.day,
      requestedSlot: entry.timeSlot,
      reason: ''
    });
    setShowReqModal(true);
  };

  const submitRequest = () => {
    if (!reqForm.subject) { toast.error('Select a class entry first.'); return; }
    if (reqForm.requestedDay === reqForm.currentDay && reqForm.requestedSlot === reqForm.currentSlot) {
      toast.error('Please choose a different day or time slot.'); return;
    }
    const newReq = {
      id: Date.now().toString(),
      facultyId:    user?.username,
      facultyName:  user?.fullName,
      subject:      reqForm.subject,
      currentDay:   reqForm.currentDay,
      currentSlot:  reqForm.currentSlot,
      requestedDay: reqForm.requestedDay,
      requestedSlot:reqForm.requestedSlot,
      reason:       reqForm.reason,
      status:       'pending',
      timestamp:    new Date().toISOString()
    };
    const all = loadRequests();
    saveRequests([...all, newReq]);
    setMyRequests(prev => [...prev, newReq]);
    setShowReqModal(false);
    toast.success('Request submitted to admin!');
  };

  const setRF = (k) => (e) => setReqForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="min-h-screen" style={{ background: '#f0f0f0' }}>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="max-w-6xl mx-auto p-5 space-y-5">

        {activeTab === 'home' && (
          <>
            <div className="card">
              <div className="font-semibold text-gray-800 mb-3">
                Welcome: <span className="text-primary">{user?.fullName} ({user?.username})</span>
              </div>
              <ol className="text-sm text-gray-600 space-y-1 list-decimal ml-4">
                <li>View your assigned schedule and today's classes below.</li>
                <li>Use <strong>Request Change</strong> tab to request a slot-change from admin.</li>
                <li>Contact admin for any discrepancy in records.</li>
              </ol>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { label:'Total Classes', value: schedules.length,                                     sub:'Weekly slots' },
                { label:'Subjects',      value: [...new Set(schedules.map(s=>s.subject))].length,     sub:'Assigned' },
                { label:'Active Days',   value: [...new Set(schedules.map(s=>s.day))].length,         sub:'Per week' },
              ].map(stat => (
                <div key={stat.label} className="card text-center">
                  <div className="text-3xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm font-semibold text-gray-600 mt-1">{stat.label}</div>
                  <div className="text-xs text-gray-400">{stat.sub}</div>
                </div>
              ))}
            </div>

            <div className="card !p-0 overflow-hidden">
              <div className="section-header">Today's Schedule</div>
              <div className="overflow-x-auto">
                <table className="w-full table-orange">
                  <thead><tr><th>Time</th><th>Subject</th><th>Room</th><th>Program</th><th>Type</th><th>Action</th></tr></thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={6} className="text-center py-8 text-gray-400">Loading…</td></tr>
                    ) : todaySchedule.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-8 text-gray-400">No classes today ({todayName})</td></tr>
                    ) : todaySchedule.map((s, i) => (
                      <tr key={i}>
                        <td className="font-mono text-xs font-medium">{s.timeSlot}</td>
                        <td className="font-semibold">{s.subject}</td>
                        <td>{s.room}</td>
                        <td><span className={s.program==='BCA'?'badge-bca':'badge-mca'}>{s.program}</span></td>
                        <td>
                          <span className={s.room?.toLowerCase().includes('lab') ? 'badge-lab' : 'badge-theory'}>
                            {s.room?.toLowerCase().includes('lab') ? 'lab' : 'theory'}
                          </span>
                        </td>
                        <td>
                          <button onClick={() => openRequestModal(s)}
                            className="text-xs text-amber-600 hover:text-amber-800 border border-amber-300 hover:bg-amber-50 px-2 py-0.5 rounded font-medium transition-colors">
                            📩 Request Change
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'my-schedule' && (
          <div className="card">
            <TimetableView schedules={schedules} loading={loading} title="My Schedule" />
          </div>
        )}

        {activeTab === 'request-change' && (
          <div className="space-y-5">
            <div className="card !p-0 overflow-hidden">
              <div className="section-header flex items-center justify-between">
                <span>📩 Request Schedule Change</span>
                <button onClick={() => { setShowReqModal(true); setReqForm({subject:'',currentDay:'',currentSlot:'',requestedDay:'Monday',requestedSlot:'9:00-10:00 AM',reason:''}); }}
                  className="text-xs bg-white text-primary px-3 py-1 rounded font-semibold mr-0">
                  + New Request
                </button>
              </div>
              <div className="p-4">
                <div className="bg-blue-50 border border-blue-100 rounded px-4 py-2 mb-4 text-xs text-blue-700">
                  ℹ️ Select a class entry to request admin to change its day or time slot. Admin will review and apply the change.
                </div>
                <div className="font-semibold text-sm text-gray-700 mb-3">Your Classes (click to request change):</div>
                <div className="overflow-x-auto rounded border border-gray-200">
                  <table className="w-full table-orange">
                    <thead><tr><th>Program</th><th>Day</th><th>Time</th><th>Subject</th><th>Room</th><th>Action</th></tr></thead>
                    <tbody>
                      {schedules.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-8 text-gray-400">No schedule entries found</td></tr>
                      ) : schedules.map((s, i) => (
                        <tr key={i}>
                          <td><span className={s.program==='BCA'?'badge-bca':'badge-mca'}>{s.program}</span></td>
                          <td>{s.day}</td>
                          <td className="font-mono text-xs">{s.timeSlot}</td>
                          <td className="font-medium">{s.subject}</td>
                          <td>{s.room}</td>
                          <td>
                            <button onClick={() => openRequestModal(s)}
                              className="btn-primary text-xs py-1">Request Change</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* My submitted requests */}
            {myRequests.length > 0 && (
              <div className="card !p-0 overflow-hidden">
                <div className="section-header">My Submitted Requests</div>
                <div className="p-4 space-y-3">
                  {[...myRequests].reverse().map(req => (
                    <div key={req.id} className={`border rounded-lg p-3 text-xs ${
                      req.status==='pending'  ? 'border-amber-300 bg-amber-50' :
                      req.status==='approved' ? 'border-green-300 bg-green-50' :
                                               'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <strong className="text-gray-800">{req.subject}</strong>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          req.status==='pending'  ? 'bg-amber-200 text-amber-800' :
                          req.status==='approved' ? 'bg-green-200 text-green-800' :
                                                   'bg-gray-200 text-gray-600'
                        }`}>{req.status?.toUpperCase()}</span>
                      </div>
                      <div className="text-gray-600">
                        <span className="text-red-500">{req.currentDay}, {req.currentSlot}</span>
                        &nbsp;→&nbsp;
                        <span className="text-green-600">{req.requestedDay}, {req.requestedSlot}</span>
                      </div>
                      {req.reason && <div className="text-gray-500 italic mt-1">"{req.reason}"</div>}
                      {req.status==='approved' && <div className="text-green-700 font-medium mt-1">✅ Applied: {req.resolvedDay}, {req.resolvedSlot}</div>}
                      <div className="text-gray-400 mt-1">{new Date(req.timestamp).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'notice' && (
          <div className="card text-center py-16">
            <div className="text-5xl mb-4">📢</div>
            <div className="text-lg font-bold text-gray-700 mb-2">Notice Board</div>
            <div className="text-gray-400 text-sm">No notices at this time.</div>
          </div>
        )}
      </main>

      {/* Request Change Modal */}
      {showReqModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-primary px-6 py-4 flex items-center justify-between">
              <div>
                <div className="text-white font-bold">Request Schedule Change</div>
                <div className="text-white/80 text-xs">Admin will review and apply the change</div>
              </div>
              <button onClick={() => setShowReqModal(false)}
                className="w-7 h-7 bg-white/30 hover:bg-white/50 rounded-full flex items-center justify-center text-white font-bold">×</button>
            </div>
            <div className="p-5 space-y-4">
              {reqForm.subject ? (
                <div className="bg-gray-50 rounded p-3 text-xs text-gray-600">
                  <strong>Current slot:</strong> {reqForm.subject} — {reqForm.currentDay}, {reqForm.currentSlot}
                </div>
              ) : (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Select Class</label>
                  <select className="input-field" value={reqForm.subject}
                    onChange={(e) => {
                      const s = schedules.find(sc => sc.subject === e.target.value);
                      if (s) setReqForm(f => ({...f, subject:s.subject, currentDay:s.day, currentSlot:s.timeSlot, requestedDay:s.day, requestedSlot:s.timeSlot}));
                    }}>
                    <option value="">— Select a subject —</option>
                    {schedules.map((s,i) => <option key={i} value={s.subject}>{s.subject} ({s.day}, {s.timeSlot})</option>)}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Requested Day</label>
                  <select className="input-field" value={reqForm.requestedDay} onChange={setRF('requestedDay')}>
                    {DAYS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Requested Time</label>
                  <select className="input-field" value={reqForm.requestedSlot} onChange={setRF('requestedSlot')}>
                    {SLOTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Reason (optional)</label>
                <textarea className="input-field" rows={3} placeholder="e.g. Conflict with another class…"
                  value={reqForm.reason} onChange={setRF('reason')} />
              </div>

              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowReqModal(false)} className="btn-outline-orange">Cancel</button>
                <button onClick={submitRequest} className="btn-primary">📩 Submit Request</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
