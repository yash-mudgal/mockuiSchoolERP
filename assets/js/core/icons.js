/* ==========================================================================
   icons.js — inline SVG icon set
   24x24 viewBox, 1.5 stroke, currentColor. Never use emoji as an icon.
   Usage:  el.innerHTML = icon('users', 16)
           node.appendChild(iconEl('bus', 18))
   ========================================================================== */

const P = {
  /* ------------------------------------------------------------- nav / ui */
  'dashboard': '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  'grid': '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  'search': '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  'plus': '<path d="M12 5v14M5 12h14"/>',
  'minus': '<path d="M5 12h14"/>',
  'x': '<path d="M18 6 6 18M6 6l12 12"/>',
  'check': '<path d="m20 6-11 11-5-5"/>',
  'check-circle': '<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  'x-circle': '<circle cx="12" cy="12" r="9"/><path d="m15 9-6 6M9 9l6 6"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  'chevron-up': '<path d="m6 15 6-6 6 6"/>',
  'chevron-right': '<path d="m9 6 6 6-6 6"/>',
  'chevron-left': '<path d="m15 6-6 6 6 6"/>',
  'chevrons-left': '<path d="m11 6-6 6 6 6M18 6l-6 6 6 6"/>',
  'chevrons-right': '<path d="m13 6 6 6-6 6M6 6l6 6-6 6"/>',
  'chevrons-up-down': '<path d="m7 15 5 5 5-5M7 9l5-5 5 5"/>',
  'arrow-right': '<path d="M4 12h16M14 6l6 6-6 6"/>',
  'arrow-left': '<path d="M20 12H4M10 6l-6 6 6 6"/>',
  'arrow-up': '<path d="M12 20V4M6 10l6-6 6 6"/>',
  'arrow-down': '<path d="M12 4v16M6 14l6 6 6-6"/>',
  'arrow-up-right': '<path d="M7 17 17 7M8 7h9v9"/>',
  'arrow-down-right': '<path d="M7 7l10 10M17 8v9H8"/>',
  'trending-up': '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  'trending-down': '<path d="m3 7 6 6 4-4 8 8"/><path d="M15 17h6v-6"/>',
  'trending-flat': '<path d="M3 12h13"/><path d="m16 8 5 4-5 4"/>',
  'more-horizontal': '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
  'more-vertical': '<circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/>',
  'menu': '<path d="M4 6h16M4 12h16M4 18h16"/>',
  'panel-left': '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
  'filter': '<path d="M3 5h18l-7 8v6l-4 2v-8L3 5Z"/>',
  'sort': '<path d="M4 7h10M4 12h7M4 17h4"/><path d="m17 8 3-3 3 3M20 5v14"/>',
  'sort-asc': '<path d="M4 7h10M4 12h7M4 17h4"/><path d="m17 9 3-3 3 3"/>',
  'sort-desc': '<path d="M4 7h4M4 12h7M4 17h10"/><path d="m17 15 3 3 3-3"/>',
  'download': '<path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M4 20h16"/>',
  'upload': '<path d="M12 17V5"/><path d="m7 9 5-5 5 5"/><path d="M4 20h16"/>',
  'print': '<path d="M7 8V3h10v5"/><rect x="3" y="8" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
  'refresh': '<path d="M20 11a8 8 0 1 0-2.3 5.3"/><path d="M20 5v6h-6"/>',
  'external-link': '<path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M18 14v5a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V7.5A1.5 1.5 0 0 1 5 6h5"/>',
  'link': '<path d="M10 13a4 4 0 0 0 5.7.3l3-3A4 4 0 0 0 13 4.7l-1.6 1.6"/><path d="M14 11a4 4 0 0 0-5.7-.3l-3 3A4 4 0 0 0 11 19.3l1.6-1.6"/>',
  'copy': '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4.5A1.5 1.5 0 0 1 3 13.5V4.5A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5"/>',
  'edit': '<path d="M12 20h8"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
  'trash': '<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
  'eye': '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>',
  'eye-off': '<path d="M4 4l16 16"/><path d="M10.6 6.1A9.7 9.7 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3.2 3.9"/><path d="M6.6 7.9A16.6 16.6 0 0 0 2.5 12S6 18 12 18a9.4 9.4 0 0 0 3.6-.7"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  'lock': '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  'unlock': '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 7.5-2"/>',
  'key': '<circle cx="8" cy="14" r="4"/><path d="m11 11 9-9"/><path d="m17 5 2 2"/><path d="m14 8 2 2"/>',
  'settings': '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 8 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3 14.9a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 8a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 9.9 3a2 2 0 1 1 4 0v.1A1.6 1.6 0 0 0 16 4.6a1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z"/>',
  'sliders': '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h10M18 18h2"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="16" cy="18" r="2"/>',
  'bell': '<path d="M18 9a6 6 0 1 0-12 0c0 5-2 7-2 7h16s-2-2-2-7"/><path d="M10.5 20a2 2 0 0 0 3 0"/>',
  'bell-off': '<path d="M4 4l16 16"/><path d="M18 9a6 6 0 0 0-8.7-5.4"/><path d="M6.3 6.3A6 6 0 0 0 6 9c0 5-2 7-2 7h13"/><path d="M10.5 20a2 2 0 0 0 3 0"/>',
  'help-circle': '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.5a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.1-2.4 3.6"/><circle cx="12" cy="17.5" r=".7" fill="currentColor" stroke="none"/>',
  'info': '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="7.8" r=".8" fill="currentColor" stroke="none"/>',
  'alert-triangle': '<path d="M10.3 4.3 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z"/><path d="M12 9.5v4"/><circle cx="12" cy="17" r=".8" fill="currentColor" stroke="none"/>',
  'alert-circle': '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5"/><circle cx="12" cy="16.4" r=".8" fill="currentColor" stroke="none"/>',
  'star': '<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.7l5.9-.8Z"/>',
  'star-filled': '<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.7l5.9-.8Z" fill="currentColor"/>',
  'heart': '<path d="M12 20s-7.5-4.6-7.5-9.5A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.9C19.5 15.4 12 20 12 20Z"/>',
  'bookmark': '<path d="M6 4h12v17l-6-4-6 4Z"/>',
  'pin': '<path d="M9 3h6l-.7 5.5 3 3.5H6.7l3-3.5Z"/><path d="M12 12v9"/>',
  'flag': '<path d="M5 21V4"/><path d="M5 5h11l-2 3.5L16 12H5Z"/>',
  'tag': '<path d="M11.6 3H20v8.4L11.4 20a2 2 0 0 1-2.8 0L4 15.4a2 2 0 0 1 0-2.8Z"/><circle cx="16" cy="8" r="1.4"/>',
  'layers': '<path d="m12 3 9 4.5-9 4.5-9-4.5Z"/><path d="m3 12.5 9 4.5 9-4.5"/><path d="m3 17 9 4.5 9-4.5"/>',
  'list': '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1" fill="currentColor" stroke="none"/>',
  'columns': '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M15 4v16"/>',
  'table': '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M10 10v10"/>',
  'sun': '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  'moon': '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z"/>',
  'monitor': '<rect x="2.5" y="4" width="19" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  'maximize': '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  'minimize': '<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>',
  'log-out': '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 8 6 12l4 4"/><path d="M6 12h9"/>',
  'log-in': '<path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3"/><path d="m14 8 4 4-4 4"/><path d="M18 12H9"/>',
  'command': '<path d="M15 6a3 3 0 1 1 3 3h-3V6ZM9 6a3 3 0 1 0-3 3h3V6ZM15 18a3 3 0 1 0 3-3h-3v3ZM9 18a3 3 0 1 1-3-3h3v3Z"/><rect x="9" y="9" width="6" height="6"/>',

  /* ---------------------------------------------------------- people / hr */
  'user': '<circle cx="12" cy="8" r="4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>',
  'users': '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 5.2a3.5 3.5 0 0 1 0 5.6"/><path d="M17.5 14.4A6.5 6.5 0 0 1 21.5 20"/>',
  'user-plus': '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M18 8v6M15 11h6"/>',
  'user-check': '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="m16 12 2 2 4-4"/>',
  'user-x': '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="m16.5 9.5 5 5M21.5 9.5l-5 5"/>',
  'user-cog': '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 10 0"/><circle cx="18" cy="16" r="2.5"/><path d="M18 12v1M18 19v1M14.5 14l.9.5M20.6 17.5l.9.5M14.5 18l.9-.5M20.6 14.5l.9-.5"/>',
  'graduation-cap': '<path d="m12 4 10 5-10 5L2 9Z"/><path d="M6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/><path d="M21 9.5V15"/>',
  'briefcase': '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7"/><path d="M3 12h18"/>',
  'id-card': '<rect x="2.5" y="5" width="19" height="14" rx="2"/><circle cx="8" cy="11" r="2"/><path d="M4.8 16a3.6 3.6 0 0 1 6.4 0"/><path d="M14 10h5M14 14h3"/>',
  'handshake': '<path d="m11 17-2.5 2.5a1.8 1.8 0 0 1-2.5-2.5l5-5 3 3 5-5 3.5 3.5"/><path d="m3 12 4-4 4 4"/><path d="m13 17 2 2a1.8 1.8 0 0 0 2.5-2.5"/>',
  'award': '<circle cx="12" cy="9" r="5.5"/><path d="m8.5 13.5-1.5 7 5-2.5 5 2.5-1.5-7"/>',
  'trophy': '<path d="M8 4h8v6a4 4 0 0 1-8 0Z"/><path d="M8 6H5v1a3 3 0 0 0 3 3M16 6h3v1a3 3 0 0 1-3 3"/><path d="M12 14v3M9 20h6M10 17h4l.5 3h-5Z"/>',
  'medal': '<circle cx="12" cy="15" r="5"/><path d="m8 10.5-2-6.5h4l1.5 4M16 10.5l2-6.5h-4l-1.5 4"/><path d="M12 13v4"/>',

  /* ----------------------------------------------------------- academics */
  'book': '<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5Z"/><path d="M5 19.5A1.5 1.5 0 0 1 6.5 18H19v3H6.5A1.5 1.5 0 0 1 5 19.5Z"/>',
  'book-open': '<path d="M12 6.5C10.5 5 8.4 4.5 4 4.5v13c4.4 0 6.5.5 8 2 1.5-1.5 3.6-2 8-2v-13c-4.4 0-6.5.5-8 2Z"/><path d="M12 6.5v13"/>',
  'library': '<path d="M5 20V6M9 20V6M13 20V7l4-1 3 14"/><path d="M3 20h18"/>',
  'notebook': '<rect x="5" y="3" width="15" height="18" rx="2"/><path d="M9 3v18"/><path d="M13 8h4M13 12h4"/>',
  'file-text': '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>',
  'file-plus': '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5"/><path d="M12 12v5M9.5 14.5h5"/>',
  'folder': '<path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
  'archive': '<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>',
  'clipboard': '<rect x="5" y="5" width="14" height="16" rx="2"/><path d="M9 5V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"/>',
  'clipboard-check': '<rect x="5" y="5" width="14" height="16" rx="2"/><path d="M9 5V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"/><path d="m9.5 13 2 2 3.5-4"/>',
  'clipboard-list': '<rect x="5" y="5" width="14" height="16" rx="2"/><path d="M9 5V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"/><path d="M9 11h6M9 15h4"/>',
  'certificate': '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M7 8h10M7 11h5"/><circle cx="16.5" cy="17.5" r="2.5"/><path d="m15 19.5-.5 3 2-1 2 1-.5-3"/>',
  'calendar': '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  'calendar-check': '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="m9.5 15 2 2 3.5-4"/>',
  'calendar-plus': '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M12 13v5M9.5 15.5h5"/>',
  'clock': '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.5l3.5 2"/>',
  'timer': '<circle cx="12" cy="13" r="8"/><path d="M12 9v4M9 2h6M18.5 6.5 20 5"/>',
  'history': '<path d="M3 12a9 9 0 1 0 2.6-6.4"/><path d="M3 5v5h5"/><path d="M12 8v4.5l3 1.8"/>',
  'presentation': '<rect x="3" y="4" width="18" height="11" rx="1.5"/><path d="M12 15v3M8.5 21 12 18l3.5 3"/><path d="M8 11l2.5-2.5L13 11l3-3.5"/>',
  'target': '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>',
  'flask': '<path d="M10 3v6L4.6 18a2 2 0 0 0 1.7 3h11.4a2 2 0 0 0 1.7-3L14 9V3"/><path d="M9 3h6M7.6 14h8.8"/>',
  'atom': '<circle cx="12" cy="12" r="2"/><ellipse cx="12" cy="12" rx="9" ry="4"/><ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(120 12 12)"/>',
  'palette': '<path d="M12 3a9 9 0 1 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-1-.6-1.4-.3-.4-.4-.8-.4-1.1 0-.8.7-1.5 1.5-1.5H17a4 4 0 0 0 4-4c0-4.4-4-8-9-8Z"/><circle cx="7.5" cy="11.5" r="1"/><circle cx="10.5" cy="7.5" r="1"/><circle cx="15.5" cy="8.5" r="1"/>',
  'music': '<path d="M9 18V6l11-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',

  /* -------------------------------------------------------------- finance */
  'wallet': '<path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2"/><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M16 13.5h3"/>',
  'credit-card': '<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19"/><path d="M6 15h4"/>',
  'rupee': '<path d="M7 4h10M7 8.5h10M16 4c0 3.6-2.6 4.5-5.5 4.5H7l8 11.5"/>',
  'banknote': '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 10v4M18 10v4"/>',
  'receipt': '<path d="M5 3h14v18l-2.3-1.5-2.4 1.5-2.3-1.5L9.7 21l-2.4-1.5L5 21Z"/><path d="M9 8h6M9 12h6"/>',
  'calculator': '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16h.01M12 16h.01M15.5 16h.01"/>',
  'percent': '<path d="M19 5 5 19"/><circle cx="7.5" cy="7.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/>',
  'scale': '<path d="M12 3v18M7 21h10"/><path d="m6 7-3 6a3 3 0 0 0 6 0Z"/><path d="m18 7-3 6a3 3 0 0 0 6 0Z"/><path d="M4 7h16"/>',
  'gavel': '<path d="m14 3 7 7-2.5 2.5-7-7Z"/><path d="m10.5 6.5 7 7-2.5 2.5-7-7Z"/><path d="M3 21h10M8 15l-3 3"/>',
  'piggy-bank': '<path d="M17 9a6 6 0 0 1 3 5v3h-3l-1 2h-3l-.5-1.5h-3L9 19H6v-3.5A6 6 0 0 1 12 9Z"/><circle cx="16" cy="12.5" r=".8" fill="currentColor" stroke="none"/><path d="M9 9c0-2 1.5-3.5 3.5-3.5"/><path d="M3 12a2.5 2.5 0 0 0 2.5 2.5"/>',

  /* --------------------------------------------------------------- charts */
  'chart-bar': '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  'chart-line': '<path d="M3 3v18h18"/><path d="m7 15 4-5 3 3 5-7"/>',
  'chart-pie': '<path d="M12 3a9 9 0 1 0 9 9h-9Z"/><path d="M15 3.6A9 9 0 0 1 20.4 9H15Z"/>',
  'chart-area': '<path d="M3 3v18h18"/><path d="M7 16V11l3.5-3 3 3.5L18 7v9Z"/>',
  'gauge': '<path d="M4 17a8 8 0 1 1 16 0"/><path d="m12 14 4-4"/><circle cx="12" cy="16" r="1.5"/>',
  'activity': '<path d="M3 12h4l3 8 4-16 3 8h4"/>',
  'pulse': '<path d="M2 12h5l2-5 4 12 3-9 2 2h4"/>',

  /* ------------------------------------------------------------ transport */
  'bus': '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M3 10h18"/><circle cx="7.5" cy="18.5" r="1.8"/><circle cx="16.5" cy="18.5" r="1.8"/><path d="M6 16v1M18 16v1M7 13h2M15 13h2"/>',
  'car': '<path d="M5 17h14"/><path d="M4 17v-4.5L6 8h12l2 4.5V17"/><path d="M4 12.5h16"/><circle cx="7.5" cy="17" r="1.6"/><circle cx="16.5" cy="17" r="1.6"/>',
  'truck': '<rect x="2" y="7" width="11" height="9" rx="1"/><path d="M13 10h4l4 3.5V16h-8Z"/><circle cx="7" cy="18" r="1.7"/><circle cx="17.5" cy="18" r="1.7"/>',
  'route': '<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M15.5 6H10a4 4 0 0 0 0 8h4a4 4 0 0 1 0 8H8.5"/>',
  'map': '<path d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2Z"/><path d="M9 4v14M15 6v14"/>',
  'map-pin': '<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
  'navigation': '<path d="m3 11 18-8-8 18-2-8Z"/>',
  'fuel': '<path d="M4 20V5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v15"/><path d="M3 20h11"/><path d="M6 9h5"/><path d="M16 8.5 18.5 6V15a2 2 0 0 0 2 2 1.5 1.5 0 0 0 1.5-1.5V10l-2.5-3"/>',
  'wrench': '<path d="M15.5 3a5.5 5.5 0 0 0-5 7.7L3 18.2 5.8 21l7.5-7.5A5.5 5.5 0 0 0 20.5 6l-3 3-2.5-2.5 3-3A5.6 5.6 0 0 0 15.5 3Z"/>',
  'tool': '<path d="m14.5 5.5 4 4-9 9-4-4Z"/><path d="M3 21l2.5-2.5"/><circle cx="17.5" cy="6.5" r="3"/>',

  /* --------------------------------------------------------------- hostel */
  'bed': '<path d="M3 20V6"/><path d="M3 11h13a5 5 0 0 1 5 5v4"/><path d="M3 16h18"/><circle cx="8" cy="8.5" r="2"/>',
  'home': '<path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M9 21v-7h6v7"/>',
  'building': '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2"/><path d="M10 21v-3h4v3"/>',
  'building-2': '<path d="M3 21V8l7-4v17"/><path d="M10 10h8a1 1 0 0 1 1 1v10"/><path d="M2 21h20"/><path d="M6 11h1M6 15h1M13 14h1M16 14h1M13 18h1M16 18h1"/>',
  'door': '<path d="M4 21V4a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v17"/><path d="M2 21h20"/><circle cx="14" cy="12.5" r="1" fill="currentColor" stroke="none"/>',
  'utensils': '<path d="M5 3v7a2.5 2.5 0 0 0 5 0V3"/><path d="M7.5 10v11"/><path d="M17 3c-1.7 1-2.5 3-2.5 5.5S15.5 13 17 13.5V21"/>',
  'coffee': '<path d="M4 8h13v6a5 5 0 0 1-10 0Z"/><path d="M17 9h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M4 21h14"/><path d="M8 3v2M12 3v2"/>',

  /* ------------------------------------------------------------- health */
  'stethoscope': '<path d="M5 3v5a4 4 0 0 0 8 0V3"/><path d="M4 3h2M12 3h2"/><path d="M9 12v2a5 5 0 0 0 10 0v-1"/><circle cx="19" cy="10.5" r="2.2"/>',
  'heart-pulse': '<path d="M12 20s-7.5-4.6-7.5-9.5A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.9c0 1.2-.5 2.4-1.2 3.5"/><path d="M3 13h3l1.5-2.5L10 16l2-4h3"/>',
  'pill': '<rect x="2.8" y="8.5" width="18.4" height="7" rx="3.5" transform="rotate(-45 12 12)"/><path d="m8.8 8.8 6.4 6.4"/>',
  'syringe': '<path d="m14 3 7 7"/><path d="m17.5 6.5-9 9L4 20l-1-1 4.5-4.5 9-9"/><path d="m11 9 4 4M9 11l4 4"/>',
  'first-aid': '<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M8 6V4.5A1.5 1.5 0 0 1 9.5 3h5A1.5 1.5 0 0 1 16 4.5V6"/><path d="M12 10v6M9 13h6"/>',
  'thermometer': '<path d="M14 14.8V5a2 2 0 1 0-4 0v9.8a4 4 0 1 0 4 0Z"/><path d="M12 9v7"/>',
  'droplet': '<path d="M12 3s6 6.3 6 10.3A6 6 0 0 1 6 13.3C6 9.3 12 3 12 3Z"/>',

  /* ------------------------------------------------------ communications */
  'mail': '<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="m3 7 8.2 5.6a1.5 1.5 0 0 0 1.6 0L21 7"/>',
  'message-square': '<path d="M4 4h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4V5a1 1 0 0 1 1-1Z"/>',
  'message-circle': '<path d="M20.5 11.5a8 8 0 0 1-11.9 7L3.5 20l1.6-4.6A8 8 0 1 1 20.5 11.5Z"/>',
  'send': '<path d="m21 3-9.5 9.5"/><path d="M21 3 14.5 21l-3-7.5L4 10.5Z"/>',
  'phone': '<path d="M6 3h3l2 5-2.2 1.4a12 12 0 0 0 5.8 5.8L16 13l5 2v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4 5.2 2 2 0 0 1 6 3Z"/>',
  'phone-call': '<path d="M6 3h3l2 5-2.2 1.4a12 12 0 0 0 5.8 5.8L16 13l5 2v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4 5.2 2 2 0 0 1 6 3Z"/><path d="M15 4a5 5 0 0 1 5 5"/>',
  'smartphone': '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18.5h2"/>',
  'megaphone': '<path d="M4 10v4a1 1 0 0 0 1 1h3l8 4V5L8 9H5a1 1 0 0 0-1 1Z"/><path d="M19 9.5a3 3 0 0 1 0 5"/><path d="M8 15v4h3"/>',
  'inbox': '<path d="M3 13h5l1.5 3h5l1.5-3h5"/><path d="M5.5 4h13l2.5 9v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Z"/>',
  'paperclip': '<path d="M20 11.5 12 19.5a5 5 0 0 1-7-7l8.5-8.5a3.4 3.4 0 0 1 4.8 4.8l-8.4 8.4a1.8 1.8 0 0 1-2.5-2.5l7.9-7.9"/>',
  'video': '<rect x="2.5" y="6" width="13" height="12" rx="2"/><path d="m15.5 10.5 6-3v9l-6-3Z"/>',
  'camera': '<path d="M4 7h3l1.5-2h7L17 7h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13" r="3.5"/>',
  'cctv': '<path d="M3 7.5 16 4l1.5 5L4.5 12.5Z"/><path d="M4.5 12.5 6 17"/><path d="M17.5 9 21 8"/><path d="M9 20a3 3 0 0 1-3-3"/><path d="M6 20h8"/>',
  'mic': '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0"/><path d="M12 18v3M9 21h6"/>',
  'wifi': '<path d="M2.5 9a15 15 0 0 1 19 0"/><path d="M6 12.5a10 10 0 0 1 12 0"/><path d="M9.5 16a5 5 0 0 1 5 0"/><circle cx="12" cy="19.5" r="1" fill="currentColor" stroke="none"/>',

  /* ------------------------------------------------------ inventory / ops */
  'box': '<path d="M12 3 3 7.5v9L12 21l9-4.5v-9Z"/><path d="m3 7.5 9 4.5 9-4.5"/><path d="M12 12v9"/>',
  'package': '<path d="M12 3 3 7.5v9L12 21l9-4.5v-9Z"/><path d="m3 7.5 9 4.5 9-4.5"/><path d="M12 12v9M7.5 5.2l9 4.6"/>',
  'shopping-cart': '<circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/><path d="M2 3h2.5l2.5 12h12l2-8H6"/>',
  'database': '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
  'server': '<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/>',
  'cpu': '<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3"/>',
  'scan': '<path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><path d="M4 12h16"/>',
  'qr': '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v3M14 20h3M20 20h1"/>',
  'fingerprint': '<path d="M12 4a8 8 0 0 0-8 8v2"/><path d="M20 12a8 8 0 0 0-4-6.9"/><path d="M8 12a4 4 0 0 1 8 0v2a10 10 0 0 1-1 4.5"/><path d="M12 12v3a13 13 0 0 1-1 5"/><path d="M5 18a12 12 0 0 0 1-6"/><path d="M19 15.5a16 16 0 0 1-.8 4.5"/>',
  'git-branch': '<path d="M6 6.5v8"/><circle cx="6" cy="17" r="2.5"/><circle cx="6" cy="4" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M18 8.5v1a4 4 0 0 1-4 4h-4a4 4 0 0 0-4 4"/>',
  'workflow': '<rect x="3" y="3" width="7" height="6" rx="1.5"/><rect x="14" y="15" width="7" height="6" rx="1.5"/><path d="M6.5 9v4a2 2 0 0 0 2 2h9"/>',
  'shield': '<path d="M12 3 20 6v6c0 4.6-3.3 7.9-8 9-4.7-1.1-8-4.4-8-9V6Z"/>',
  'shield-check': '<path d="M12 3 20 6v6c0 4.6-3.3 7.9-8 9-4.7-1.1-8-4.4-8-9V6Z"/><path d="m9 12 2 2 4-4.5"/>',
  'siren': '<path d="M7 19v-6a5 5 0 0 1 10 0v6"/><rect x="4" y="19" width="16" height="3" rx="1"/><path d="M12 3v2M5 7 6.5 8M19 7l-1.5 1"/>',
  'zap': '<path d="M13 2 4 14h7l-1 8 9-12h-7Z"/><path d="M13 2 4 14h7l-1 8 9-12h-7Z" fill="none"/>',
  'sparkles': '<path d="m12 3 1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8Z"/><path d="m18.5 15 .8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8Z"/>',
  'gift': '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8"/><path d="M12 8v13"/><path d="M12 8S10.5 3 8 3a2.5 2.5 0 0 0 0 5M12 8s1.5-5 4-5a2.5 2.5 0 0 1 0 5"/>',
  'globe': '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><ellipse cx="12" cy="12" rx="4" ry="9"/>',
  'leaf': '<path d="M4 20C3 13 7 5 20 4c0 12-7 16-13 15Z"/><path d="M9 15c2-3 5-5.5 8-6.5"/>',
  'dumbbell': '<path d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11"/>',
  'football': '<circle cx="12" cy="12" r="9"/><path d="m12 7.5 3.5 2.5-1.3 4.2h-4.4L8.5 10Z"/><path d="M12 3v4.5M4.2 9.3l4.3.7M19.8 9.3l-4.3.7M7 20l2.8-5.3M17 20l-2.8-5.3"/>',
  'umbrella': '<path d="M12 3a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9Z"/><path d="M12 12v6.5a2.5 2.5 0 0 0 5 0"/>',
  'flame': '<path d="M12 21a6 6 0 0 0 4-10.5C15 9 13.5 6.5 12 3c-1 3-3 4.5-4.4 6.5A6 6 0 0 0 12 21Z"/><path d="M12 21a2.6 2.6 0 0 0 1.8-4.4c-.6-.7-1.3-1.8-1.8-3-.5 1.2-1.2 2.3-1.8 3A2.6 2.6 0 0 0 12 21Z"/>',
  'thumbs-up': '<path d="M7 21V10l5-7a2 2 0 0 1 2 2v4h5a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17.8 21Z"/><rect x="2" y="10" width="5" height="11" rx="1"/>',
  'smile': '<circle cx="12" cy="12" r="9"/><path d="M8.5 14a4.5 4.5 0 0 0 7 0"/><circle cx="9" cy="10" r=".9" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r=".9" fill="currentColor" stroke="none"/>',
  'frown': '<circle cx="12" cy="12" r="9"/><path d="M8.5 15.5a4.5 4.5 0 0 1 7 0"/><circle cx="9" cy="10" r=".9" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r=".9" fill="currentColor" stroke="none"/>',
  'hand': '<path d="M9 11V4.5a1.5 1.5 0 0 1 3 0V11"/><path d="M12 10.5V4a1.5 1.5 0 0 1 3 0v7"/><path d="M15 11V6.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-.5a6.5 6.5 0 0 1-6.5-6.5V12a1.5 1.5 0 0 1 3 0"/><path d="M6 12V9.5a1.5 1.5 0 0 1 3 0V13"/>',
  'split': '<path d="M3 5h4l5 7v7"/><path d="M21 5h-4l-3 4"/><path d="m18 2 3 3-3 3M18 16l3 3-3 3"/>',
  'refresh-ccw': '<path d="M4 13a8 8 0 0 0 2.3 5.3"/><path d="M20 11a8 8 0 0 0-13.7-5.3L4 8"/><path d="M4 4v4h4"/><path d="m20 20-2.3-2.3"/><path d="M20 16v4h-4"/>',
  'lightbulb': '<path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.3 1 2.1h5c0-.8.4-1.6 1-2.1A6 6 0 0 0 12 3Z"/>',
  'scroll': '<path d="M6 3h12a2 2 0 0 1 2 2v2H8v11a3 3 0 0 1-6 0V5a2 2 0 0 1 2-2Z"/><path d="M8 7v11a3 3 0 0 0 3 3h9a2 2 0 0 0 2-2v-2H11"/>',
  'stamp': '<path d="M8 12V8a4 4 0 0 1 8 0v4"/><path d="M5 12h14v3a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2Z"/><path d="M4 21h16"/>',
  'building-columns': '<path d="m3 9 9-5 9 5"/><path d="M4 9v9M9 9v9M15 9v9M20 9v9"/><path d="M2 21h20"/>',
};

