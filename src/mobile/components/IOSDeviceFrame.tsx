export default function IOSDeviceFrame({ children, statusBarStyle = "dark" }: { children: React.ReactNode; statusBarStyle?: "light" | "dark" }) {
  return (
    <div className="ios-device-frame">
      <i className="ios-button ios-button-action" />
      <i className="ios-button ios-button-volume-up" />
      <i className="ios-button ios-button-volume-down" />
      <i className="ios-button ios-button-power" />
      <div className="ios-device-screen">
        <div className={`ios-status-bar ios-status-bar-${statusBarStyle}`} aria-hidden="true">
          <span className="ios-status-time">9:41</span>
          <div className="ios-status-icons">
            <svg className="ios-cellular" viewBox="0 0 18 12" fill="currentColor">
              <rect x="0" y="8" width="3" height="4" rx="1" />
              <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
              <rect x="10" y="3" width="3" height="9" rx="1" />
              <rect x="15" y="0" width="3" height="12" rx="1" />
            </svg>
            <svg className="ios-wifi" viewBox="0 0 18 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M1.5 4.5a11.5 11.5 0 0 1 15 0" />
              <path d="M4.5 8a7 7 0 0 1 9 0" />
              <path d="M7.6 11.2a2.3 2.3 0 0 1 2.8 0" />
            </svg>
            <span className="ios-battery"><i></i></span>
          </div>
        </div>
        <div className="ios-dynamic-island" />
        {children}
      </div>
    </div>
  );
}
