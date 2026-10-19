import IOSDeviceFrame from "../../components/IOSDeviceFrame";

export default function SplashScreen() {
  return (
    <IOSDeviceFrame>
        <div className="splash-screen" aria-label="Passage Walk">
          <div className="splash-brand">
            <svg
              className="splash-mark"
              viewBox="0 0 144 144"
              fill="none"
              role="img"
              aria-label="An open Bible becoming a walking path"
            >
              <path
                className="splash-book-page splash-book-page-left"
                d="M20 82.5C35 77.2 51.4 78.6 68.5 91.6V119.2C51.1 107.8 34.8 105.7 20 110.8V82.5Z"
              />
              <path
                className="splash-book-page splash-book-page-right"
                d="M124 82.5C109 77.2 92.6 78.6 75.5 91.6V119.2C92.9 107.8 109.2 105.7 124 110.8V82.5Z"
              />
              <path
                className="splash-book-line"
                d="M20 82.5C35 77.2 51.4 78.6 68.5 91.6M124 82.5C109 77.2 92.6 78.6 75.5 91.6M72 93V119"
              />
              <path
                className="splash-path"
                d="M72 91.5C72 73.5 66.6 67.8 69.6 54.8C71.4 46.8 76.2 39.1 80.8 32.2"
              />
              <g className="splash-footsteps">
                <path d="M59.2 69.8C55.8 68.4 54.4 64.3 56.1 60.4C57.5 57.2 60.4 55.4 62.8 56.5C65.5 57.7 66.2 61.3 64.6 64.8C63.1 68.2 61 70.6 59.2 69.8Z" />
                <path d="M80.9 55.3C77.6 54.1 76.1 50.1 77.6 46.1C78.9 42.7 81.7 40.8 84.2 41.8C86.9 42.9 87.8 46.4 86.3 50C85 53.5 82.7 56 80.9 55.3Z" />
              </g>
            </svg>

            <div className="splash-wordmark">Passage Walk</div>
            <div className="splash-tagline">Walk. Read. Reflect.</div>
          </div>
        </div>
    </IOSDeviceFrame>
  );
}
