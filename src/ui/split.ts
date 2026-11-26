/**
 * Minimal text splitting for the "turning" type. Words are kept whole (so wrapping and
 * resizing stay native); characters are optional, and can carry a second, italic face
 * for the turn-over moment.
 */

export interface SplitResult {
  words: HTMLElement[];
  chars: HTMLElement[];
}

export function split(el: HTMLElement, mode: 'words' | 'chars', faces = false): SplitResult {
  if (el.dataset.splitDone) {
    return {
      words: [...el.querySelectorAll<HTMLElement>('.split-word')],
      chars: [...el.querySelectorAll<HTMLElement>('.split-char')],
    };
  }
  // collapse ordinary whitespace only; non-breaking spaces stay inside their word
  const text = (el.textContent ?? '').replace(/[ \t\n\r\f]+/g, ' ').trim();
  el.setAttribute('aria-label', text);
  el.textContent = '';
  const words: HTMLElement[] = [];
  const chars: HTMLElement[] = [];
  text.split(' ').forEach((word, i, all) => {
    const w = document.createElement('span');
    w.className = 'split-word';
    w.setAttribute('aria-hidden', 'true');
    if (mode === 'chars') {
      for (const ch of word) {
        const c = document.createElement('span');
        c.className = faces ? 'split-char flipchar' : 'split-char';
        if (faces) {
          const top = document.createElement('span');
          top.className = 'flipchar__top';
          top.textContent = ch;
          const under = document.createElement('span');
          under.className = 'flipchar__under';
          under.textContent = ch;
          c.append(top, under);
        } else c.textContent = ch;
        w.appendChild(c);
        chars.push(c);
      }
    } else {
      w.textContent = word;
    }
    el.appendChild(w);
    words.push(w);
    if (i < all.length - 1) el.appendChild(document.createTextNode(' '));
  });
  el.dataset.splitDone = '1';
  return { words, chars };
}
