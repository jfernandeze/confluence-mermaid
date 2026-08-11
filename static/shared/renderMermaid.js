import mermaid from 'mermaid';
import DOMPurify from 'dompurify';

let initializedFor = null;

const THEMES = new Set(['default', 'neutral', 'dark', 'forest', 'base']);

export function normalizeTheme(theme) {
  if (theme && THEMES.has(theme)) return theme;
  return 'default';
}

export async function renderMermaid(source, theme = 'default') {
  const code = (source || '').trim();
  if (!code) {
    return { svg: '', error: null, empty: true };
  }

  const resolvedTheme = normalizeTheme(theme);
  const initKey = resolvedTheme;

  if (initializedFor !== initKey) {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: resolvedTheme,
      fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif',
    });
    initializedFor = initKey;
  }

  try {
    const id = `mermaid-${Math.random().toString(36).slice(2)}`;
    const { svg } = await mermaid.render(id, code);
    const clean = DOMPurify.sanitize(svg, {
      USE_PROFILES: { svg: true, svgFilters: true },
      ADD_TAGS: ['foreignObject'],
    });
    return { svg: clean, error: null, empty: false };
  } catch (err) {
    const message = err?.message || String(err);
    return { svg: '', error: message, empty: false };
  }
}

export const STARTER_DIAGRAM = `flowchart LR
  A[Write Mermaid] --> B[Save macro]
  B --> C[Rendered in browser]`;
