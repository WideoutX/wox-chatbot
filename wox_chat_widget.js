/**
 * WOX Chat Widget v2
 * Dark, glassmorphic embeddable chat widget for Workato Genie endpoints.
 *
 * Quick replies are supported in two ways:
 *   1. welcomeQuickReplies — static buttons shown on first open (config-driven)
 *   2. Dynamic — if the genie's response includes a `quick_replies` array,
 *      the widget renders them as chips under that message.
 *
 * Recipe response shape (extend later):
 *   {
 *     "reply": "...",
 *     "conversation_id": "...",
 *     "quick_replies": ["Option A", "Option B"]    // optional
 *   }
 *
 * Usage:
 *   WoxChat.init({
 *     endpoint: 'https://apim.workato.com/.../chat-api',
 *     apiToken: 'YOUR_TOKEN',
 *     title: 'WideOut X Assistant',
 *     subtitle: 'Workflow automation guide',
 *     welcomeMessage: 'Hello — welcome to WideOut X.\nWhat would you like to explore?',
 *     welcomeQuickReplies: [
 *       { label: 'Automate a Workflow', icon: 'flow', message: 'I want to automate a workflow' },
 *       { label: 'Services',            icon: 'work', message: 'Tell me about your services' },
 *       { label: 'Pricing',             icon: 'tag',  message: 'What are your pricing plans?' },
 *       { label: 'Careers',             icon: 'case', message: 'Are you hiring?' }
 *     ],
 *     footerTagline: 'Map your Manual Workflow and see the path to an Automated Workflow',
 *     accentColor: '#22d3ee'
 *   });
 */
