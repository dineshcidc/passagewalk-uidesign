export type AppIconName = "spark" | "steps" | "book" | "search" | "back" | "chevron" | "home" | "journey" | "journal" | "milestones" | "profile" | "edit" | "share" | "delete" | "download" | "bell" | "settings" | "help" | "info" | "shield" | "logout" | "camera" | "mail" | "alert" | "eye" | "eyeOff" | "library" | "check" | "compass";

export default function AppIcon({ name }: { name: AppIconName }) {
  const paths = {
    spark: <><path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3Z" /><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z" /></>,
    steps: <><circle cx="14.5" cy="4.5" r="2" /><path d="m13 7-2.5 4.5L14 14l1.8 6M10.5 11.5 7 19M12 9l3.2 2.6 3.3-1.1" /></>,
    book: <><path d="M3.5 5.5A3.5 3.5 0 0 1 7 2h4v18H7a3.5 3.5 0 0 0-3.5 3V5.5Z" /><path d="M20.5 5.5A3.5 3.5 0 0 0 17 2h-4v18h4a3.5 3.5 0 0 1 3.5 3V5.5Z" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" /></>,
    back: <path d="m15 18-6-6 6-6" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v11h14V10M9 21v-7h6v7" /></>,
    journey: <><circle cx="6" cy="18" r="2" /><circle cx="18" cy="6" r="2" /><path d="m7.5 16.5 9-9" /></>,
    journal: <><path d="M5 3h13a2 2 0 0 1 2 2v16H7a3 3 0 0 1-3-3V4a1 1 0 0 1 1-1Z" /><path d="M8 8h8M8 12h6" /></>,
    milestones: <><circle cx="12" cy="9" r="5" /><path d="m9 14-1 7 4-2 4 2-1-7" /><path d="m12 6.5.8 1.6 1.7.2-1.2 1.2.3 1.8-1.6-.9-1.6.9.3-1.8-1.2-1.2 1.7-.2.8-1.6Z" /></>,
    profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    edit: <><path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" /><path d="m13.5 7.5 3 3" /></>,
    share: <><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5" /></>,
    delete: <><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14" /><path d="M10 11v6M14 11v6" /></>,
    download: <><path d="M12 3v12M7.5 10.5 12 15l4.5-4.5" /><path d="M5 20h14" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9.8 9a2.4 2.4 0 1 1 3.4 2.2c-.8.4-1.2.9-1.2 1.8M12 17h.01" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7h.01" /></>,
    shield: <><path d="M12 3 4.5 6v5.5c0 4.7 3 7.8 7.5 9.5 4.5-1.7 7.5-4.8 7.5-9.5V6L12 3Z" /><path d="m9 12 2 2 4-4" /></>,
    logout: <><path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" /></>,
    camera: <><path d="M4 8h3l1.5-2h7L17 8h3v10H4V8Z" /><circle cx="12" cy="13" r="3" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></>,
    alert: <><path d="M12 3 2.8 20h18.4L12 3Z" /><path d="M12 9v5M12 17.5h.01" /></>,
    eye: <><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></>,
    library: <><rect x="3" y="4" width="4.5" height="16" rx="1" /><rect x="9.5" y="4" width="4.5" height="16" rx="1" /><path d="m15.8 5.6 3.6-1 3.3 14.6-3.6 1-3.3-14.6Z" /><path d="M3 8h4.5M9.5 16h4.5" /></>,
    check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
    compass: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" /></>,
    eyeOff: <><path d="M3 3l18 18" /><path d="M10.6 6.2A10.7 10.7 0 0 1 12 6c6 0 9.5 6 9.5 6a15 15 0 0 1-2.1 2.8M6.2 6.2C3.8 7.8 2.5 12 2.5 12s3.5 6 9.5 6c1.5 0 2.8-.4 4-1" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
