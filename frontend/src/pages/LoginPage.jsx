import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginApi, registerApi } from '../services/api';

const ROLE_HINTS = {
  admin:   { label: 'Admin',   user: 'admin',       pass: 'admin123',  noReg: true },
  faculty: { label: 'Faculty', user: 'BCA-FAC001',  pass: '12345',     noReg: true },
  student: { label: 'Student', user: 'Reg Number',  pass: 'Password',  noReg: false },
};

const COURSES   = ['BCA', 'MCA'];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const isAllSameDigit = (v) => /^(\d)\1+$/.test(v);
const isSequential   = (v) => v === '1234567890' || v === '0987654321' || v === '9876543210';
const INVALID_PHONES = new Set(['1111111111','2222222222','3333333333','4444444444',
  '5555555555','6666666666','7777777777','8888888888','0000000000','9999999999']);

function validatePhone(ph) {
  if (!ph.trim())              return 'Phone number is required.';
  if (!/^\d{10}$/.test(ph))   return 'Phone must be exactly 10 digits, numbers only.';
  if (isAllSameDigit(ph))      return 'Phone is invalid — all same digits not allowed.';
  if (isSequential(ph))        return 'Phone is invalid — sequential digits not allowed.';
  if (INVALID_PHONES.has(ph))  return 'Phone is invalid. Enter a real mobile number.';
  if (!/^[6-9]/.test(ph))      return 'Phone must start with 6, 7, 8, or 9.';
  return '';
}

function validateName(v, label) {
  if (!v.trim())                               return `${label} is required.`;
  if (!/^[A-Za-z\s]{2,40}$/.test(v))          return `${label}: letters only, 2–40 chars.`;
  const stripped = v.replace(/\s/g, '');
  if (stripped.length > 1 && /^(.)\1+$/.test(stripped)) return `${label} looks invalid.`;
  return '';
}

