import { useEffect, useState } from 'react';
import { view } from '@forge/bridge';
import { normalizeTheme, renderMermaid } from '../../shared/renderMermaid.js';

export default function App() {
  const [status, setStatus] = useState({ kind: 'loading', message: 'Loading diagram…' });
  const [svg, setSvg] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const context = await view.getContext();
        const config = context?.extension?.config || {};
        const source = config.source || '';
        const theme = normalizeTheme(config.theme);

        const result = await renderMermaid(source, theme);
        if (cancelled) return;

        if (result.empty) {
          setSvg('');
          setStatus({
            kind: 'empty',
            message: 'No diagram yet. Edit this macro and paste Mermaid source.',
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
            message: err?.message || 'Failed to load macro configuration.',
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
