import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import TimetableView from '../components/TimetableView';
import UploadZone from '../components/UploadZone';
import { getSchedules, uploadCsv, createSchedule, updateSchedule, deleteSchedule,
         getStudents, getFacultyList, deleteUser, createFaculty } from '../services/api';
import { downloadTimetablePdf } from '../services/pdfGenerator';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const DAYS  = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const SLOTS = ['9:00-10:00 AM','10:00-11:00 AM','11:00 AM-12:00 PM',
               '12:00-1:00 PM','2:00-3:00 PM','3:00-4:00 PM','4:00-5:00 PM'];
const PROGRAMS   = ['BCA','MCA'];
const EMPTY_FORM = { program:'BCA', day:'Monday', timeSlot:'9:00-10:00 AM', subject:'', facultyId:'', facultyName:'', room:'' };
const EMPTY_FAC  = { username:'', password:'', fullName:'', program:'BCA' };
const TODAY_DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

// Faculty request storage key
const REQ_KEY = 'dpt_faculty_requests';

function loadRequests() {
  try { return JSON.parse(localStorage.getItem(REQ_KEY) || '[]'); } catch { return []; }
}
function saveRequests(reqs) {
  localStorage.setItem(REQ_KEY, JSON.stringify(reqs));
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [schedules, setSchedules] = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [students,  setStudents]  = useState([]);
  const [faculty,   setFaculty]   = useState([]);

  // timetable filter
  const [ttProgram, setTtProgram] = useState('ALL');

  // manage entries
  const [editItem, setEditItem]   = useState(null);
  const [form,     setForm]       = useState(EMPTY_FORM);
  const [showForm, setShowForm]   = useState(false);
  const [filterProg, setFilterProg] = useState('ALL');

  // add faculty
  const [showFacForm, setShowFacForm] = useState(false);
  const [facForm,     setFacForm]     = useState(EMPTY_FAC);
  const [facLoading,  setFacLoading]  = useState(false);

  // faculty requests
  const [requests,    setRequests]   = useState(loadRequests);
  const [reqAction,   setReqAction]  = useState(null); // { req, newDay, newSlot }

  const todayName = TODAY_DAYS[new Date().getDay()];

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try   { const r = await getSchedules(); setSchedules(r.data); }
    catch { toast.error('Failed to load schedules'); }
    finally { setLoading(false); }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const [s, f] = await Promise.all([getStudents(), getFacultyList()]);
      setStudents(s.data); setFaculty(f.data);
    } catch { toast.error('Failed to load users'); }
  }, []);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);
  useEffect(() => { if (activeTab === 'users') fetchUsers(); }, [activeTab, fetchUsers]);
  useEffect(() => {
    const onStorage = () => setRequests(loadRequests());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Reload requests each time requests tab is opened
  useEffect(() => {
    if (activeTab === 'requests') setRequests(loadRequests());
  }, [activeTab]);

  const handleUpload = async (file) => {
    setUploading(true);
    try {
      const r = await uploadCsv(file);
      setSchedules(r.data);
      toast.success(`✅ ${r.data.length} entries loaded.`);
      setActiveTab('timetable');
    } catch (e) { toast.error(e.response?.data?.error || 'Upload failed'); }
    finally { setUploading(false); }
  };

  const openAdd  = () => { setEditItem(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit = (s)  => {
    setEditItem(s);
    setForm({ program:s.program, day:s.day, timeSlot:s.timeSlot, subject:s.subject,
              facultyId:s.facultyId, facultyName:s.facultyName, room:s.room });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.subject.trim())  { toast.error('Subject is required'); return; }
    if (!form.timeSlot.trim()) { toast.error('Time slot is required'); return; }
    try {
      if (editItem) { await updateSchedule(editItem.id, form); toast.success('Entry updated'); }
      else          { await createSchedule(form); toast.success('Entry added'); }
      setShowForm(false); fetchSchedules();
    } catch (e) { toast.error(e.response?.data?.error || 'Save failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this entry?')) return;
    try { await deleteSchedule(id); toast.success('Deleted'); fetchSchedules(); }
    catch { toast.error('Delete failed'); }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try { await deleteUser(id); toast.success('User deleted'); fetchUsers(); }
    catch { toast.error('Failed to delete user'); }
  };

  // Add faculty
  const handleAddFaculty = async (e) => {
    e.preventDefault();
    if (!facForm.username.trim()) { toast.error('Faculty ID is required'); return; }
    if (!facForm.fullName.trim()) { toast.error('Full name is required'); return; }
    if (!facForm.password || facForm.password.length < 5) { toast.error('Password min 5 chars'); return; }
    setFacLoading(true);
    try {
      await createFaculty(facForm);
      toast.success('Faculty member added successfully!');
      setShowFacForm(false);
      setFacForm(EMPTY_FAC);
      fetchUsers();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to add faculty'); }
    finally { setFacLoading(false); }
  };

  // Approve / reject faculty request
  const openReqAction = (req) => {
    setReqAction({ req, newDay: req.currentDay, newSlot: req.currentSlot });
  };

  const applyRequest = async () => {
    if (!reqAction) return;
    const { req, newDay, newSlot } = reqAction;
    // find schedule entry by matching subject + facultyId + currentDay + currentSlot
    const entry = schedules.find(s =>
      s.subject === req.subject &&
      s.facultyId === req.facultyId &&
      s.day === req.currentDay &&
      s.timeSlot === req.currentSlot
    );
    if (!entry) { toast.error('Could not find matching schedule entry.'); return; }
    try {
      await updateSchedule(entry.id, { ...entry, day: newDay, timeSlot: newSlot });
      toast.success('Schedule updated per faculty request!');
      // mark request resolved
      const updated = requests.map(r =>
        r.id === req.id ? { ...r, status: 'approved', resolvedDay: newDay, resolvedSlot: newSlot } : r
      );
      saveRequests(updated);
      setRequests(updated);
      setReqAction(null);
      fetchSchedules();
    } catch { toast.error('Update failed'); }
  };

  const rejectRequest = (reqId) => {
    const updated = requests.map(r => r.id === reqId ? { ...r, status: 'rejected' } : r);
    saveRequests(updated);
    setRequests(updated);
    toast.info('Request rejected');
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  const todaySchedule = schedules
    .filter(s => s.day === todayName)
    .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

  const filteredSchedules  = ttProgram === 'ALL' ? schedules : schedules.filter(s => s.program === ttProgram);
  const manageFiltered     = filterProg === 'ALL' ? schedules : schedules.filter(s => s.program === filterProg);

  const setF = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const setFF = (k) => (e) => setFacForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="min-h-screen" style={{ background: '#f0f0f0' }}>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} pendingRequests={pendingCount} />

      <main className="max-w-6xl mx-auto p-5 space-y-5">

        {/* HOME */}
        {activeTab === 'home' && (
          <>
            <div className="card">
              <div className="font-semibold text-gray-800 mb-3">
                Welcome: <span className="text-primary">{user?.fullName} ({user?.username})</span>
              </div>
              <ol className="text-sm text-gray-600 space-y-1 list-decimal ml-4">
                <li>Manage BCA and MCA timetables from the menu above.</li>
                <li>Use <strong>Manage Entries</strong> to build timetable directly inside the portal.</li>
                <li>Use <strong>Faculty Requests</strong> to review and approve slot-change requests from faculty.</li>
              </ol>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label:'Schedule Entries', value: schedules.length,                                             icon:'📅' },
                { label:'Students',         value: students.length,                                              icon:'🎓' },
                { label:'Faculty',          value: faculty.length,                                               icon:'👨‍🏫' },
                { label:'Pending Requests', value: pendingCount,                                                 icon:'📩' },
              ].map(stat => (
                <div key={stat.label} className="card text-center">
                  <div className="text-2xl mb-1">{stat.icon}</div>
                  <div className="text-2xl font-bold text-primary">{stat.value}</div>
                  <div className="text-xs text-gray-500 font-medium mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* BCA / MCA quick stats */}
            <div className="grid grid-cols-2 gap-4">
              {['BCA','MCA'].map(prog => {
                const ps = schedules.filter(s => s.program === prog);
                return (
                  <div key={prog} className="card">
                    <div className={`text-sm font-bold mb-2 ${prog==='BCA'?'text-blue-600':'text-purple-600'}`}>{prog} Timetable</div>
                    <div className="text-xs text-gray-500">{ps.length} entries &nbsp;·&nbsp; {[...new Set(ps.map(s=>s.subject))].length} subjects &nbsp;·&nbsp; {[...new Set(ps.map(s=>s.day))].length} days</div>
                    <button className="mt-2 text-xs text-primary hover:underline font-medium"
                      onClick={() => { setTtProgram(prog); setActiveTab('timetable'); }}>
                      View {prog} Timetable →
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="card !p-0 overflow-hidden">
              <div className="section-header">Today's Schedule ({todayName})</div>
              <div className="overflow-x-auto">
                <table className="w-full table-orange">
                  <thead><tr><th>Time</th><th>Subject</th><th>Faculty</th><th>Room</th><th>Program</th></tr></thead>
                  <tbody>
                    {todaySchedule.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-8 text-gray-400">No classes today</td></tr>
                    ) : todaySchedule.map((s, i) => (
                      <tr key={i}>
                        <td className="font-mono text-xs">{s.timeSlot}</td>
                        <td className="font-semibold">{s.subject}</td>
                        <td>{s.facultyName}</td>
                        <td>{s.room}</td>
                        <td><span className={s.program==='BCA'?'badge-bca':'badge-mca'}>{s.program}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* TIMETABLE */}
        {activeTab === 'timetable' && (
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm font-semibold text-gray-600">Filter by Program:</span>
              {['ALL','BCA','MCA'].map(p => (
                <button key={p} onClick={() => setTtProgram(p)}
                  className={`px-4 py-1.5 rounded text-xs font-semibold border transition-all ${
                    ttProgram === p ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-300 hover:border-primary'
                  }`}>{p}</button>
              ))}
              <button onClick={() => downloadTimetablePdf(filteredSchedules, ttProgram==='ALL'?'Full':'', ttProgram!=='ALL'?ttProgram:'')}
                className="ml-auto flex items-center gap-1.5 border border-primary text-primary text-xs font-medium px-3 py-1.5 rounded hover:bg-primary hover:text-white transition-colors">
                ⬇ Download {ttProgram !== 'ALL' ? ttProgram : ''} Timetable PDF
              </button>
            </div>
            <TimetableView schedules={filteredSchedules} loading={loading}
              title={ttProgram === 'ALL' ? 'Full Timetable' : `${ttProgram} Timetable`}
              filterLabel={ttProgram !== 'ALL' ? ttProgram : ''} />
          </div>
        )}

        {/* MANAGE ENTRIES — Timetable Builder */}
        {activeTab === 'manage' && (
          <div className="card !p-0 overflow-hidden">
            <div className="section-header flex items-center justify-between">
              <span>🛠 Timetable Builder — Manage Schedule Entries</span>
              <button className="text-xs bg-white text-primary px-3 py-1 rounded font-semibold mr-0" onClick={openAdd}>+ Add Entry</button>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-semibold text-gray-500">Filter:</span>
                {['ALL','BCA','MCA'].map(p => (
                  <button key={p} onClick={() => setFilterProg(p)}
                    className={`px-3 py-1 rounded text-xs font-semibold border transition-all ${
                      filterProg === p ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-300 hover:border-primary'
                    }`}>{p}</button>
                ))}
                <span className="ml-auto text-xs text-gray-400">{manageFiltered.length} entries</span>
              </div>

              {showForm && (
                <div className="mb-5 bg-orange-50 border border-orange-200 rounded p-5">
                  <div className="font-bold text-gray-700 mb-4 text-sm">{editItem ? '✏️ Edit Entry' : '➕ Add New Entry'}</div>
                  <form onSubmit={handleSave} className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1 uppercase tracking-wide">Program</label>
                      <select className="input-field" value={form.program} onChange={setF('program')}>
                        {PROGRAMS.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1 uppercase tracking-wide">Day</label>
                      <select className="input-field" value={form.day} onChange={setF('day')}>
                        {DAYS.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1 uppercase tracking-wide">Time Slot</label>
                      <select className="input-field" value={form.timeSlot} onChange={setF('timeSlot')}>
                        {SLOTS.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1 uppercase tracking-wide">Subject</label>
                      <input className="input-field" placeholder="e.g. Data Structures" value={form.subject} onChange={setF('subject')} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1 uppercase tracking-wide">Faculty ID</label>
                      <input className="input-field" placeholder="BCA-FAC001" value={form.facultyId} onChange={setF('facultyId')} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1 uppercase tracking-wide">Faculty Name</label>
                      <input className="input-field" placeholder="Dr. Smith" value={form.facultyName} onChange={setF('facultyName')} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1 uppercase tracking-wide">Room</label>
                      <input className="input-field" placeholder="Room 101 / CS Lab" value={form.room} onChange={setF('room')} />
                    </div>
                    <div className="col-span-full flex gap-3 mt-1">
                      <button type="submit" className="btn-primary">💾 Save Entry</button>
                      <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="overflow-x-auto rounded border border-gray-200">
                <table className="w-full table-orange">
                  <thead><tr><th>Program</th><th>Day</th><th>Time</th><th>Subject</th><th>Faculty</th><th>Room</th><th>Actions</th></tr></thead>
                  <tbody>
                    {manageFiltered.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-8 text-gray-400">No entries. Add manually or upload CSV.</td></tr>
                    ) : manageFiltered.map(s => (
                      <tr key={s.id}>
                        <td><span className={s.program==='BCA'?'badge-bca':'badge-mca'}>{s.program}</span></td>
                        <td>{s.day}</td>
                        <td className="font-mono text-xs">{s.timeSlot}</td>
                        <td className="font-medium">{s.subject}</td>
                        <td>{s.facultyName}</td>
                        <td>{s.room}</td>
                        <td>
                          <div className="flex gap-2">
                            <button onClick={() => openEdit(s)} className="text-primary hover:underline text-xs font-semibold">Edit</button>
                            <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:underline text-xs font-semibold">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {schedules.length > 0 && (
                <div className="mt-4 flex gap-3">
                  {['BCA','MCA'].map(prog => (
                    <button key={prog} onClick={() => downloadTimetablePdf(schedules.filter(s=>s.program===prog), prog+' Timetable', prog)}
                      className="flex items-center gap-1.5 border border-primary text-primary text-xs font-medium px-4 py-2 rounded hover:bg-primary hover:text-white transition-colors">
                      ⬇ Export {prog} Timetable PDF
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* UPLOAD */}
        {activeTab === 'upload' && (
          <div className="card !p-0 overflow-hidden">
            <div className="section-header">Upload Master Schedule (CSV)</div>
            <div className="p-5">
              <div className="bg-amber-50 border border-amber-200 rounded px-4 py-2.5 mb-4 text-xs text-amber-700">
                ⚠ Uploading a new CSV will replace all existing schedule data.
              </div>
              <UploadZone onUpload={handleUpload} uploading={uploading} />
            </div>
          </div>
        )}

        {/* USERS */}
        {activeTab === 'users' && (
          <div className="space-y-5">
            {/* Faculty section */}
            <div className="card !p-0 overflow-hidden">
              <div className="section-header flex items-center justify-between">
                <span>👨‍🏫 Faculty Members ({faculty.length})</span>
                <button onClick={() => setShowFacForm(!showFacForm)}
                  className="text-xs bg-white text-primary px-3 py-1 rounded font-semibold mr-0">
                  {showFacForm ? '✕ Cancel' : '+ Add Faculty'}
                </button>
              </div>

              {showFacForm && (
                <div className="p-5 bg-blue-50 border-b border-blue-200">
                  <div className="font-bold text-gray-700 mb-3 text-sm">➕ Add New Faculty Member</div>
                  <form onSubmit={handleAddFaculty} className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1 uppercase tracking-wide">Faculty ID *</label>
                      <input className="input-field" placeholder="e.g. BCA-FAC003" value={facForm.username} onChange={setFF('username')} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1 uppercase tracking-wide">Full Name *</label>
                      <input className="input-field" placeholder="Dr. Full Name" value={facForm.fullName} onChange={setFF('fullName')} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1 uppercase tracking-wide">Department</label>
                      <select className="input-field" value={facForm.program} onChange={setFF('program')}>
                        <option>BCA</option><option>MCA</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1 uppercase tracking-wide">Password *</label>
                      <input type="password" className="input-field" placeholder="Min 5 chars" value={facForm.password} onChange={setFF('password')} />
                    </div>
                    <div className="col-span-full flex gap-3">
                      <button type="submit" disabled={facLoading} className="btn-primary">
                        {facLoading ? 'Adding…' : '✅ Add Faculty Member'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full table-orange">
                  <thead><tr><th>Name</th><th>Faculty ID</th><th>Department</th><th>Action</th></tr></thead>
                  <tbody>
                    {faculty.length === 0
                      ? <tr><td colSpan={4} className="text-center py-6 text-gray-400">No faculty found</td></tr>
                      : faculty.map(f => (
                        <tr key={f.id}>
                          <td className="font-medium">{f.fullName}</td>
                          <td className="font-mono text-xs">{f.username}</td>
                          <td><span className={f.program==='BCA'?'badge-bca':'badge-mca'}>{f.program}</span></td>
                          <td><button onClick={() => handleDeleteUser(f.id)} className="btn-danger">Remove</button></td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>

            {/* Students section */}
            <div className="card !p-0 overflow-hidden">
              <div className="section-header">👩‍🎓 Students ({students.length})</div>
              <div className="overflow-x-auto">
                <table className="w-full table-orange">
                  <thead><tr><th>Name</th><th>Reg Number</th><th>Program</th><th>Action</th></tr></thead>
                  <tbody>
                    {students.length === 0
                      ? <tr><td colSpan={4} className="text-center py-6 text-gray-400">No students found</td></tr>
                      : students.map(s => (
                        <tr key={s.id}>
                          <td className="font-medium">{s.fullName}</td>
                          <td className="font-mono text-xs">{s.username}</td>
                          <td><span className={s.program==='BCA'?'badge-bca':'badge-mca'}>{s.program}</span></td>
                          <td><button onClick={() => handleDeleteUser(s.id)} className="btn-danger">Remove</button></td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* FACULTY REQUESTS */}
        {activeTab === 'requests' && (
          <div className="card !p-0 overflow-hidden">
            <div className="section-header">
              📩 Faculty Schedule-Change Requests
              {pendingCount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">{pendingCount} pending</span>
              )}
            </div>
            <div className="p-4">
              {requests.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-4xl mb-3">📭</div>
                  <div>No faculty requests yet.</div>
                  <div className="text-xs mt-1">When faculty submit slot-change requests, they appear here.</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {[...requests].reverse().map(req => (
                    <div key={req.id} className={`border rounded-lg p-4 ${
                      req.status === 'pending'  ? 'border-amber-300 bg-amber-50' :
                      req.status === 'approved' ? 'border-green-300 bg-green-50' :
                                                  'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-gray-800 text-sm">{req.facultyName}</span>
                            <span className="font-mono text-xs text-gray-500">({req.facultyId})</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              req.status === 'pending'  ? 'bg-amber-200 text-amber-800' :
                              req.status === 'approved' ? 'bg-green-200 text-green-800' :
                                                          'bg-gray-200 text-gray-600'
                            }`}>{req.status?.toUpperCase()}</span>
                          </div>
                          <div className="text-xs text-gray-600 mb-1">
                            <strong>Subject:</strong> {req.subject} &nbsp;·&nbsp;
                            <strong>Current:</strong> {req.currentDay}, {req.currentSlot}
                          </div>
                          <div className="text-xs text-gray-600 mb-1">
                            <strong>Requested:</strong> {req.requestedDay}, {req.requestedSlot}
                          </div>
                          {req.reason && <div className="text-xs text-gray-500 italic">"{req.reason}"</div>}
                          <div className="text-[10px] text-gray-400 mt-1">{new Date(req.timestamp).toLocaleString()}</div>
                          {req.status === 'approved' && (
                            <div className="text-xs text-green-700 mt-1 font-medium">✅ Applied: {req.resolvedDay}, {req.resolvedSlot}</div>
                          )}
                        </div>

                        {req.status === 'pending' && (
                          <div className="flex flex-col gap-2 min-w-[180px]">
                            {reqAction?.req.id === req.id ? (
                              <div className="bg-white border border-gray-200 rounded p-3 space-y-2">
                                <div className="text-xs font-semibold text-gray-600">Set new slot:</div>
                                <select className="input-field text-xs py-1" value={reqAction.newDay}
                                  onChange={e => setReqAction(r => ({...r, newDay: e.target.value}))}>
                                  {DAYS.map(d => <option key={d}>{d}</option>)}
                                </select>
                                <select className="input-field text-xs py-1" value={reqAction.newSlot}
                                  onChange={e => setReqAction(r => ({...r, newSlot: e.target.value}))}>
                                  {SLOTS.map(s => <option key={s}>{s}</option>)}
                                </select>
                                <div className="flex gap-2">
                                  <button onClick={applyRequest} className="btn-primary text-xs py-1 flex-1">✅ Apply</button>
                                  <button onClick={() => setReqAction(null)} className="btn-secondary text-xs py-1">✕</button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <button onClick={() => openReqAction(req)}
                                  className="btn-primary text-xs py-1.5">✏️ Review &amp; Apply</button>
                                <button onClick={() => rejectRequest(req.id)}
                                  className="btn-danger text-xs py-1.5">✕ Reject</button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* Request action modal for applying changes */}
    </div>
  );
}