export default function LoginPage() {
  const navigate  = useNavigate();
  const { login } = useAuth();

  const [tab,     setTab]     = useState('student');
  const [form,    setForm]    = useState({
    username: '', password: '', confirmPassword: '',
    firstName: '', lastName: '', regNo: '',
    semester: '1', course: 'BCA', section: 'A', email: '', phone: ''
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showReg, setShowReg] = useState(false);

  const hint = ROLE_HINTS[tab];
  const set  = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleTabChange = (t) => { setTab(t); setError(''); };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!form.username.trim()) { setError('Username is required.'); return; }
    if (!form.password)        { setError('Password is required.'); return; }
    setLoading(true); setError('');
    try {
      const res  = await loginApi({ username: form.username, password: form.password });
      const data = res.data;
      login(data);
      if      (data.role === 'ADMIN')   navigate('/admin');
      else if (data.role === 'FACULTY') navigate('/faculty');
      else                              navigate('/student');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials.');
    } finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    const nameErr  = validateName(form.firstName, 'First name');
    const lnameErr = form.lastName.trim() ? validateName(form.lastName, 'Last name') : '';
    const phoneErr = validatePhone(form.phone.trim());
    if (nameErr)                                    { setError(nameErr);  return; }
    if (lnameErr)                                   { setError(lnameErr); return; }
    if (!form.regNo.trim())                         { setError('Registration number is required.'); return; }
    if (!/^\d{9}$/.test(form.regNo.trim()))         { setError('Reg No. must be exactly 9 digits (e.g. 202300287).'); return; }
    if (!form.email.trim())                         { setError('Email is required.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) { setError('Enter a valid email address.'); return; }
    if (phoneErr)                                   { setError(phoneErr); return; }
    if (!form.password)                             { setError('Password is required.'); return; }
    if (form.password.length < 6)                   { setError('Password must be at least 6 characters.'); return; }
    if (form.password !== form.confirmPassword)     { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const res = await registerApi({
        username: form.regNo,
        password: form.password,
        fullName: `${form.firstName} ${form.lastName}`.trim(),
        program: form.course
      });
      login(res.data);
      navigate('/student');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally { setLoading(false); }
  };

  const phoneInline = form.phone ? validatePhone(form.phone.trim()) : '';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#2a2a2a' }}>
      <div className="bg-primary px-6 py-3 flex items-center gap-3">
        <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center font-bold text-white text-sm">SM</div>
        <div>
          <div className="text-xs text-white/70 leading-none">smit's™</div>
          <div className="text-white font-bold text-lg leading-tight">DPT Portal<span className="text-white/60 text-sm">®</span></div>
          <div className="text-white/70 text-xs">The cornerstone to an effective quality assurance system for higher education</div>
        </div>
        <div className="ml-auto flex gap-3">
          <button className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors">✏️</button>
          <button className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors">🎓</button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl bg-white rounded shadow-xl overflow-hidden flex">
          <div className="hidden md:flex flex-col items-center justify-center bg-gray-50 w-1/2 p-10 border-r border-gray-100">
            <div className="w-44 h-44 bg-primary rounded-full flex items-center justify-center text-white font-bold text-5xl shadow-orange mb-6">DPT™</div>
            <div className="text-center">
              <div className="text-xs text-primary font-semibold tracking-widest mb-1">smit's™ DPT Portal®</div>
              <div className="text-xl font-bold text-gray-800 mb-2">Departmental Timetable Portal</div>
              <div className="text-sm text-gray-500 leading-relaxed">
                Centralized platform for academic scheduling,<br />course information &amp; faculty management.
              </div>
              <div className="mt-5 flex gap-3 justify-center">
                {['BCA', 'MCA'].map(c => (
                  <span key={c} className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full">{c}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 p-8">
            <div className="text-center mb-6">
              <div className="text-xs text-primary font-semibold">smit's™</div>
              <div className="text-2xl font-bold text-gray-800">DPT Portal<span className="text-gray-400 text-base">®</span></div>
              <div className="text-gray-400 text-xs">The cornerstone to an effective quality assurance system</div>
            </div>

            <div className="flex gap-2 mb-6">
              {['student', 'faculty', 'admin'].map(r => (
                <button key={r} onClick={() => handleTabChange(r)}
                  className={`flex-1 py-2 rounded text-sm font-semibold transition-all capitalize border ${
                    tab === r ? 'bg-primary text-white border-primary' : 'bg-white text-gray-500 border-gray-200 hover:border-primary hover:text-primary'
                  }`}>
                  {r === 'student' && '🎓 '}{r === 'faculty' && '👨‍🏫 '}{r === 'admin' && '🔐 '}
                  {ROLE_HINTS[r].label}
                </button>
              ))}
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 rounded px-3 py-2 mb-4 text-xs font-medium">
                ⚠ {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1 uppercase tracking-wide">User Name</label>
                <input className="input-field" placeholder={hint.user} value={form.username} onChange={set('username')} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1 uppercase tracking-wide">Password</label>
                <input type="password" className="input-field" placeholder="Enter password" value={form.password} onChange={set('password')} />
              </div>
              <div className="flex items-center gap-3 pt-1">
                <button type="submit" disabled={loading}
                  className="bg-gray-800 hover:bg-gray-900 text-white font-semibold px-6 py-2.5 rounded text-sm transition-colors disabled:opacity-50 flex items-center gap-2">
                  {loading ? <><span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" /> Processing…</> : 'Signin'}
                </button>
                <button type="button" className="text-primary text-sm hover:underline font-medium">Forget Password??</button>
              </div>
              <div className="text-center text-gray-400 text-xs">OR</div>
              {!hint.noReg && (
                <button type="button" onClick={() => { setShowReg(true); setError(''); }}
                  className="w-full border-2 border-primary text-primary hover:bg-primary hover:text-white font-semibold py-2.5 rounded text-sm transition-all">
                  + Create Account
                </button>
              )}
            </form>
            <div className="mt-5 bg-amber-50 border border-amber-200 rounded px-3 py-2 text-xs text-amber-700">
              <strong>Note:</strong> For student use registration number as Username and 123 as default password.
            </div>
          </div>
        </div>
      </div>

      {showReg && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden" style={{maxHeight:'90vh',overflowY:'auto'}}>
            <div className="bg-primary px-6 py-4 flex items-center justify-between sticky top-0 z-10">
              <div>
                <div className="text-white font-bold text-lg">Create New Account</div>
                <div className="text-white/80 text-xs">Register on SMIT DPT Portal</div>
              </div>
              <button onClick={() => { setShowReg(false); setError(''); }}
                className="w-7 h-7 bg-white/30 hover:bg-white/50 rounded-full flex items-center justify-center text-white font-bold transition-colors">×</button>
            </div>
            <form onSubmit={handleRegister} className="p-6 space-y-4">
              {error && <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">⚠ {error}</div>}

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Account Type</label>
                <select className="input-field" disabled><option>Student</option></select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">First Name *</label>
                  <input className="input-field" placeholder="First name" value={form.firstName} onChange={set('firstName')} />
                  {form.firstName && validateName(form.firstName,'First name') && (
                    <p className="text-red-500 text-[10px] mt-0.5">{validateName(form.firstName,'First name')}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Last Name</label>
                  <input className="input-field" placeholder="Last name" value={form.lastName} onChange={set('lastName')} />
                  {form.lastName && validateName(form.lastName,'Last name') && (
                    <p className="text-red-500 text-[10px] mt-0.5">{validateName(form.lastName,'Last name')}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Registration No. *</label>
                  <input className={`input-field ${form.regNo && !/^\d{9}$/.test(form.regNo) ? 'border-red-400' : ''}`}
                    placeholder="e.g. 202300287"
                    value={form.regNo}
                    onChange={(e) => setForm(f => ({ ...f, regNo: e.target.value.replace(/\D/g, '').slice(0,9) }))} />
                  {form.regNo && !/^\d{9}$/.test(form.regNo) && (
                    <p className="text-red-500 text-[10px] mt-0.5">Must be exactly 9 digits</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Semester *</label>
                  <select className="input-field" value={form.semester} onChange={set('semester')}>
                    {SEMESTERS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Course *</label>
                  <select className="input-field" value={form.course} onChange={set('course')}>
                    {COURSES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Section</label>
                  <select className="input-field" value={form.section} onChange={set('section')}>
                    <option>A</option><option>B</option><option>C</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Email *</label>
                  <input className={`input-field ${form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email) ? 'border-red-400' : ''}`}
                    placeholder="your@email.com" value={form.email} onChange={set('email')} />
                  {form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email) && (
                    <p className="text-red-500 text-[10px] mt-0.5">Invalid email</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Phone *</label>
                  <input className={`input-field ${phoneInline ? 'border-red-400' : ''}`}
                    placeholder="e.g. 9876543210"
                    value={form.phone}
                    onChange={(e) => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g,'').slice(0,10) }))} />
                  {phoneInline && <p className="text-red-500 text-[10px] mt-0.5">{phoneInline}</p>}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded px-3 py-2 text-[11px] text-blue-700">
                ℹ️ Phone must be 10 digits, start with 6–9. Numbers like <strong>9999999999</strong> or <strong>1234567890</strong> are <strong>not valid</strong>.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Password *</label>
                  <input type="password" className={`input-field ${form.password && form.password.length < 6 ? 'border-red-400' : ''}`}
                    placeholder="Min 6 characters" value={form.password} onChange={set('password')} />
                  {form.password && form.password.length < 6 && <p className="text-red-500 text-[10px] mt-0.5">Min 6 characters</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Confirm Password *</label>
                  <input type="password" className={`input-field ${form.confirmPassword && form.confirmPassword !== form.password ? 'border-red-400' : ''}`}
                    placeholder="Repeat password" value={form.confirmPassword} onChange={set('confirmPassword')} />
                  {form.confirmPassword && form.confirmPassword !== form.password && <p className="text-red-500 text-[10px] mt-0.5">Passwords don't match</p>}
                </div>
              </div>

              <div className="flex gap-3 pt-2 justify-end">
                <button type="button" onClick={() => { setShowReg(false); setError(''); }} className="btn-outline-orange">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Creating…' : 'Create Account →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