const ALIASES = {
  'admissions': 'user-plus',
  'students': 'graduation-cap',
  'parents': 'users',
  'teachers': 'presentation',
  'hr': 'briefcase',
  'academics': 'book-open',
  'timetable': 'calendar',
  'attendance': 'clipboard-check',
  'examination': 'file-text',
  'fees': 'wallet',
  'finance': 'banknote',
  'transport': 'bus',
  'hostel': 'bed',
  'inventory': 'box',
  'lms': 'monitor',
  'communication': 'megaphone',
  'ptm': 'handshake',
  'activities': 'trophy',
  'health': 'stethoscope',
  'frontoffice': 'phone',
  'security': 'shield',
  'complaints': 'alert-circle',
  'events': 'calendar-check',
  'alumni': 'award',
  'reports': 'chart-bar',
  'portals': 'layers',
  'system': 'settings',
  'close': 'x',
  'delete': 'trash',
  'success': 'check-circle',
  'warning': 'alert-triangle',
  'danger': 'x-circle',
  'error': 'alert-circle',
  'sun-moon': 'sun',
  'campus': 'building-2',
  'money': 'rupee',
  'note': 'file-text',
};

/** All icon names available (including aliases). */
export const iconNames = Object.keys(P).concat(Object.keys(ALIASES)).sort();

