/**
 * LeetCode AI Documentation Generator
 * Frontend application logic
 */

(function () {
  'use strict';

  /* ─── DOM refs ─────────────────────────────── */
  const codeInput     = document.getElementById('code-input');
  const lineNumbers   = document.getElementById('line-numbers');
  const codeStats     = document.getElementById('code-stats');
  const urlInput      = document.getElementById('problem-url');
  const langSelect    = document.getElementById('language');
  const generateBtn   = document.getElementById('generate-btn');
  const errorBox      = document.getElementById('error-box');
  const errorText     = document.getElementById('error-text');
  const emptyState    = document.getElementById('empty-state');
  const resultContent = document.getElementById('result-content');
  const copyBtn       = document.getElementById('copy-btn');
  const downloadBtn   = document.getElementById('download-btn');
  const docOutputText = document.getElementById('doc-output-text');
  const docLangTag    = document.getElementById('doc-lang-tag');
  const difficultyBadge = document.getElementById('difficulty-badge');
  const statTime      = document.getElementById('stat-time');
  const statSpace     = document.getElementById('stat-space');
  const statProblem   = document.getElementById('stat-problem');

  /* ─── State ─────────────────────────────────── */
  let lastFormattedOutput = '';
  let lastProblemName     = '';

  /* ─── Line numbers & stats ──────────────────── */
  function updateEditorMeta() {
    const lines = codeInput.value.split('\n');
    const count = lines.length;
    const chars = codeInput.value.length;

    // Update line numbers
    lineNumbers.textContent = Array.from({ length: count }, (_, i) => i + 1).join('\n');

    // Update stats
    codeStats.textContent = `${count} line${count !== 1 ? 's' : ''} · ${chars.toLocaleString()} character${chars !== 1 ? 's' : ''}`;
  }

  codeInput.addEventListener('input', updateEditorMeta);
  codeInput.addEventListener('scroll', () => {
    lineNumbers.scrollTop = codeInput.scrollTop;
  });

  // Tab key support in textarea
  codeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = codeInput.selectionStart;
      const end   = codeInput.selectionEnd;
      codeInput.value = codeInput.value.substring(0, start) + '    ' + codeInput.value.substring(end);
      codeInput.selectionStart = codeInput.selectionEnd = start + 4;
      updateEditorMeta();
    }
  });

  // Initialize
  updateEditorMeta();

  /* ─── Error handling ────────────────────────── */
  function showError(msg) {
    errorText.textContent = msg;
    errorBox.removeAttribute('hidden');
  }

  function clearError() {
    errorBox.setAttribute('hidden', '');
    errorText.textContent = '';
  }

  /* ─── Loading state ─────────────────────────── */
  function setLoading(loading) {
    generateBtn.disabled = loading;
    if (loading) {
      generateBtn.classList.add('loading');
    } else {
      generateBtn.classList.remove('loading');
    }
  }

  /* ─── Difficulty badge helper ────────────────── */
  function setDifficultyBadge(difficulty) {
    difficultyBadge.textContent = difficulty;
    difficultyBadge.className = 'difficulty-badge';
    const d = difficulty.toLowerCase();
    if (d === 'easy')   difficultyBadge.classList.add('easy');
    else if (d === 'medium') difficultyBadge.classList.add('medium');
    else if (d === 'hard')   difficultyBadge.classList.add('hard');
  }

  /* ─── Syntax highlight doc output ───────────── */
  /**
   * Very lightweight highlighter for the doc+code block.
   * Highlights the docstring metadata and code block.
   */
 function highlightOutput(text) {
  // Split into: docstring part vs code part
  // Format is always:  """..."""\n\n```lang\ncode\n```
  const fenceMatch = text.match(/^([\s\S]*?""")\n\n(```[\s\S]*)$/);

  let docPart  = fenceMatch ? fenceMatch[1] : text;
  let codePart = fenceMatch ? fenceMatch[2] : '';

  // ── Render docstring ──────────────────────────────
  function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  let doc = escHtml(docPart);

  // Triple quotes
  doc = doc.replace(/(""")/g, '<span class="cm">$1</span>');

  // Key labels  e.g.  "Problem:", "Time Complexity:"
  doc = doc.replace(
    /^(Problem|Platform|Difficulty|Approach|Time Complexity|Space Complexity)(:)/gm,
    '<span class="doc-key">$1</span><span class="cm">$2</span>'
  );

  // Bullet points
  doc = doc.replace(/^(• .+)$/gm, '<span class="doc-bullet">$1</span>');

  // Big-O values
  doc = doc.replace(/(O\([^)]+\))/g, '<span class="num">$1</span>');

  // ── Render code block ─────────────────────────────
  let code = '';
  if (codePart) {
    // Split fence line from actual code
    // ```python\ncode here\n```
    const codeMatch = codePart.match(/^(```\w*)\n([\s\S]*?)(\n```)$/);

    if (codeMatch) {
      const fence    = escHtml(codeMatch[1]);   // ```python
      const codeBody = escHtml(codeMatch[2]);   // actual code
      const closeFence = escHtml(codeMatch[3]); // \n```

      code = '<span class="cm">' + fence + '</span>\n'
           + syntaxHighlightCode(codeBody)
           + '<span class="cm">' + closeFence + '</span>';
    } else {
      code = escHtml(codePart);
    }
  }

  return doc + (code ? '\n\n' + code : '');
}

