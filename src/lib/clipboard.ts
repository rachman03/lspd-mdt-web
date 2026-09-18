/**
 * Safely copies text to the clipboard with fallbacks for iframe sandboxes
 * and environments where navigator.clipboard.writeText is restricted or denied.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Strategy 1: Try modern navigator.clipboard.writeText if available
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // Common in iframes when "clipboard-write" permission is not granted
      console.warn('Modern navigator.clipboard.writeText blocked or failed:', err);
    }
  }

  // Strategy 2: Fallback to document.execCommand('copy') via an offscreen textarea
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Position fixed offscreen to avoid scrolling or viewport layout shifts
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '-999999px';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    textArea.style.opacity = '0';
    textArea.setAttribute('readonly', '');

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, text.length);

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);

    if (successful) {
      return true;
    }
  } catch (err) {
    console.warn('document.execCommand fallback copy failed:', err);
  }

  return false;
}
