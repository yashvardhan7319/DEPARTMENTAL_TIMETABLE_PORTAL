import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function downloadTimetablePdf(schedules, title, filterLabel = '') {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Header bar
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, 297, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Departmental Timetable Portal', 148.5, 10, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${title}${filterLabel ? ' | ' + filterLabel : ''}`, 148.5, 17, { align: 'center' });

  // Subtitle
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

  // Sort by day order then time
  const sorted = [...schedules].sort((a, b) => {
    const di = DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day);
    if (di !== 0) return di;
    return a.timeSlot.localeCompare(b.timeSlot);
  });

  const rows = sorted.map(s => [
    s.program, s.day, s.timeSlot, s.subject, s.facultyName, s.facultyId, s.room
  ]);

  autoTable(doc, {
    startY: 32,
    head: [['Program', 'Day', 'Time Slot', 'Subject', 'Faculty Name', 'Faculty ID', 'Room']],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 28 },
      2: { cellWidth: 30 },
      3: { cellWidth: 60 },
      4: { cellWidth: 50 },
      5: { cellWidth: 32 },
      6: { cellWidth: 25 },
    },
    margin: { top: 32, left: 14, right: 14 },
    didDrawPage: (data) => {
      // Footer
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(`Page ${data.pageNumber}`, 148.5, 205, { align: 'center' });
    },
  });

  const filename = `${title.replace(/\s+/g, '_')}_Timetable_${Date.now()}.pdf`;
  doc.save(filename);
}