(function (global) {
  'use strict';

  const ICONS = {
    flow:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4" r="2"/><circle cx="5" cy="20" r="2"/><circle cx="19" cy="20" r="2"/><path d="M12 6v4M12 10l-7 8M12 10l7 8"/></svg>',
    work:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>',
    case:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/></svg>',
    tag:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1.2" fill="currentColor"/></svg>',
    chat:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>',
    send:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>'
  };

  const STYLES = `
    .wox-chat-root, .wox-chat-root * {
      box-sizing: border-box;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .wox-chat-root {
      position: fixed;
      z-index: 2147483000;
      bottom: 24px;
    }
    .wox-chat-root[data-position="bottom-right"] { right: 24px; }
    .wox-chat-root[data-position="bottom-left"]  { left: 24px;  }

    /* LAUNCHER */
    .wox-launcher {
      width: 60px; height: 60px; border-radius: 50%;
      background: radial-gradient(circle at 30% 30%, #1e293b 0%, #0a0f1d 100%);
      border: 1px solid rgba(34, 211, 238, 0.35);
      cursor: pointer;
      box-shadow:
        0 0 24px rgba(34, 211, 238, 0.25),
        0 8px 24px rgba(0,0,0,0.45),
        inset 0 1px 0 rgba(255,255,255,0.05);
      display: flex; align-items: center; justify-content: center;
      transition: transform 200ms ease, box-shadow 200ms ease;
      color: var(--wox-accent, #22d3ee);
    }
    .wox-launcher:hover {
      transform: translateY(-2px);
      box-shadow: 0 0 32px rgba(34, 211, 238, 0.45), 0 12px 28px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08);
    }
    .wox-launcher svg { width: 26px; height: 26px; }

    /* PANEL */
    .wox-panel {
      position: absolute;
      bottom: 80px;
      width: 380px; height: 600px;
      max-height: calc(100vh - 120px);
      background:
        radial-gradient(ellipse at top right, rgba(34, 211, 238, 0.10) 0%, transparent 50%),
        radial-gradient(ellipse at bottom left, rgba(59, 130, 246, 0.06) 0%, transparent 50%),
        linear-gradient(180deg, #0b1220 0%, #060912 100%);
      border: 1px solid rgba(34, 211, 238, 0.18);
      border-radius: 22px;
      box-shadow:
        0 0 48px rgba(34, 211, 238, 0.10),
        0 24px 64px rgba(0,0,0,0.55),
        inset 0 1px 0 rgba(255,255,255,0.04);
      display: flex; flex-direction: column;
      overflow: hidden;
      opacity: 0; transform: translateY(12px) scale(0.97);
      pointer-events: none;
      transition: opacity 220ms ease, transform 220ms ease;
      color: #e7eef7;
    }
    .wox-chat-root[data-position="bottom-right"] .wox-panel { right: 0; }
    .wox-chat-root[data-position="bottom-left"]  .wox-panel { left: 0; }
    .wox-panel.wox-open { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }

    /* starfield texture */
    .wox-panel::before {
      content: '';
      position: absolute; inset: 0;
      background-image:
        radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.15), transparent),
        radial-gradient(1px 1px at 60% 70%, rgba(255,255,255,0.10), transparent),
        radial-gradient(1px 1px at 80% 20%, rgba(255,255,255,0.12), transparent),
        radial-gradient(1px 1px at 40% 80%, rgba(255,255,255,0.08), transparent),
        radial-gradient(1px 1px at 90% 50%, rgba(255,255,255,0.10), transparent);
      pointer-events: none;
      opacity: 0.6;
    }

    /* HEADER */
    .wox-header {
      position: relative;
      padding: 18px 18px 16px;
      display: flex; align-items: flex-start; justify-content: space-between;
      flex-shrink: 0;
      border-bottom: 1px solid rgba(34, 211, 238, 0.15);
      background: linear-gradient(180deg, rgba(34, 211, 238, 0.04) 0%, transparent 100%);
    }
    .wox-header::after {
      content: '';
      position: absolute; left: 0; right: 0; bottom: -1px;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.6), transparent);
    }
    .wox-header-left { display: flex; align-items: flex-start; gap: 10px; min-width: 0; }
    .wox-header-icon { flex-shrink: 0; color: var(--wox-accent, #22d3ee); margin-top: 2px; }
    .wox-header-icon svg { width: 22px; height: 22px; }
    .wox-header-text { line-height: 1.25; min-width: 0; }
    .wox-title { font-size: 17px; font-weight: 700; color: #fff; letter-spacing: -0.01em; }
    .wox-subtitle { font-size: 12.5px; color: #94a3b8; margin-top: 3px; }
    .wox-close {
      background: transparent; border: none; color: #94a3b8;
      cursor: pointer; padding: 4px; border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      transition: color 120ms ease, background 120ms ease;
      flex-shrink: 0;
    }
    .wox-close:hover { color: #fff; background: rgba(255,255,255,0.06); }
    .wox-close svg { width: 18px; height: 18px; }

    /* MESSAGES */
    .wox-messages {
      flex: 1; overflow-y: auto;
      padding: 18px 16px;
      display: flex; flex-direction: column; gap: 12px;
      scroll-behavior: smooth;
      position: relative; z-index: 1;
    }
    .wox-messages::-webkit-scrollbar { width: 6px; }
    .wox-messages::-webkit-scrollbar-track { background: transparent; }
    .wox-messages::-webkit-scrollbar-thumb { background: rgba(34, 211, 238, 0.2); border-radius: 3px; }
    .wox-messages::-webkit-scrollbar-thumb:hover { background: rgba(34, 211, 238, 0.35); }

    .wox-msg {
      max-width: 85%;
      padding: 12px 14px;
      border-radius: 14px;
      font-size: 14px; line-height: 1.5;
      word-wrap: break-word;
      animation: wox-fade-in 280ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    @keyframes wox-fade-in {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .wox-msg-bot {
      align-self: flex-start;
      background: linear-gradient(180deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.7) 100%);
      border: 1px solid rgba(148, 163, 184, 0.15);
      color: #e7eef7;
      border-bottom-left-radius: 4px;
      backdrop-filter: blur(8px);
    }
    .wox-msg-user {
      align-self: flex-end;
      background: linear-gradient(135deg, rgba(34, 211, 238, 0.18) 0%, rgba(59, 130, 246, 0.18) 100%);
      border: 1px solid rgba(34, 211, 238, 0.35);
      color: #fff;
      border-bottom-right-radius: 4px;
    }
    .wox-msg p { margin: 0 0 8px 0; }
    .wox-msg p:last-child { margin-bottom: 0; }
    .wox-msg ul { margin: 6px 0; padding-left: 20px; }
    .wox-msg li { margin: 3px 0; }
    .wox-msg strong { font-weight: 600; color: #fff; }
    .wox-msg em { font-style: italic; }
    .wox-msg code {
      background: rgba(34, 211, 238, 0.15);
      color: #67e8f9;
      padding: 1px 6px; border-radius: 4px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 12.5px;
    }
    .wox-msg a { color: var(--wox-accent, #22d3ee); text-decoration: underline; }

    /* WELCOME QUICK REPLIES (vertical stacked buttons) */
    .wox-quick-replies {
      display: flex; flex-direction: column; gap: 8px;
      animation: wox-fade-in 320ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    .wox-qr-btn {
      display: flex; align-items: center; gap: 12px;
      width: 100%;
      padding: 13px 16px;
      background: linear-gradient(180deg, rgba(30, 41, 59, 0.55) 0%, rgba(15, 23, 42, 0.55) 100%);
      border: 1px solid rgba(34, 211, 238, 0.22);
      border-radius: 14px;
      color: #e7eef7;
      font-size: 14px; font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      text-align: left;
      transition: all 180ms ease;
      backdrop-filter: blur(8px);
    }
    .wox-qr-btn:hover {
      background: linear-gradient(180deg, rgba(34, 211, 238, 0.12) 0%, rgba(15, 23, 42, 0.55) 100%);
      border-color: rgba(34, 211, 238, 0.5);
      transform: translateX(2px);
      box-shadow: 0 0 16px rgba(34, 211, 238, 0.15);
    }
    .wox-qr-btn:active { transform: translateX(0) scale(0.99); }
    .wox-qr-icon { color: var(--wox-accent, #22d3ee); flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
    .wox-qr-icon svg { width: 18px; height: 18px; }

    /* INLINE QUICK REPLIES from genie (chip style) */
    .wox-quick-replies-inline {
      display: flex; flex-wrap: wrap; gap: 6px;
      margin-top: 4px;
      animation: wox-fade-in 280ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    .wox-qr-chip {
      padding: 7px 13px;
      background: rgba(34, 211, 238, 0.08);
      border: 1px solid rgba(34, 211, 238, 0.3);
      border-radius: 999px;
      color: var(--wox-accent, #22d3ee);
      font-size: 13px; font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      transition: all 150ms ease;
    }
    .wox-qr-chip:hover {
      background: rgba(34, 211, 238, 0.16);
      border-color: rgba(34, 211, 238, 0.55);
      color: #fff;
    }
    .wox-qr-chip:active { transform: scale(0.97); }

    /* TYPING */
    .wox-typing {
      align-self: flex-start;
      background: linear-gradient(180deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.7) 100%);
      border: 1px solid rgba(148, 163, 184, 0.15);
      padding: 14px 16px;
      border-radius: 14px;
      border-bottom-left-radius: 4px;
      display: flex; gap: 5px;
      backdrop-filter: blur(8px);
    }
    .wox-typing span {
      width: 6px; height: 6px; border-radius: 50%;
      background: var(--wox-accent, #22d3ee);
      animation: wox-bounce 1.3s infinite ease-in-out;
      opacity: 0.6;
    }
    .wox-typing span:nth-child(2) { animation-delay: 0.15s; }
    .wox-typing span:nth-child(3) { animation-delay: 0.30s; }
    @keyframes wox-bounce {
      0%, 60%, 100% { transform: translateY(0) scale(0.85); opacity: 0.5; }
      30%           { transform: translateY(-4px) scale(1); opacity: 1; }
    }

    /* FOOTER TAGLINE */
    .wox-footer-tagline {
      padding: 12px 18px;
      display: flex; align-items: center; gap: 10px;
      border-top: 1px solid rgba(148, 163, 184, 0.08);
      color: #94a3b8;
      font-size: 11.5px; line-height: 1.4;
      flex-shrink: 0;
      position: relative; z-index: 1;
    }
    .wox-footer-icon { color: var(--wox-accent, #22d3ee); flex-shrink: 0; opacity: 0.85; }
    .wox-footer-icon svg { width: 18px; height: 18px; }

    /* INPUT */
    .wox-input-bar {
      padding: 12px;
      border-top: 1px solid rgba(34, 211, 238, 0.15);
      display: flex; gap: 8px; align-items: flex-end;
      flex-shrink: 0;
      background: linear-gradient(180deg, transparent 0%, rgba(6, 9, 18, 0.5) 100%);
      position: relative; z-index: 1;
    }
    .wox-input {
      flex: 1;
      border: 1px solid rgba(148, 163, 184, 0.18);
      background: rgba(15, 23, 42, 0.5);
      border-radius: 12px;
      padding: 10px 14px;
      font-size: 14px;
      font-family: inherit;
      resize: none;
      max-height: 120px;
      min-height: 40px;
      line-height: 1.4;
      outline: none;
      transition: border-color 150ms ease, box-shadow 150ms ease, background 150ms ease;
      color: #e7eef7;
    }
    .wox-input::placeholder { color: #64748b; }
    .wox-input:focus {
      border-color: rgba(34, 211, 238, 0.55);
      background: rgba(15, 23, 42, 0.75);
      box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.12);
    }
    .wox-send {
      background: linear-gradient(135deg, var(--wox-accent, #22d3ee) 0%, #3b82f6 100%);
      border: none;
      width: 40px; height: 40px;
      border-radius: 12px;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #0a0f1d;
      flex-shrink: 0;
      transition: opacity 150ms ease, transform 150ms ease, box-shadow 150ms ease;
      box-shadow: 0 0 16px rgba(34, 211, 238, 0.25);
    }
    .wox-send:hover { transform: translateY(-1px); box-shadow: 0 0 24px rgba(34, 211, 238, 0.45); }
    .wox-send:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }
    .wox-send svg { width: 18px; height: 18px; }

    .wox-error {
      align-self: stretch;
      background: rgba(239, 68, 68, 0.1);
      color: #fca5a5;
      border: 1px solid rgba(239, 68, 68, 0.3);
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 13px;
    }

    @media (max-width: 480px) {
      .wox-chat-root { bottom: 16px; }
      .wox-chat-root[data-position="bottom-right"] { right: 16px; }
      .wox-chat-root[data-position="bottom-left"]  { left: 16px;  }
      .wox-panel {
        width: calc(100vw - 32px);
        height: calc(100vh - 100px);
        bottom: 76px;
        border-radius: 18px;
      }
    }
  `;

  function renderMarkdown(text) {
    const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    let out = escape(text);
    out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    const blocks = out.split(/\n{2,}/);
    return blocks.map(block => {
      const lines = block.split('\n');
      const isList = lines.every(l => /^\s*[-*]\s+/.test(l));
      if (isList) {
        return '<ul>' + lines.map(l => '<li>' + l.replace(/^\s*[-*]\s+/, '') + '</li>').join('') + '</ul>';
      }
      return '<p>' + lines.join('<br>') + '</p>';
    }).join('');
  }

  const iconSVG = (name) => ICONS[name] || ICONS.chat;

  const WoxChat = {
    _initialized: false,
    _config: null,
    _root: null,
    _panel: null,
    _messages: null,
    _input: null,
    _sendBtn: null,
    _conversationId: '',
    _welcomeShown: false,

    init(config) {
      if (this._initialized) { console.warn('[WoxChat] already initialized'); return; }
      if (!config || !config.endpoint || !config.apiToken) {
        console.error('[WoxChat] init() requires { endpoint, apiToken }');
        return;
      }
      this._config = Object.assign({
        title: 'Chat',
        subtitle: '',
        headerIcon: 'flow',
        welcomeMessage: 'Hi! How can I help?',
        welcomeQuickReplies: [],
        footerTagline: '',
        footerIcon: 'flow',
        accentColor: '#22d3ee',
        position: 'bottom-right',
        sessionKey: 'wox_chat_conversation_id'
      }, config);

      try { this._conversationId = sessionStorage.getItem(this._config.sessionKey) || ''; } catch (e) {}

      this._injectStyles();
      this._mount();
      this._bind();
      this._initialized = true;
    },

    _injectStyles() {
      if (document.getElementById('wox-chat-styles')) return;
      if (!document.querySelector('link[href*="fonts.googleapis.com/css2?family=Inter"]')) {
        const fontLink = document.createElement('link');
        fontLink.rel = 'stylesheet';
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
        document.head.appendChild(fontLink);
      }
      const style = document.createElement('style');
      style.id = 'wox-chat-styles';
      style.textContent = STYLES;
      document.head.appendChild(style);
    },

    _escapeHTML(s) {
      return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    },

    _mount() {
      const root = document.createElement('div');
      root.className = 'wox-chat-root';
      root.setAttribute('data-position', this._config.position);
      root.style.setProperty('--wox-accent', this._config.accentColor);

      const footerHTML = this._config.footerTagline
        ? `<div class="wox-footer-tagline">
             <div class="wox-footer-icon">${iconSVG(this._config.footerIcon)}</div>
             <div>${this._escapeHTML(this._config.footerTagline)}</div>
           </div>`
        : '';

      root.innerHTML = `
        <div class="wox-panel" role="dialog" aria-label="Chat">
          <div class="wox-header">
            <div class="wox-header-left">
              <div class="wox-header-icon">${iconSVG(this._config.headerIcon)}</div>
              <div class="wox-header-text">
                <div class="wox-title"></div>
                <div class="wox-subtitle"></div>
              </div>
            </div>
            <button class="wox-close" aria-label="Close chat">${ICONS.close}</button>
          </div>
          <div class="wox-messages" aria-live="polite"></div>
          ${footerHTML}
          <div class="wox-input-bar">
            <textarea class="wox-input" rows="1" placeholder="Type your question..." aria-label="Message"></textarea>
            <button class="wox-send" aria-label="Send message">${ICONS.send}</button>
          </div>
        </div>
        <button class="wox-launcher" aria-label="Open chat">${ICONS.chat}</button>
      `;

      root.querySelector('.wox-title').textContent = this._config.title;
      const subtitleEl = root.querySelector('.wox-subtitle');
      if (this._config.subtitle) subtitleEl.textContent = this._config.subtitle;
      else subtitleEl.style.display = 'none';

      document.body.appendChild(root);

      this._root = root;
      this._panel = root.querySelector('.wox-panel');
      this._messages = root.querySelector('.wox-messages');
      this._input = root.querySelector('.wox-input');
      this._sendBtn = root.querySelector('.wox-send');

      this._renderWelcome();
    },

    _renderWelcome() {
      if (this._welcomeShown) return;
      if (this._config.welcomeMessage) this._addMessage('bot', this._config.welcomeMessage);
      if (this._config.welcomeQuickReplies && this._config.welcomeQuickReplies.length) {
        this._addWelcomeQuickReplies(this._config.welcomeQuickReplies);
      }
      this._welcomeShown = true;
    },

    _bind() {
      const launcher = this._root.querySelector('.wox-launcher');
      const closeBtn = this._root.querySelector('.wox-close');
      launcher.addEventListener('click', () => this._toggle(true));
      closeBtn.addEventListener('click', () => this._toggle(false));
      this._input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this._send(); }
      });
      this._input.addEventListener('input', () => {
        this._input.style.height = 'auto';
        this._input.style.height = Math.min(this._input.scrollHeight, 120) + 'px';
      });
      this._sendBtn.addEventListener('click', () => this._send());
    },

    _toggle(open) {
      this._panel.classList.toggle('wox-open', open);
      if (open) setTimeout(() => this._input.focus(), 220);
    },

    _addMessage(role, text) {
      const div = document.createElement('div');
      div.className = 'wox-msg ' + (role === 'user' ? 'wox-msg-user' : 'wox-msg-bot');
      if (role === 'bot') div.innerHTML = renderMarkdown(text);
      else div.textContent = text;
      this._messages.appendChild(div);
      this._scrollToBottom();
      return div;
    },

    _addWelcomeQuickReplies(items) {
      const wrap = document.createElement('div');
      wrap.className = 'wox-quick-replies';
      items.forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'wox-qr-btn';
        const icon = iconSVG(item.icon || 'flow');
        btn.innerHTML = `<span class="wox-qr-icon">${icon}</span><span>${this._escapeHTML(item.label)}</span>`;
        btn.addEventListener('click', () => {
          wrap.remove();
          this._sendFromButton(item.message || item.label);
        });
        wrap.appendChild(btn);
      });
      this._messages.appendChild(wrap);
      this._scrollToBottom();
    },

    _addInlineQuickReplies(items) {
      const wrap = document.createElement('div');
      wrap.className = 'wox-quick-replies-inline';
      items.forEach(item => {
        const label = typeof item === 'string' ? item : item.label;
        const message = typeof item === 'string' ? item : (item.message || item.label);
        const chip = document.createElement('button');
        chip.className = 'wox-qr-chip';
        chip.textContent = label;
        chip.addEventListener('click', () => {
          wrap.remove();
          this._sendFromButton(message);
        });
        wrap.appendChild(chip);
      });
      this._messages.appendChild(wrap);
      this._scrollToBottom();
    },

    _addTyping() {
      const div = document.createElement('div');
      div.className = 'wox-typing';
      div.innerHTML = '<span></span><span></span><span></span>';
      this._messages.appendChild(div);
      this._scrollToBottom();
      return div;
    },

    _addError(text) {
      const div = document.createElement('div');
      div.className = 'wox-error';
      div.textContent = text;
      this._messages.appendChild(div);
      this._scrollToBottom();
    },

    _scrollToBottom() {
      this._messages.scrollTop = this._messages.scrollHeight;
    },

    _sendFromButton(message) {
      this._messages.querySelectorAll('.wox-quick-replies-inline, .wox-quick-replies').forEach(el => el.remove());
      this._input.value = message;
      this._send();
    },

    async _send() {
      const text = this._input.value.trim();
      if (!text) return;

      this._messages.querySelectorAll('.wox-quick-replies').forEach(el => el.remove());

      this._input.value = '';
      this._input.style.height = 'auto';
      this._sendBtn.disabled = true;

      this._addMessage('user', text);
      const typing = this._addTyping();

      try {
        const res = await fetch(this._config.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-token': this._config.apiToken
          },
          body: JSON.stringify({
            message: text,
            conversation_id: this._conversationId || ''
          })
        });

        typing.remove();

        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          this._addError(`Error ${res.status}: ${errText || res.statusText}`);
          return;
        }

        const data = await res.json();
        if (data.conversation_id) {
          this._conversationId = data.conversation_id;
          try { sessionStorage.setItem(this._config.sessionKey, this._conversationId); } catch (e) {}
        }
        this._addMessage('bot', data.reply || '(no reply)');

        if (Array.isArray(data.quick_replies) && data.quick_replies.length) {
          this._addInlineQuickReplies(data.quick_replies);
        }
      } catch (err) {
        typing.remove();
        this._addError('Network error: ' + err.message);
      } finally {
        this._sendBtn.disabled = false;
        this._input.focus();
      }
    },

    reset() {
      this._conversationId = '';
      try { sessionStorage.removeItem(this._config.sessionKey); } catch (e) {}
      this._messages.innerHTML = '';
      this._welcomeShown = false;
      this._renderWelcome();
    },
    open()  { this._toggle(true);  },
    close() { this._toggle(false); }
  };

  global.WoxChat = WoxChat;
})(window);