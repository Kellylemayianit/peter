// Tiny DOM toolkit. No virtual DOM: h() builds real nodes, strings become text nodes
// (so user content is never parsed as HTML).

export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, val] of Object.entries(props || {})) {
    if (val == null || val === false) continue;
    if (key === 'class') el.className = val;
    else if (key === 'style' && typeof val === 'object') {
      for (const [p, v] of Object.entries(val)) {
        p.startsWith('--') ? el.style.setProperty(p, v) : (el.style[p] = v);
      }
    } else if (key.startsWith('on') && typeof val === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), val);
    } else el.setAttribute(key, val === true ? '' : val);
  }
  append(el, children);
  return el;
}

export function append(parent, children) {
  for (const c of [children].flat(Infinity)) {
    if (c == null || c === false) continue;
    parent.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return parent;
}

// Parse a *static, trusted* markup string (icons, charts). Never pass user data.
export function html(markup) {
  const t = document.createElement('template');
  t.innerHTML = markup.trim();
  return t.content.firstElementChild;
}

export function replaceChildren(el, ...nodes) {
  el.replaceChildren(...nodes.flat(Infinity).filter(Boolean));
  return el;
}