function syntaxHighlightCode(escapedCode) {
  let c = escapedCode;

  // Strings (double and single quoted)
  c = c.replace(/(&#039;[^&#]*&#039;|&quot;[^&]*&quot;)/g,
        '<span class="str">$1</span>');

  // Comments  # ...  or  // ...
  c = c.replace(/((?:\/\/|#)[^\n]*)/g,
        '<span class="cm">$1</span>');

  // Keywords
  const kws = 'class|def|return|if|else|elif|for|while|in|not|and|or|'
            + 'import|from|with|as|pass|None|True|False|self|'
            + 'int|bool|str|list|dict|set|void|new|null|nullptr|'
            + 'public|private|static|auto|const|vector|unordered_map|'
            + 'var|let|const|function|=>';
  c = c.replace(new RegExp(`\\b(${kws})\\b`, 'g'),
        '<span class="kw">$1</span>');

  // Numbers
  c = c.replace(/\b(\d+)\b/g, '<span class="num">$1</span>');

  // Function calls  word(
  c = c.replace(/\b([a-zA-Z_]\w*)(?=\()/g, '<span class="fn">$1</span>');

  return c;
}

  /* ─── Render result ─────────────────────────── */
  function renderResult(data) {
    lastFormattedOutput = data.formatted_output || '';
    lastProblemName     = data.problem || 'solution';

    // Show result panel
    emptyState.setAttribute('hidden', '');
    resultContent.removeAttribute('hidden');

    // Language tag
    const lang = data.language || 'code';
    docLangTag.textContent = lang.toUpperCase();

    // Difficulty
    setDifficultyBadge(data.difficulty || 'Unknown');

    // Main doc output (highlighted)
    docOutputText.innerHTML = highlightOutput(lastFormattedOutput);

    // Stats pills
    statTime.textContent    = data.time_complexity  || '—';
    statSpace.textContent   = data.space_complexity || '—';
    statProblem.textContent = data.problem          || '—';
  }

  /* ─── Generate documentation ────────────────── */
  async function generate() {
    clearError();

    const code = codeInput.value.trim();
    if (!code) {
      showError('Please paste your LeetCode solution code before generating.');
      codeInput.focus();
      return;
    }
    if (code.length < 10) {
      showError('Code is too short. Please paste a valid solution.');
      return;
    }

    const payload = {
      code:     code,
      url:      urlInput.value.trim(),
      language: langSelect.value,
    };

    setLoading(true);

    try {
      const response = await fetch('/api/generate/', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const msg = data.error || data.detail || `Server error: ${response.status}`;
        throw new Error(msg);
      }

      renderResult(data);

    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        showError('Network error: Could not reach the server. Is Django running?');
      } else {
        showError(err.message || 'An unexpected error occurred.');
      }
      // Keep empty state if this is the first error
      if (resultContent.hasAttribute('hidden')) {
        emptyState.removeAttribute('hidden');
      }
    } finally {
      setLoading(false);
    }
  }

  /* ─── Copy to clipboard ─────────────────────── */
  async function copyToClipboard() {
    if (!lastFormattedOutput) return;
    try {
      await navigator.clipboard.writeText(lastFormattedOutput);
      copyBtn.classList.add('copied');
      copyBtn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Copied!
      `;
      setTimeout(() => {
        copyBtn.classList.remove('copied');
        copyBtn.innerHTML = `
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          Copy
        `;
      }, 2200);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = lastFormattedOutput;
      ta.style.cssText = 'position:fixed;opacity:0;';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
    }
  }

  /* ─── Download markdown ─────────────────────── */
  function downloadMarkdown() {
    if (!lastFormattedOutput) return;

    // Build a nice .md file
    const md = `# ${lastProblemName}\n\n${lastFormattedOutput}\n`;
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');

    // Sanitize filename
    const filename = lastProblemName
      .replace(/[^a-z0-9_\-\s]/gi, '')
      .replace(/\s+/g, '_')
      .toLowerCase() || 'solution';

    a.href     = url;
    a.download = `${filename}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /* ─── Event listeners ───────────────────────── */
  generateBtn.addEventListener('click', generate);
  copyBtn.addEventListener('click', copyToClipboard);
  downloadBtn.addEventListener('click', downloadMarkdown);

  // Also allow Ctrl+Enter in code textarea
  codeInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      generate();
    }
  });

  // Paste event: auto-focus textarea and clear on paste if it was placeholder
  document.addEventListener('paste', (e) => {
    if (document.activeElement !== codeInput) return;
    // Textarea already handles paste natively
  });

})();
