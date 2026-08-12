import { useEffect, useState } from 'react';
import { view } from '@forge/bridge';
import { normalizeTheme } from '../../shared/renderMermaid.js';

const THEME_OPTIONS = [
  { value: 'default', label: 'Default (auto light/dark)' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'dark', label: 'Dark' },
  { value: 'forest', label: 'Forest' },
  { value: 'base', label: 'Base' },
];

export default function App() {
  const [theme, setTheme] = useState('default');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    view.getContext().then((context) => {
      const current = context?.extension?.config?.theme;
      if (current) setTheme(normalizeTheme(current));
    });
  }, []);

  async function onSave() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await view.submit({
        config: {
          theme: normalizeTheme(theme),
        },
      });
    } catch (err) {
      setError(err?.message || 'Could not save settings.');
      setBusy(false);
    }
  }

  async function onCancel() {
    await view.close();
  }

  return (
    <div className="layout compact">
      <header className="toolbar">
        <div>
          <h1>Diagram settings</h1>
          <p>
            Put Mermaid source in the macro body (preferably a <code>mermaid</code> code block).
            This dialog only changes the theme.
          </p>
        </div>
      </header>

      <label className="field">
        <span>Theme</span>
        <select value={theme} onChange={(e) => setTheme(e.target.value)}>
          {THEME_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {error && <div className="state error">{error}</div>}

      <div className="actions">
        <button type="button" className="ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="button" className="primary" onClick={onSave} disabled={busy}>
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}
