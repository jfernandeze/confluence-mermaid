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
  if (typeof node.text === 'string') return node.text;
  if (!Array.isArray(node.content)) return '';
  return node.content.map(collectText).join('');
}

function walkCodeBlocks(node, out) {
  if (!node || typeof node !== 'object') return;
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

/**
 * Prefer a ```mermaid code block from the bodied macro ADF.
 * Fall back to any code block, then to plain text in the body.
 */
export function extractMermaidFromAdf(body) {
  if (!body || typeof body !== 'object') return '';

  const blocks = [];
  walkCodeBlocks(body, blocks);

  const mermaidBlock = blocks.find((block) => block.language === 'mermaid' && block.text.trim());
  if (mermaidBlock) return decodeEntities(mermaidBlock.text).trim();

  const anyBlock = blocks.find((block) => block.text.trim());
  if (anyBlock) return decodeEntities(anyBlock.text).trim();

  const plain = collectText(body).trim();
  return decodeEntities(plain);
}

export function readMacroSource(context) {
  const extension = context?.extension || {};
  const fromBody = extractMermaidFromAdf(extension.macro?.body);
  if (fromBody) return fromBody;

  const config = extension.config || {};
  if (typeof config.source === 'string' && config.source.trim()) {
    return decodeEntities(config.source).trim();
  }

  return '';
}
