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

function collectText(node) {
  if (!node) return '';
  if (node.type === 'hardBreak') return '\n';
  if (typeof node.text === 'string') return node.text;
  if (!Array.isArray(node.content)) return '';
  return node.content.map(collectText).join('');
}

function walkCodeBlocks(node, out) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const child of node) walkCodeBlocks(child, out);
    return;
  }
  if (node.type === 'codeBlock') {
    out.push({
      language: (node.attrs?.language || '').toLowerCase(),
      text: collectText(node),
    });
  }
  if (Array.isArray(node.content)) {
    for (const child of node.content) walkCodeBlocks(child, out);
  }
}

function asDocument(body) {
  if (!body) return null;
  if (Array.isArray(body)) {
    return { type: 'doc', version: 1, content: body };
  }
  if (body.type === 'doc') return body;
  if (Array.isArray(body.content)) {
    return { type: 'doc', version: 1, content: body.content };
  }
  // Single node (e.g. one codeBlock / paragraph)
  if (body.type) {
    return { type: 'doc', version: 1, content: [body] };
  }
  return null;
}

/**
 * Prefer a ```mermaid code block from the bodied macro ADF.
 * Fall back to any code block, then to plain text in the body.
 * Preserves hardBreak nodes as newlines (required by Mermaid).
 */
export function extractMermaidFromAdf(body) {
  const doc = asDocument(body);
  if (!doc) return '';

  const blocks = [];
  walkCodeBlocks(doc, blocks);

  const mermaidBlock = blocks.find((block) => block.language === 'mermaid' && block.text.trim());
  if (mermaidBlock) return decodeEntities(mermaidBlock.text).trim();

  const anyBlock = blocks.find((block) => block.text.trim());
  if (anyBlock) return decodeEntities(anyBlock.text).trim();

  const plain = collectText(doc).trim();
  return decodeEntities(plain);
}

export function readMacroSource(context) {
  const extension = context?.extension || {};
  const candidates = [
    extension.macro?.body,
    extension.macro?.adf,
    extension.body,
  ];

  for (const candidate of candidates) {
    const source = extractMermaidFromAdf(candidate);
    if (source) return source;
  }

  // Forge custom config + Connect-style guestParams (useful for API inserts)
  const paramBags = [
    extension.config,
    extension.guestParams,
    extension.parameters?.config,
    extension.parameters?.guestParams,
    extension.parameters,
  ].filter(Boolean);

  for (const bag of paramBags) {
    const source = bag.source ?? bag.Source;
    if (typeof source === 'string' && source.trim()) {
      return decodeEntities(source).trim();
    }
  }

  return '';
}
