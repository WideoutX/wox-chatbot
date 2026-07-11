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
 *     "quick_replies": ["Option A", "Option B"],   // optional
 *     "end_conversation": true                     // optional — when true, the widget
 *                                                  //   clears conversation_id and shows
 *                                                  //   welcomeQuickReplies again so the
 *                                                  //   user can start a fresh thread.
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
 *     accentColor: '#2CC7D8'
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
    send:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>'
  };

  const STYLES = `
    .wox-chat-root, .wox-chat-root * {
      box-sizing: border-box;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    /* =========================================================
       THEME TOKENS — DARK (hero) state is the default.
       .wox-light overrides these when scrolled into light sections.
       Palette from WOX Website Chatbot Revamp spec.
       ========================================================= */
    .wox-chat-root {
      /* Brand accent — cyan, consistent across both states */
      --wox-accent: #2CC7D8;
      --wox-link: #7fe4f0;

      /* Panel */
      --wox-panel-bg:
        radial-gradient(ellipse 80% 60% at 50% 40%, rgba(44, 199, 216, 0.16) 0%, transparent 60%),
        radial-gradient(ellipse at top right, rgba(44, 199, 216, 0.12) 0%, transparent 55%),
        linear-gradient(180deg, #032D3A 0%, #021C26 100%);
      --wox-panel-border: rgba(44, 199, 216, 0.30);
      --wox-panel-shadow: 0 0 60px rgba(44, 199, 216, 0.18), 0 24px 64px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04);
      --wox-starfield-opacity: 0.6;

      /* Header */
      --wox-header-bg: linear-gradient(180deg, rgba(44, 199, 216, 0.08) 0%, transparent 100%);
      --wox-header-border: rgba(44, 199, 216, 0.2);
      --wox-header-rule: linear-gradient(90deg, transparent, rgba(44, 199, 216, 0.6), transparent);
      --wox-title: #ffffff;
      --wox-subtitle: #9db4c0;
      --wox-close: #9db4c0;
      --wox-close-hover: #ffffff;
      --wox-close-hover-bg: rgba(255,255,255,0.06);

      /* Bot / user messages */
      --wox-bot-bg: linear-gradient(180deg, rgba(6, 55, 70, 0.72) 0%, rgba(2, 28, 38, 0.72) 100%);
      --wox-bot-border: rgba(148, 163, 184, 0.15);
      --wox-bot-text: #e7f4f7;
      --wox-strong: #ffffff;
      --wox-code-bg: rgba(44, 199, 216, 0.15);
      --wox-code-text: #7fe4f0;
      --wox-user-bg: linear-gradient(135deg, rgba(44, 199, 216, 0.20) 0%, rgba(44, 199, 216, 0.10) 100%);
      --wox-user-border: rgba(44, 199, 216, 0.38);
      --wox-user-text: #ffffff;

      /* Quick replies (stacked) */
      --wox-qr-bg: linear-gradient(180deg, rgba(6, 55, 70, 0.6) 0%, rgba(2, 28, 38, 0.6) 100%);
      --wox-qr-border: rgba(44, 199, 216, 0.22);
      --wox-qr-text: #e7f4f7;
      --wox-qr-bg-hover: linear-gradient(180deg, rgba(44, 199, 216, 0.14) 0%, rgba(2, 28, 38, 0.6) 100%);
      --wox-qr-border-hover: rgba(44, 199, 216, 0.5);
      --wox-qr-glow-hover: 0 0 16px rgba(44, 199, 216, 0.15);

      /* Chips (inline) */
      --wox-chip-bg: rgba(44, 199, 216, 0.08);
      --wox-chip-border: rgba(44, 199, 216, 0.3);
      --wox-chip-text: #2CC7D8;
      --wox-chip-bg-hover: rgba(44, 199, 216, 0.16);
      --wox-chip-border-hover: rgba(44, 199, 216, 0.55);
      --wox-chip-text-hover: #ffffff;

      /* Input */
      --wox-inputbar-bg: linear-gradient(180deg, transparent 0%, rgba(2, 28, 38, 0.5) 100%);
      --wox-inputbar-border: rgba(44, 199, 216, 0.15);
      --wox-input-bg: rgba(2, 28, 38, 0.5);
      --wox-input-border: rgba(148, 163, 184, 0.18);
      --wox-input-text: #e7f4f7;
      --wox-input-placeholder: #6B8792;
      --wox-input-bg-focus: rgba(2, 28, 38, 0.75);
      --wox-input-focus-ring: 0 0 0 3px rgba(44, 199, 216, 0.14);

      /* Footer */
      --wox-footer-text: #9db4c0;
      --wox-footer-border: rgba(148, 163, 184, 0.08);

      /* Scrollbar */
      --wox-scroll-thumb: rgba(44, 199, 216, 0.22);
      --wox-scroll-thumb-hover: rgba(44, 199, 216, 0.4);

      /* Launcher */
      --wox-launcher-bg: linear-gradient(180deg, #032D3A 0%, #021C26 100%);
      --wox-launcher-border: rgba(44, 199, 216, 0.55);
      --wox-launcher-label: #ffffff;
      --wox-launcher-icon: #2CC7D8;
      --wox-launcher-glow: 0 0 32px rgba(44, 199, 216, 0.40), 0 8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06);
      --wox-launcher-glow-hover: 0 0 44px rgba(44, 199, 216, 0.6), 0 12px 28px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08);

      position: fixed;
      z-index: 2147483000;
      bottom: 24px;
    }
    .wox-chat-root[data-position="bottom-right"] { right: 24px; }
    .wox-chat-root[data-position="bottom-left"]  { left: 24px;  }

    /* =========================================================
       LIGHT (scrolled) state — light aqua panel, dark teal text,
       softly tinted body (never pure white), reduced glow.
       ========================================================= */
    .wox-chat-root.wox-light {
      --wox-link: #0B7C8A;

      --wox-panel-bg:
        radial-gradient(ellipse 80% 60% at 50% 25%, rgba(44, 199, 216, 0.10) 0%, transparent 60%),
        linear-gradient(180deg, #E9FBFD 0%, #CFF5F8 100%);
      --wox-panel-border: rgba(44, 199, 216, 0.35);
      --wox-panel-shadow: 0 0 24px rgba(44, 199, 216, 0.10), 0 18px 48px rgba(3, 45, 58, 0.12), inset 0 1px 0 rgba(255,255,255,0.5);
      --wox-starfield-opacity: 0;

      --wox-header-bg: linear-gradient(180deg, rgba(255,255,255,0.72) 0%, rgba(233,251,253,0.35) 100%);
      --wox-header-border: rgba(44, 199, 216, 0.25);
      --wox-header-rule: linear-gradient(90deg, transparent, rgba(44, 199, 216, 0.5), transparent);
      --wox-title: #073240;
      --wox-subtitle: #6B8792;
      --wox-close: #6B8792;
      --wox-close-hover: #073240;
      --wox-close-hover-bg: rgba(7, 50, 64, 0.06);

      --wox-bot-bg: #E9FBFD;
      --wox-bot-border: rgba(44, 199, 216, 0.28);
      --wox-bot-text: #073240;
      --wox-strong: #073240;
      --wox-code-bg: rgba(44, 199, 216, 0.16);
      --wox-code-text: #0B7C8A;
      --wox-user-bg: linear-gradient(135deg, rgba(44, 199, 216, 0.24) 0%, rgba(44, 199, 216, 0.12) 100%);
      --wox-user-border: rgba(44, 199, 216, 0.5);
      --wox-user-text: #073240;

      --wox-qr-bg: #ffffff;
      --wox-qr-border: rgba(44, 199, 216, 0.35);
      --wox-qr-text: #073240;
      --wox-qr-bg-hover: #ffffff;
      --wox-qr-border-hover: rgba(44, 199, 216, 0.6);
      --wox-qr-glow-hover: 0 0 14px rgba(44, 199, 216, 0.18);

      --wox-chip-bg: #ffffff;
      --wox-chip-border: rgba(44, 199, 216, 0.45);
      --wox-chip-text: #073240;
      --wox-chip-bg-hover: #E9FBFD;
      --wox-chip-border-hover: rgba(44, 199, 216, 0.7);
      --wox-chip-text-hover: #073240;

      --wox-inputbar-bg: linear-gradient(180deg, transparent 0%, rgba(207, 245, 248, 0.6) 100%);
      --wox-inputbar-border: rgba(44, 199, 216, 0.25);
      --wox-input-bg: #ffffff;
      --wox-input-border: rgba(44, 199, 216, 0.30);
      --wox-input-text: #073240;
      --wox-input-placeholder: #6B8792;
      --wox-input-bg-focus: #ffffff;
      --wox-input-focus-ring: 0 0 0 3px rgba(44, 199, 216, 0.16);

      --wox-footer-text: #6B8792;
      --wox-footer-border: rgba(107, 135, 146, 0.18);

      --wox-scroll-thumb: rgba(44, 199, 216, 0.35);
      --wox-scroll-thumb-hover: rgba(44, 199, 216, 0.55);

      --wox-launcher-bg: linear-gradient(180deg, #E9FBFD 0%, #CFF5F8 100%);
      --wox-launcher-border: rgba(44, 199, 216, 0.55);
      --wox-launcher-label: #073240;
      --wox-launcher-icon: #0B7C8A;
      --wox-launcher-glow: 0 0 16px rgba(44, 199, 216, 0.20), 0 8px 20px rgba(3, 45, 58, 0.14);
      --wox-launcher-glow-hover: 0 0 24px rgba(44, 199, 216, 0.32), 0 12px 24px rgba(3, 45, 58, 0.18);
    }

    /* Cross-fade when switching states */
    .wox-panel, .wox-launcher, .wox-header, .wox-msg-bot, .wox-typing,
    .wox-qr-btn, .wox-qr-chip, .wox-input, .wox-input-bar, .wox-footer-tagline {
      transition: background 320ms ease, color 320ms ease, border-color 320ms ease, box-shadow 320ms ease;
    }

    /* LAUNCHER — rounded pill on desktop, compact bubble on mobile */
    .wox-launcher {
      display: inline-flex; align-items: center; gap: 10px;
      height: 56px; padding: 0 22px;
      border-radius: 999px;
      background: var(--wox-launcher-bg);
      border: 1px solid var(--wox-launcher-border);
      cursor: pointer;
      box-shadow: var(--wox-launcher-glow);
      color: var(--wox-launcher-label);
      font-size: 15px; font-weight: 600; letter-spacing: -0.01em;
      transition: transform 200ms ease, box-shadow 200ms ease, background 320ms ease, color 320ms ease, border-color 320ms ease;
    }
    .wox-launcher:hover {
      transform: translateY(-2px);
      box-shadow: var(--wox-launcher-glow-hover);
    }
    .wox-launcher:active { transform: translateY(0); }
    .wox-launcher-icon { color: var(--wox-launcher-icon); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .wox-launcher-icon svg { width: 22px; height: 22px; }
    .wox-launcher-label { white-space: nowrap; }
    .wox-launcher-arrow { color: var(--wox-launcher-icon); display: flex; align-items: center; flex-shrink: 0; }
    .wox-launcher-arrow svg { width: 16px; height: 16px; }

    /* PANEL */
    .wox-panel {
      position: absolute;
      bottom: 80px;
      width: 380px; height: 600px;
      max-height: calc(100vh - 120px);
      background: var(--wox-panel-bg);
      border: 1px solid var(--wox-panel-border);
      border-radius: 22px;
      box-shadow: var(--wox-panel-shadow);
      display: flex; flex-direction: column;
      overflow: hidden;
      opacity: 0; transform: translateY(12px) scale(0.97);
      pointer-events: none;
      transition: opacity 220ms ease, transform 220ms ease, background 320ms ease, border-color 320ms ease, box-shadow 320ms ease;
      color: var(--wox-bot-text);
    }
    .wox-chat-root[data-position="bottom-right"] .wox-panel { right: 0; }
    .wox-chat-root[data-position="bottom-left"]  .wox-panel { left: 0; }
    .wox-panel.wox-open { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }

    /* starfield texture (fades out in light mode) */
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
      opacity: var(--wox-starfield-opacity);
      transition: opacity 320ms ease;
    }

    /* HEADER */
    .wox-header {
      position: relative;
      padding: 18px 18px 16px;
      display: flex; align-items: flex-start; justify-content: space-between;
      flex-shrink: 0;
      border-bottom: 1px solid var(--wox-header-border);
      background: var(--wox-header-bg);
    }
    .wox-header::after {
      content: '';
      position: absolute; left: 0; right: 0; bottom: -1px;
      height: 1px;
      background: var(--wox-header-rule);
    }
    .wox-header-left { display: flex; align-items: flex-start; gap: 10px; min-width: 0; }
    .wox-header-icon { flex-shrink: 0; color: var(--wox-accent); margin-top: 2px; }
    .wox-header-icon svg { width: 22px; height: 22px; }
    .wox-header-text { line-height: 1.25; min-width: 0; }
    .wox-title { font-size: 17px; font-weight: 700; color: var(--wox-title); letter-spacing: -0.01em; }
    .wox-subtitle { font-size: 12.5px; color: var(--wox-subtitle); margin-top: 3px; }
    .wox-close {
      background: transparent; border: none; color: var(--wox-close);
      cursor: pointer; padding: 4px; border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      transition: color 120ms ease, background 120ms ease;
      flex-shrink: 0;
    }
    .wox-close:hover { color: var(--wox-close-hover); background: var(--wox-close-hover-bg); }
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
    .wox-messages::-webkit-scrollbar-thumb { background: var(--wox-scroll-thumb); border-radius: 3px; }
    .wox-messages::-webkit-scrollbar-thumb:hover { background: var(--wox-scroll-thumb-hover); }

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
      background: var(--wox-bot-bg);
      border: 1px solid var(--wox-bot-border);
      color: var(--wox-bot-text);
      border-bottom-left-radius: 4px;
      backdrop-filter: blur(8px);
    }
    .wox-msg-user {
      align-self: flex-end;
      background: var(--wox-user-bg);
      border: 1px solid var(--wox-user-border);
      color: var(--wox-user-text);
      border-bottom-right-radius: 4px;
    }
    .wox-msg p { margin: 0 0 8px 0; }
    .wox-msg p:last-child { margin-bottom: 0; }
    .wox-msg ul { margin: 6px 0; padding-left: 20px; }
    .wox-msg li { margin: 3px 0; }
    .wox-msg strong { font-weight: 700; color: var(--wox-strong); }
    .wox-msg em { font-style: italic; }
    .wox-msg code {
      background: var(--wox-code-bg);
      color: var(--wox-code-text);
      padding: 1px 6px; border-radius: 4px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 12.5px;
    }
    .wox-msg a { color: var(--wox-link); text-decoration: underline; word-break: break-word; }
    .wox-msg a:hover { opacity: 0.8; }
    .wox-msg img {
      max-width: 100%;
      height: auto;
      border-radius: 10px;
      margin: 6px 0;
      border: 1px solid var(--wox-bot-border);
      display: block;
    }

    /* WELCOME QUICK REPLIES (vertical stacked buttons) */
    .wox-quick-replies {
      display: flex; flex-direction: column; gap: 8px;
      animation: wox-fade-in 320ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    .wox-qr-btn {
      display: flex; align-items: center; gap: 12px;
      width: 100%;
      padding: 13px 16px;
      background: var(--wox-qr-bg);
      border: 1px solid var(--wox-qr-border);
      border-radius: 14px;
      color: var(--wox-qr-text);
      font-size: 14px; font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      text-align: left;
      transition: all 180ms ease;
      backdrop-filter: blur(8px);
    }
    .wox-qr-btn:hover {
      background: var(--wox-qr-bg-hover);
      border-color: var(--wox-qr-border-hover);
      transform: translateX(2px);
      box-shadow: var(--wox-qr-glow-hover);
    }
    .wox-qr-btn:active { transform: translateX(0) scale(0.99); }
    .wox-qr-icon { color: var(--wox-accent); flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
    .wox-qr-icon svg { width: 18px; height: 18px; }

    /* INLINE QUICK REPLIES from genie (chip style) */
    .wox-quick-replies-inline {
      display: flex; flex-wrap: wrap; gap: 6px;
      margin-top: 4px;
      animation: wox-fade-in 280ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    .wox-qr-chip {
      padding: 7px 13px;
      background: var(--wox-chip-bg);
      border: 1px solid var(--wox-chip-border);
      border-radius: 999px;
      color: var(--wox-chip-text);
      font-size: 13px; font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      transition: all 150ms ease;
    }
    .wox-qr-chip:hover {
      background: var(--wox-chip-bg-hover);
      border-color: var(--wox-chip-border-hover);
      color: var(--wox-chip-text-hover);
    }
    .wox-qr-chip:active { transform: scale(0.97); }

    /* TYPING */
    .wox-typing {
      align-self: flex-start;
      background: var(--wox-bot-bg);
      border: 1px solid var(--wox-bot-border);
      padding: 14px 16px;
      border-radius: 14px;
      border-bottom-left-radius: 4px;
      display: flex; gap: 5px;
      backdrop-filter: blur(8px);
    }
    .wox-typing span {
      width: 6px; height: 6px; border-radius: 50%;
      background: var(--wox-accent);
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
      border-top: 1px solid var(--wox-footer-border);
      color: var(--wox-footer-text);
      font-size: 11.5px; line-height: 1.4;
      flex-shrink: 0;
      position: relative; z-index: 1;
    }
    .wox-footer-icon { color: var(--wox-accent); flex-shrink: 0; opacity: 0.85; }
    .wox-footer-icon svg { width: 18px; height: 18px; }

    /* INPUT */
    .wox-input-bar {
      padding: 12px;
      border-top: 1px solid var(--wox-inputbar-border);
      display: flex; gap: 8px; align-items: flex-end;
      flex-shrink: 0;
      background: var(--wox-inputbar-bg);
      position: relative; z-index: 1;
    }
    .wox-input {
      flex: 1;
      border: 1px solid var(--wox-input-border);
      background: var(--wox-input-bg);
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
      color: var(--wox-input-text);
    }
    .wox-input::placeholder { color: var(--wox-input-placeholder); }
    .wox-input:focus {
      border-color: var(--wox-accent);
      background: var(--wox-input-bg-focus);
      box-shadow: var(--wox-input-focus-ring);
    }
    .wox-send {
      background: linear-gradient(135deg, #7fe4f0 0%, var(--wox-accent) 100%);
      border: none;
      width: 40px; height: 40px;
      border-radius: 12px;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #032D3A;
      flex-shrink: 0;
      transition: opacity 150ms ease, transform 150ms ease, box-shadow 150ms ease;
      box-shadow: 0 0 22px rgba(44, 199, 216, 0.5), inset 0 1px 0 rgba(255,255,255,0.25);
    }
    .wox-send:hover { transform: translateY(-1px); box-shadow: 0 0 32px rgba(44, 199, 216, 0.7), inset 0 1px 0 rgba(255,255,255,0.3); }
    .wox-send:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }
    .wox-send svg { width: 18px; height: 18px; }

    .wox-error {
      align-self: stretch;
      background: rgba(239, 68, 68, 0.1);
      color: #d64545;
      border: 1px solid rgba(239, 68, 68, 0.3);
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 13px;
    }

    @media (max-width: 480px) {
      .wox-chat-root { bottom: 16px; }
      .wox-chat-root[data-position="bottom-right"] { right: 16px; }
      .wox-chat-root[data-position="bottom-left"]  { left: 16px;  }
      /* compact bubble launcher on mobile */
      .wox-launcher { width: 56px; padding: 0; justify-content: center; }
      .wox-launcher-label, .wox-launcher-arrow { display: none; }
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
    const escQ = (s) => s.replace(/"/g, '&quot;');
    // Allow http(s), mailto, tel, root-relative, fragment, and protocol-relative URLs. Reject javascript:, data:, etc.
    const safeUrl = (url) => {
      const u = url.trim();
      return /^(https?:|mailto:|tel:|\/|#|\?)/i.test(u) ? u : '#';
    };

    let out = escape(text);

    // Images first so ![alt](url) is not consumed by the link rule.
    out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (_, alt, url, title) => {
      const href = escQ(safeUrl(url));
      const t = title ? ` title="${escQ(title)}"` : '';
      return `<img src="${href}" alt="${escQ(alt)}"${t} loading="lazy">`;
    });

    // Markdown links [text](url "optional title")
    out = out.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (_, label, url, title) => {
      const href = escQ(safeUrl(url));
      const t = title ? ` title="${escQ(title)}"` : '';
      return `<a href="${href}" target="_blank" rel="noopener noreferrer"${t}>${label}</a>`;
    });

    // Autolink bare URLs that weren't wrapped in markdown syntax.
    out = out.replace(/(^|[\s(])((?:https?:\/\/|www\.)[^\s<>()]+[^\s<>().,!?;:'"])/g, (_, lead, url) => {
      const href = escQ(url.startsWith('www.') ? 'http://' + url : url);
      return `${lead}<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });

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
    _light: false,

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
        accentColor: '#2CC7D8',
        position: 'bottom-right',
        sessionKey: 'wox_chat_conversation_id',
        // Launcher
        launcherLabel: 'Chat with us',
        launcherIcon: 'chat',
        // Scroll-aware theming
        scrollAware: true,          // set false to lock to dark mode
        lightSections: [],          // optional CSS selectors of light page sections (most accurate)
        lightModeThreshold: null    // optional scroll-Y (px) to flip to light; defaults to ~85% of viewport height
      }, config);

      try { this._conversationId = sessionStorage.getItem(this._config.sessionKey) || ''; } catch (e) {}

      this._injectStyles();
      this._mount();
      this._bind();
      this._initScrollTheme();
      this._initialized = true;
    },

    // Scroll-aware theming: flip between dark (hero) and light (scrolled) states.
    _initScrollTheme() {
      const cfg = this._config;
      if (cfg.scrollAware === false) return;

      // Preferred: watch specific light sections via IntersectionObserver (most accurate).
      const selectors = Array.isArray(cfg.lightSections) ? cfg.lightSections : [];
      if (selectors.length && 'IntersectionObserver' in window) {
        const els = [];
        selectors.forEach(sel => {
          try { document.querySelectorAll(sel).forEach(el => els.push(el)); } catch (e) {}
        });
        if (els.length) {
          const lit = new Set();
          const io = new IntersectionObserver((entries) => {
            entries.forEach(e => { e.isIntersecting ? lit.add(e.target) : lit.delete(e.target); });
            this._setLight(lit.size > 0);
          }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
          els.forEach(el => io.observe(el));
          return;
        }
      }

      // Fallback: simple scroll-Y threshold (works with zero config — flips once past the hero).
      const getThreshold = () => (typeof cfg.lightModeThreshold === 'number'
        ? cfg.lightModeThreshold
        : Math.round(window.innerHeight * 0.85));
      let ticking = false;
      const onScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          this._setLight(window.scrollY > getThreshold());
          ticking = false;
        });
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    },

    _setLight(on) {
      if (this._light === on || !this._root) return;
      this._light = on;
      this._root.classList.toggle('wox-light', on);
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
        <button class="wox-launcher" aria-label="Open chat">
          <span class="wox-launcher-icon">${iconSVG(this._config.launcherIcon)}</span>
          <span class="wox-launcher-label">${this._escapeHTML(this._config.launcherLabel)}</span>
          <span class="wox-launcher-arrow">${ICONS.arrow}</span>
        </button>
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

        if (data.end_conversation === true) {
          this._endConversation();
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

    _endConversation() {
      this._conversationId = '';
      try { sessionStorage.removeItem(this._config.sessionKey); } catch (e) {}
      const quickReplies = this._config.welcomeQuickReplies;
      if (quickReplies && quickReplies.length) {
        this._addWelcomeQuickReplies(quickReplies);
      }
    },
    open()  { this._toggle(true);  },
    close() { this._toggle(false); }
  };

  global.WoxChat = WoxChat;
})(window);