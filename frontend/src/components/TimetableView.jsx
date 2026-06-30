import React from 'react';
import { downloadTimetablePdf } from '../services/pdfGenerator';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

const SLOT_ORDER = [
  '9:00-10:00 AM','10:00-11:00 AM','11:00 AM-12:00 PM','12:00-1:00 PM',
  '2:00-3:00 PM','3:00-4:00 PM','4:00-5:00 PM',
];

function sortSlots(slots) {
  return [...slots].sort((a, b) => {
    const ai = SLOT_ORDER.indexOf(a), bi = SLOT_ORDER.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    return 0;
  });
}

function cellBg(s) {
  const isLab = s.room?.toLowerCase().includes('lab');
  if (isLab) return '#e8f5e9';
  const colors = ['#e3eeff','#fff3e0','#f3e5f5','#e0f7fa','#fce4ec','#f9fbe7'];
  return colors[DAYS.indexOf(s.day) % colors.length];
}
const typeLabel      = (s) => s.room?.toLowerCase().includes('lab') ? 'LAB' : 'THEORY';
const typeLabelColor = (s) => s.room?.toLowerCase().includes('lab') ? '#2e7d32' : '#e07020';

const LUNCH_SLOT   = '1:00-2:00 PM';
const BEFORE_LUNCH = '12:00-1:00 PM';
const AFTER_LUNCH  = '2:00-3:00 PM';

export default function TimetableView({ schedules, loading, title = 'Timetable', filterLabel = '' }) {
  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
    </div>
  );

  if (!schedules.length) return (
    <div className="text-center py-16 text-gray-400">
      <div className="text-4xl mb-3">📅</div>
      <div>No schedule data available.</div>
    </div>
  );

  const uniqueSlots  = [...new Set(schedules.map(s => s.timeSlot))];
  const timeSlots    = sortSlots(uniqueSlots);
  const hasAfternoon = timeSlots.some(s => SLOT_ORDER.indexOf(s) >= SLOT_ORDER.indexOf(AFTER_LUNCH));
  const hasMorning   = timeSlots.some(s => SLOT_ORDER.indexOf(s) <= SLOT_ORDER.indexOf(BEFORE_LUNCH));
  const showLunch    = hasMorning && hasAfternoon;

  const lookup = {};
  schedules.forEach(s => {
    lookup[s.day]             = lookup[s.day]             || {};
    lookup[s.day][s.timeSlot] = lookup[s.day][s.timeSlot] || [];
    lookup[s.day][s.timeSlot].push(s);
  });

  const rows = [];
  timeSlots.forEach(slot => {
    if (showLunch && slot === AFTER_LUNCH) rows.push({ type: 'lunch' });
    rows.push({ type: 'slot', slot });
  });

  const handleDownload = () => downloadTimetablePdf(schedules, title, filterLabel);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="bg-primary text-white font-semibold text-sm px-5 py-2 rounded-sm">
          Weekly Timetable {filterLabel && <span className="text-white/70 font-normal ml-1">— {filterLabel}</span>}
        </div>
        <div className="flex gap-2">
          <button onClick={handleDownload}
            className="flex items-center gap-1.5 border border-primary text-primary text-xs font-medium px-4 py-2 rounded hover:bg-primary hover:text-white transition-colors">
            ⬇ Download PDF
          </button>
          <button onClick={() => window.print()}
            className="flex items-center gap-1.5 border border-gray-300 text-gray-600 text-xs font-medium px-4 py-2 rounded hover:bg-gray-50 transition-colors">
            🖨 Print
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="w-full text-xs border-collapse" style={{ minWidth: 720 }}>
          <thead>
            <tr>
              <th className="bg-primary text-white px-3 py-3 text-center font-semibold border border-orange-400 w-28">Time</th>
              {DAYS.map(d => (
                <th key={d} className="bg-primary text-white px-3 py-3 text-center font-semibold border border-orange-400">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => {
              if (row.type === 'lunch') return (
                <tr key="lunch">
                  <td className="bg-gray-100 text-gray-500 px-3 py-2.5 text-center font-semibold border border-gray-200 whitespace-nowrap text-xs">{LUNCH_SLOT}</td>
                  {DAYS.map(d => (
                    <td key={d} className="bg-gray-100 text-center text-gray-400 border border-gray-200 py-2.5 font-semibold tracking-wide text-xs">LUNCH BREAK</td>
                  ))}
                </tr>
              );
              const { slot } = row;
              return (
                <tr key={slot}>
                  <td className="bg-gray-50 text-primary px-3 py-2 text-center font-semibold border border-gray-200 whitespace-nowrap">{slot}</td>
                  {DAYS.map(d => {
                    const entries = lookup[d]?.[slot] || [];
                    if (!entries.length) return <td key={d} className="border border-gray-100 bg-white" />;
                    return (
                      <td key={d} className="border border-gray-200 p-0 align-top">
                        {entries.map((e, ei) => (
                          <div key={ei} className="p-2 text-center" style={{ background: cellBg(e), minHeight: 62 }}>
                            <div className="font-bold text-gray-800 text-xs leading-snug mb-0.5">{e.subject}</div>
                            {e.facultyName && <div className="text-gray-600 text-[10px] leading-snug">{e.facultyName}</div>}
                            {e.room        && <div className="text-gray-500 text-[10px] leading-snug">{e.room}</div>}
                            <div className="mt-1 text-[9px] font-bold tracking-widest" style={{ color: typeLabelColor(e) }}>{typeLabel(e)}</div>
                            {e.program && <div className="mt-0.5"><span className={`text-[8px] font-bold px-1 py-0.5 rounded ${e.program==='BCA'?'bg-blue-100 text-blue-700':'bg-purple-100 text-purple-700'}`}>{e.program}</span></div>}
                          </div>
                        ))}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
