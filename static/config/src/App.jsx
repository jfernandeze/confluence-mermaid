import { useEffect, useMemo, useState } from 'react';
import { view } from '@forge/bridge';
import {
  STARTER_DIAGRAM,
  normalizeTheme,
  renderMermaid,
} from '../../shared/renderMermaid.js';

const THEME_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'dark', label: 'Dark' },
  { value: 'forest', label: 'Forest' },
  { value: 'base', label: 'Base' },
];

export default function App() {
  const [source, setSource] = useState(STARTER_DIAGRAM);
  const [theme, setTheme] = useState('default');
  const [preview, setPreview] = useState({ svg: '', error: null, empty: false });
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        const context = await view.getContext();
        const config = context?.extension?.config || {};
        if (cancelled) return;
        if (typeof config.source === 'string' && config.source.trim()) {
          setSource(config.source);
        }
        if (config.theme) {
          setTheme(normalizeTheme(config.theme));
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return undefined;

    let cancelled = false;
    const timer = setTimeout(async () => {
      const result = await renderMermaid(source, theme);
      if (!cancelled) setPreview(result);
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [source, theme, ready]);

  const canSave = useMemo(() => source.trim().length > 0 && !preview.error, [source, preview.error]);

  async function onSave() {
    if (!canSave || busy) return;
    setBusy(true);
    try {
      await view.submit({
        config: {
          source,
          theme: normalizeTheme(theme),
        },
      });
    } catch (err) {
      setPreview({
        svg: '',
        empty: false,
        error: err?.message || 'Could not save the diagram.',
      });
      setBusy(false);
    }
  }

  async function onCancel() {
    await view.close();
  }

  return (
    <div className="layout">
      <header className="toolbar">
        <div>
          <h1>Mermaid diagram</h1>
          <p>Source stays on the page. Rendering happens in the browser only.</p>
        </div>
        <div className="actions">
          <label className="field inline">
            <span>Theme</span>
            <select value={theme} onChange={(e) => setTheme(e.target.value)}>
              {THEME_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="primary" onClick={onSave} disabled={!canSave || busy}>
            {busy ? 'Saving…' : 'Save diagram'}
          </button>
        </div>
      </header>

      <div className="panes">
        <section className="pane">
          <div className="pane-label">Source</div>
          <textarea
            value={source}
            onChange={(e) => setSource(e.target.value)}
            spellCheck={false}
            aria-label="Mermaid source"
            placeholder="flowchart LR&#10;  A --> B"
          />
        </section>

        <section className="pane">
          <div className="pane-label">Preview</div>
          <div className="preview">
            {preview.empty && <div className="state">Paste Mermaid source to preview.</div>}
            {preview.error && <div className="state error">{preview.error}</div>}
            {!preview.empty && !preview.error && (
              <div className="diagram" dangerouslySetInnerHTML={{ __html: preview.svg }} />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
