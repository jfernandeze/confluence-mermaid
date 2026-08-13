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

/**
 * Read the Mermaid source out of the macro's saved parameters.
 *
 * The macro is `layout: block`, so it has no body: the source only ever lives in
 * the config the edit modal writes, or in the guestParams an API insert sets.
 * Both spellings are checked because Forge surfaces them at different depths
 * depending on how the node was created.
 */
export function readMacroSource(context) {
  const extension = context?.extension || {};

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
