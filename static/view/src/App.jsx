import { useEffect, useState } from 'react';
import { view } from '@forge/bridge';
import { readMacroSource } from '../../shared/extractMermaid.js';
import { normalizeTheme, renderMermaid } from '../../shared/renderMermaid.js';

export default function App() {
  const [status, setStatus] = useState({ kind: 'loading', message: 'Loading diagram…' });
  const [svg, setSvg] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const context = await view.getContext();
        const source = readMacroSource(context);
        let theme =
          context?.extension?.config?.theme ||
          context?.extension?.guestParams?.theme;

        if (!theme || theme === 'default') {
          try {
            const colorMode = await view.theme?.getColorMode?.();
            if (colorMode === 'dark') theme = 'dark';
          } catch {
            // optional
          }
        }

        const result = await renderMermaid(source, normalizeTheme(theme));
        if (cancelled) return;

        if (result.empty) {
          setSvg('');
          setStatus({
            kind: 'empty',
            message:
              'Add Mermaid source inside this macro body (a ```mermaid code block works best), then publish.',
          });
          return;
        }

        if (result.error) {
          setSvg('');
          setStatus({ kind: 'error', message: result.error });
          return;
        }

        setSvg(result.svg);
        setStatus({ kind: 'ready', message: '' });
      } catch (err) {
        if (!cancelled) {
          setStatus({
            kind: 'error',
            message: err?.message || 'Failed to load macro content.',
          });
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="shell">
      {status.kind === 'ready' ? (
        <div className="diagram" dangerouslySetInnerHTML={{ __html: svg }} />
      ) : (
        <div className={`state${status.kind === 'error' ? ' error' : ''}`}>
          {status.message}
        </div>
      )}
    </div>
  );
}
