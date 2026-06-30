import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

export default function UploadZone({ onUpload, uploading }) {
  const [fileName, setFileName] = useState('');

  const onDrop = useCallback((accepted) => {
    if (accepted.length > 0) {
      setFileName(accepted[0].name);
      onUpload(accepted[0]);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200
        ${isDragActive ? 'border-primary bg-blue-50' : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'}
        ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-3">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl
          ${isDragActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
          📂
        </div>
        {uploading ? (
          <div className="flex items-center gap-2 text-primary font-medium">
            <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
            Uploading &amp; parsing CSV…
          </div>
        ) : isDragActive ? (
          <p className="text-primary font-semibold">Drop the CSV file here</p>
        ) : (
          <>
            <p className="text-gray-700 font-semibold">
              Drag &amp; drop a CSV file, or <span className="text-primary">browse</span>
            </p>
            <p className="text-sm text-gray-400">Accepts .csv files only</p>
          </>
        )}
        {fileName && !uploading && (
          <p className="text-xs text-green-600 font-medium mt-1">✓ Last uploaded: {fileName}</p>
        )}
      </div>

      {/* CSV Format hint */}
      <div className="mt-5 text-left bg-gray-50 rounded-xl px-4 py-3 text-xs text-gray-500 font-mono">
        <p className="font-semibold text-gray-600 mb-1">Expected CSV format:</p>
        <p>program,day,timeSlot,subject,facultyId,facultyName,room</p>
        <p>BCA,Monday,09:00-10:00,Mathematics,BCA-FAC001,Dr. Smith,Room 101</p>
      </div>
    </div>
  );
}
