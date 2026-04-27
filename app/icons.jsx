// ============================================================
// ICONS — Monochromatic, modern stroke (Lucide-inspired)
// All return JSX <svg> with currentColor stroke.
// Sized via parent CSS or `size` prop.
// ============================================================

const Ico = (paths, fills) => ({ size = 20, strokeWidth = 1.75, ...rest } = {}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fills ? 'currentColor' : 'none'} stroke="currentColor"
       strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...rest}>
    {paths}
  </svg>
);

const Icon = {
  // Navigation
  home: Ico(<><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></>),
  income: Ico(<><path d="M12 4v12"/><path d="m6 12 6 6 6-6"/><path d="M4 22h16"/></>),
  budget: Ico(<><circle cx="12" cy="12" r="9"/><path d="M12 3v9l6 4"/></>),
  expense: Ico(<><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18"/><path d="M8 6V4h8v2"/></>),
  card: Ico(<><rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 11h20"/><path d="M6 16h3"/></>),
  loan: Ico(<><circle cx="9" cy="9" r="4"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5"/><path d="m17 11 2 2 4-4"/></>),
  cog: Ico(<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></>),
  data: Ico(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></>),

  // Actions
  plus: Ico(<><path d="M5 12h14"/><path d="M12 5v14"/></>),
  minus: Ico(<><path d="M5 12h14"/></>),
  edit: Ico(<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>),
  trash: Ico(<><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/></>),
  close: Ico(<><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>),
  check: Ico(<><polyline points="20 6 9 17 4 12"/></>),
  search: Ico(<><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>),
  filter: Ico(<><path d="M3 4h18l-7 9v6l-4 2v-8L3 4z"/></>),
  sort: Ico(<><path d="M3 6h18"/><path d="M7 12h10"/><path d="M10 18h4"/></>),
  download: Ico(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>),
  upload: Ico(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>),
  copy: Ico(<><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>),
  more: Ico(<><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/><circle cx="5" cy="12" r="1.5" fill="currentColor"/></>),
  drag: Ico(<><circle cx="9" cy="6" r="1.2" fill="currentColor"/><circle cx="15" cy="6" r="1.2" fill="currentColor"/><circle cx="9" cy="12" r="1.2" fill="currentColor"/><circle cx="15" cy="12" r="1.2" fill="currentColor"/><circle cx="9" cy="18" r="1.2" fill="currentColor"/><circle cx="15" cy="18" r="1.2" fill="currentColor"/></>),

  // Arrows / chevrons
  chevLeft: Ico(<><path d="m15 18-6-6 6-6"/></>),
  chevRight: Ico(<><path d="m9 18 6-6-6-6"/></>),
  chevUp: Ico(<><path d="m18 15-6-6-6 6"/></>),
  chevDown: Ico(<><path d="m6 9 6 6 6-6"/></>),
  arrowUp: Ico(<><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></>),
  arrowDown: Ico(<><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></>),
  arrowRight: Ico(<><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></>),

  // States / status
  alert: Ico(<><path d="M12 9v4"/><path d="M12 17h.01"/><path d="m4.5 19 7.5-13 7.5 13a1 1 0 0 1-.9 1.5h-13.2a1 1 0 0 1-.9-1.5z"/></>),
  info: Ico(<><circle cx="12" cy="12" r="9"/><path d="M12 8v4"/><path d="M12 16h.01"/></>),
  clock: Ico(<><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></>),
  calendar: Ico(<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4"/><path d="M8 3v4"/><path d="M3 10h18"/></>),
  star: Ico(<><polygon points="12 2 15.1 8.6 22 9.6 17 14.5 18.2 21.5 12 18.2 5.8 21.5 7 14.5 2 9.6 8.9 8.6 12 2"/></>),
  flag: Ico(<><path d="M4 21V4"/><path d="M4 4h13l-2 4 2 4H4"/></>),
  bell: Ico(<><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>),

  // Categories (mono)
  cart: Ico(<><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></>),
  car: Ico(<><path d="M5 17h14"/><path d="M5 17a2 2 0 1 1 4 0"/><path d="M15 17a2 2 0 1 1 4 0"/><path d="M3 12 5 7h14l2 5"/><path d="M3 12v5h18v-5"/><path d="M3 12h18"/></>),
  bolt: Ico(<><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>),
  health: Ico(<><path d="M19 14c1.5-1.5 3-3.3 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.7 0-3 .8-4.5 2.5C10.5 3.8 9.2 3 7.5 3A5.5 5.5 0 0 0 2 8.5c0 2.2 1.5 4 3 5.5l7 7Z"/></>),
  film: Ico(<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 3v18"/><path d="M17 3v18"/><path d="M3 7h4"/><path d="M17 7h4"/><path d="M3 17h4"/><path d="M17 17h4"/><path d="M3 12h18"/></>),
  user: Ico(<><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></>),
  shield: Ico(<><path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3z"/></>),
  book: Ico(<><path d="M4 4a2 2 0 0 1 2-2h13v18H6a2 2 0 0 0-2 2V4z"/><path d="M19 18H6"/></>),
  tag: Ico(<><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z"/><circle cx="7" cy="7" r="1.2"/></>),

  // Misc
  wallet: Ico(<><path d="M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/><path d="M3 7V5a2 2 0 0 1 2-2h11"/><circle cx="17" cy="13" r="1.2" fill="currentColor"/></>),
  send: Ico(<><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>),
  trending: Ico(<><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></>),
  trendingDown: Ico(<><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></>),
  swap: Ico(<><path d="M16 3h5v5"/><path d="M21 3 13 11"/><path d="M8 21H3v-5"/><path d="M3 21l8-8"/></>),
  layers: Ico(<><polygon points="12 2 22 8 12 14 2 8 12 2"/><polyline points="2 14 12 20 22 14"/></>),
  pin: Ico(<><path d="M12 22s-7-7-7-12a7 7 0 1 1 14 0c0 5-7 12-7 12z"/><circle cx="12" cy="10" r="2.5"/></>),
  spark: Ico(<><path d="M12 2v6"/><path d="M12 16v6"/><path d="M2 12h6"/><path d="M16 12h6"/><path d="m4.9 4.9 4.2 4.2"/><path d="m14.9 14.9 4.2 4.2"/><path d="m19.1 4.9-4.2 4.2"/><path d="m9.1 14.9-4.2 4.2"/></>),
  menu: Ico(<><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>),
  refresh: Ico(<><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></>),
  sun: Ico(<><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.9 4.9 1.4 1.4"/><path d="m17.7 17.7 1.4 1.4"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m4.9 19.1 1.4-1.4"/><path d="m17.7 6.3 1.4-1.4"/></>),
  moon: Ico(<><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></>),
  sparkles: Ico(<><path d="M12 3v3"/><path d="M12 18v3"/><path d="M5 12H3"/><path d="M21 12h-2"/><path d="M7.5 7.5 6 6"/><path d="m18 18-1.5-1.5"/><path d="M16.5 7.5 18 6"/><path d="m6 18 1.5-1.5"/><circle cx="12" cy="12" r="3"/></>),
  eye: Ico(<><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></>),
  eyeOff: Ico(<><path d="M9.9 4.2A10 10 0 0 1 12 4c7 0 10 7 10 7a17 17 0 0 1-3.1 4.1"/><path d="M6.6 6.6A17 17 0 0 0 2 12s3 7 10 7a10 10 0 0 0 5.4-1.6"/><path d="m9 9 6 6"/><path d="M2 2l20 20"/></>),
  bullseye: Ico(<><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></>),
  pieChart: Ico(<><path d="M21.2 15a9 9 0 1 1-9.5-12.8"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></>),
  receipt: Ico(<><path d="M4 2h16v20l-3-2-3 2-3-2-3 2-3-2-1 2V2z"/><path d="M8 7h8"/><path d="M8 11h8"/><path d="M8 15h5"/></>),
  gift: Ico(<><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></>),
};

window.Icon = Icon;
