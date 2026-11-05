/* Jeu d'icônes de navigation — tracés au trait, dans l'esprit d'Ant Design. */

const PATHS = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.6" />
      <rect x="13.5" y="3" width="7.5" height="4.5" rx="1.6" />
      <rect x="13.5" y="10.5" width="7.5" height="10.5" rx="1.6" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  team: (
    <>
      <circle cx="9" cy="7.5" r="3.2" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16.5 5.7a3 3 0 0 1 0 5.4" />
      <path d="M18 14.7a6 6 0 0 1 3.5 5.3" />
    </>
  ),
  briefcase: (
    <>
      <rect x="2.5" y="7" width="19" height="13" rx="2" />
      <path d="M8.5 7V5.5A2.5 2.5 0 0 1 11 3h2a2.5 2.5 0 0 1 2.5 2.5V7" />
      <path d="M2.5 12.5h19" />
      <path d="M10 12.5v2M14 12.5v2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4.5" width="18" height="16" rx="2" />
      <path d="M8 2.5v4M16 2.5v4M3 9.5h18" />
      <path d="M7.5 13h3M13.5 13h3M7.5 16.5h3M13.5 16.5h3" />
    </>
  ),
  activity: (
    <>
      <path d="M3 12h4l2.5-6 4.5 12 2.5-6H21" />
    </>
  ),
  file: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h4" />
    </>
  ),
  folder: (
    <>
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h3.7a2 2 0 0 1 1.6.8l1 1.4a2 2 0 0 0 1.6.8h5.1A2.5 2.5 0 0 1 21 10.5v6A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5z" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  cart: (
    <>
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M2.5 3.5h2.2l2.6 11.2h10.9l2.3-8H6.2" />
    </>
  ),
  contract: (
    <>
      <path d="M13.5 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5z" />
      <path d="M13.5 3v5.5H19" />
      <path d="m8.5 14.5 2 2 4-4.5" />
    </>
  ),
  wheat: (
    <>
      <path d="M12 21V9" />
      <path d="M12 13c-3.5 0-5.5-2-5.5-5.5 3.5 0 5.5 2 5.5 5.5Z" />
      <path d="M12 9c3.5 0 5.5-2 5.5-5.5C14 3.5 12 5.5 12 9Z" />
      <path d="M12 17c-3.5 0-5.5-2-5.5-5.5" />
      <path d="M12 21c3.5 0 5.5-2 5.5-5.5" />
    </>
  ),
  store: (
    <>
      <path d="M3.5 9.5V19a1.5 1.5 0 0 0 1.5 1.5h14a1.5 1.5 0 0 0 1.5-1.5V9.5" />
      <path d="M2.5 9.5 5 4h14l2.5 5.5a3 3 0 0 1-5.6 2 3 3 0 0 1-5.8 0 3 3 0 0 1-5.6-2Z" />
      <path d="M10 20.5v-5h4v5" />
    </>
  ),
  package: (
    <>
      <path d="m12 2.5 8.5 4.6v9.8L12 21.5l-8.5-4.6V7.1z" />
      <path d="m3.5 7.1 8.5 4.6 8.5-4.6" />
      <path d="M12 11.7v9.8" />
      <path d="m7.8 4.8 8.5 4.6" />
    </>
  ),
  wallet: (
    <>
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H18a2 2 0 0 1 2 2v1.5" />
      <rect x="3" y="7.5" width="18" height="12" rx="2.5" />
      <path d="M15.5 13.5h2" />
    </>
  ),
  receipt: (
    <>
      <path d="M6 2.5h12v19l-3-2-3 2-3-2-3 2z" />
      <path d="M9 7h6M9 11h6M9 15h4" />
    </>
  ),
  trending: (
    <>
      <path d="m3 16 5.5-5.5 4 4L21 6" />
      <path d="M15.5 6H21v5.5" />
    </>
  ),
  chart: (
    <>
      <path d="M3.5 20.5h17" />
      <rect x="4.5" y="12" width="3.5" height="6" rx="1" />
      <rect x="10.25" y="8" width="3.5" height="10" rx="1" />
      <rect x="16" y="4.5" width="3.5" height="13.5" rx="1" />
    </>
  ),
  sparkles: (
    <>
      <path d="m12 3 1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8z" />
      <path d="m18.5 14.5.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z" />
      <path d="m5 3 .7 1.6L7.3 5.3l-1.6.7L5 7.6l-.7-1.6L2.7 5.3l1.6-.7z" />
    </>
  ),
  alert: (
    <>
      <path d="M10.3 3.9 2.6 17.2A1.8 1.8 0 0 0 4.2 20h15.6a1.8 1.8 0 0 0 1.6-2.8L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </>
  ),
  book: (
    <>
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22z" />
      <path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20" />
      <path d="M8 6.5h8M8 10h5" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.6 2.6 0 1 1 3.9 2.3c-.9.5-1.4 1.1-1.4 2.2" />
      <path d="M12 17h.01" />
    </>
  ),
  shield: (
    <>
      <path d="M12 2.5 4.5 5.5v6c0 4.6 3.1 8.5 7.5 10 4.4-1.5 7.5-5.4 7.5-10v-6z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z" />
    </>
  ),
  clipboard: (
    <>
      <rect x="5" y="4.5" width="14" height="17" rx="2" />
      <path d="M9 4.5V3h6v1.5" />
      <path d="M9 10h6M9 14h6M9 18h4" />
    </>
  ),
  monitor: (
    <>
      <rect x="2.5" y="4" width="19" height="12.5" rx="2" />
      <path d="M8.5 21h7M12 16.5V21" />
    </>
  ),
  checkSquare: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="m8 12 3 3 5.5-6" />
    </>
  ),
  home: (
    <>
      <path d="m3 10.5 9-7.5 9 7.5" />
      <path d="M5.5 9.5V20a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5V9.5" />
      <path d="M9.5 21.5v-6h5v6" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8.5a6 6 0 1 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 14.5 18 8.5Z" />
      <path d="M13.7 20a2 2 0 0 1-3.4 0" />
    </>
  ),
  menu: (
    <>
      <path d="M4 6.5h16M4 12h16M4 17.5h16" />
    </>
  ),
  close: (
    <>
      <path d="M6 6l12 12M18 6 6 18" />
    </>
  ),
  panelLeft: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
    </>
  ),
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 16 5-4-5-4" />
      <path d="M21 12H9" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="4.5" />
      <path d="m11.2 11.8 8.3-8.3" />
      <path d="m16.5 6.5 2 2" />
      <path d="m14.5 8.5 2 2" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  dot: <circle cx="12" cy="12" r="2.5" />,
  check: <path d="m4.5 12.5 5 5 10-11" />,
}

export default function NavIcon({ name, className = 'h-[18px] w-[18px]', strokeWidth = 1.7 }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name] || PATHS.dot}
    </svg>
  )
}
