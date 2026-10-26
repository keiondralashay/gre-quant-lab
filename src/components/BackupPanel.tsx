import { useRef, useState } from 'react';
import { exportProgress, replaceProgress, useProgress, validateBackup, type BackupCheck } from '../lib/progress';

const day = (ts?: number) => (ts ? new Date(ts).toLocaleDateString() : '—');

/** Export saved progress to a JSON file, or restore it from one after confirmation. */
export function BackupPanel() {
  const progress = useProgress();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Extract<BackupCheck, { ok: true }> | null>(null);
  const [message, setMessage] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null);

  const download = () => {
    const blob = new Blob([exportProgress()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gre-quant-progress-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage({ tone: 'ok', text: `Exported ${progress.attempts.length} recorded attempts.` });
  };

  const choose = async (file: File | undefined) => {
    setPending(null);
    setMessage(null);
    if (!file) return;
    const check = validateBackup(await file.text());
    if (fileRef.current) fileRef.current.value = '';
    if (!check.ok) setMessage({ tone: 'bad', text: `Nothing was imported. ${check.error} Your saved progress is unchanged.` });
    else setPending(check);
  };

  const confirm = () => {
    if (!pending) return;
    const saved = replaceProgress(pending.progress);
    setPending(null);
    setMessage(
      saved
        ? { tone: 'ok', text: `Progress restored: ${pending.summary.attempts} attempts.` }
        : { tone: 'bad', text: 'The browser would not save the backup (storage may be full or blocked). Your saved progress is unchanged.' },
    );
  };

  return (
    <section className="card" aria-labelledby="backup-h">
      <h3 id="backup-h">Back up and restore progress</h3>
      <p className="note">Progress is saved only in this browser. Export a backup file regularly, and import it to restore your progress here or on another device.</p>
      <div className="actions">
        <button className="btn" onClick={download}>
          Export Progress
        </button>
        <label className="btn">
          Import Progress
          <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" aria-label="Import Progress file" onChange={(e) => void choose(e.target.files?.[0])} />
        </label>
      </div>
      {pending && (
        <div className="feedback feedback-partial" role="alertdialog" aria-labelledby="backup-confirm">
          <div className="feedback-title" id="backup-confirm">
            Replace your saved progress?
          </div>
          <p>
            The file is valid: {pending.summary.attempts} attempts ({pending.summary.answers} answers, {pending.summary.guidedRuns} guided walkthroughs), {pending.summary.lessonsVisited} lessons visited,{' '}
            {pending.summary.sessions} timed sessions, recorded {day(pending.summary.firstTs)} to {day(pending.summary.lastTs)}
            {pending.summary.exportedAt ? `; exported ${day(Date.parse(pending.summary.exportedAt))}` : ''}.
          </p>
          <p>
            This replaces the {progress.attempts.length} attempts currently saved in this browser. Export them first if you want to keep them.
          </p>
          <div className="actions">
            <button className="btn btn-primary" onClick={confirm}>
              Replace my progress
            </button>
            <button className="btn" onClick={() => setPending(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {message && (
        <p className={`feedback ${message.tone === 'ok' ? 'feedback-correct' : 'feedback-incorrect'}`} role={message.tone === 'bad' ? 'alert' : 'status'}>
          {message.text}
        </p>
      )}
    </section>
  );
}
