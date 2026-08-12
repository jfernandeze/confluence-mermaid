import { useEffect, useState } from 'react';
import { view } from '@forge/bridge';
import { normalizeTheme, renderMermaid } from '../../shared/renderMermaid.js';

function decodeEntities(value) {
  if (!value || typeof value !== 'string') return '';
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function readConfig(context) {
  const extension = context?.extension || {};
  const candidates = [
    extension.config,
    extension.macro?.params,
    extension.parameters?.config,
    extension.parameters,
  ].filter(Boolean);

  for (const candidate of candidates) {
    const source = candidate.source ?? candidate.Source;
    if (typeof source === 'string' && source.trim()) {
      return {
        source: decodeEntities(source),
        theme: candidate.theme ?? candidate.Theme,
      };
    }
  }

  return {
    source: '',
    theme: undefined,
  };
}

export default function App() {
  const [status, setStatus] = useState({ kind: 'loading', message: 'Loading diagram…' });
  const [svg, setSvg] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const context = await view.getContext();
        const { source, theme: configTheme } = readConfig(context);

        let theme = configTheme;
        if (!theme || theme === 'default') {
          try {
            const colorMode = await view.theme?.getColorMode?.();
            if (colorMode === 'dark') theme = 'dark';
          } catch {
            // Theme bridge is optional; keep configured/default theme.
          }
        }

        const result = await renderMermaid(source, normalizeTheme(theme));
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