/** True when `name` resolves to a real glyph. */
export function hasIcon(name) {
  return !!(P[name] || P[ALIASES[name]]);
}

function resolve(name) {
  if (P[name]) return P[name];
  if (ALIASES[name] && P[ALIASES[name]]) return P[ALIASES[name]];
  return P['circle-fallback'] || '<circle cx="12" cy="12" r="8"/>';
}

/**
 * Return an SVG string for an icon.
 * @param {string} name  icon name (see iconNames)
 * @param {number} size  px, default 16
 * @param {{strokeWidth?:number, className?:string, title?:string}} [opts]
 * @returns {string} SVG markup
 */
export function icon(name, size = 16, opts = {}) {
  const sw = opts.strokeWidth != null ? opts.strokeWidth : 1.5;
  const cls = opts.className ? ` class="${opts.className}"` : '';
  const title = opts.title ? `<title>${escapeXml(opts.title)}</title>` : '';
  const aria = opts.title ? 'role="img"' : 'aria-hidden="true"';
  return `<svg${cls} ${aria} xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${title}${resolve(name)}</svg>`;
}

/** Same as icon() but returns a live SVGElement. */
export function iconEl(name, size = 16, opts = {}) {
  const wrap = document.createElement('div');
  wrap.innerHTML = icon(name, size, opts);
  return wrap.firstElementChild;
}

function escapeXml(s) {
  return String(s).replace(/[<>&"']/g, (c) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;',
  }[c]));
}

export default icon;
