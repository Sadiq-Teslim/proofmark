import { useEffect, useRef, useState } from 'react';
import { Loader2, UploadCloud } from 'lucide-react';

export function Spinner({ size = 18 }) {
  return <Loader2 className="app-spin" size={size} />;
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="app-empty">
      {Icon && <span className="app-empty-icon"><Icon size={24} /></span>}
      <strong>{title}</strong>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function Dropzone({
  file,
  onFile,
  hint = 'PNG, JPG or WEBP - up to 25MB',
  accept = 'image/*',
  label = 'Drop an image or click to upload',
  previewType = 'image',
}) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const preview = file ? URL.createObjectURL(file) : null;

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  return (
    <div
      className={`app-dropzone ${drag ? 'is-drag' : ''} ${file ? 'has-file' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); onFile(e.dataTransfer.files?.[0]); }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') inputRef.current?.click(); }}
    >
      {preview && previewType === 'video' ? (
        <video src={preview} className="app-dropzone-preview app-dropzone-video" muted playsInline />
      ) : preview ? (
        <img src={preview} alt="Selected preview" className="app-dropzone-preview" />
      ) : (
        <span className="app-dropzone-icon"><UploadCloud size={26} /></span>
      )}
      <div className="app-dropzone-text">
        <strong>{file ? file.name : label}</strong>
        <span>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : hint}</span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => onFile(e.target.files?.[0])}
      />
    </div>
  );
}

export const formatDate = (date) => {
  if (!date) return '-';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    .format(new Date(date));
};

export const formatDateTime = (date) => {
  if (!date) return '-';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(date));
};

export const relativeTime = (date) => {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(date);
};

// Download a blob response from the API as a file.
export const downloadBlob = (data, filename) => {
  const url = URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
