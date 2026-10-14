'use client';

// Login page markup. Converted from public/legacy/login.body.html.
// Behaviour lives in public/legacy/login.js and is attached by <LegacyScripts>.
import '@/styles/premium.css';
import '@/styles/pages/login.css';

export default function LoginBody() {
  return (
    <>
      <div className="cx-page">
        <section className="cx-brand">
          <div className="cx-brand-bg" aria-hidden="true">
            <div className="cx-glow cx-glow--a"></div>
            <div className="cx-glow cx-glow--b"></div>
            <div className="cx-rings">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div className="cx-dotgrid"></div>
            <canvas id="cx-three-canvas" className="cx-three-canvas"></canvas>
            <div className="cx-brand-scrim"></div>
            <svg className="cx-skyline cx-skyline-fallback" viewBox="0 0 900 340" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
              <g fill="#04123a">
                <rect x="0" y="260" width="60" height="80"></rect>
                <rect x="55" y="220" width="14" height="120"></rect>
                <rect x="90" y="240" width="30" height="100"></rect>
                <rect x="130" y="200" width="18" height="140"></rect>
                <rect x="160" y="255" width="70" height="85"></rect>
                <circle cx="150" cy="196" r="6"></circle>
                <rect x="240" y="215" width="16" height="125"></rect>
                <rect x="265" y="245" width="55" height="95"></rect>
                <rect x="330" y="190" width="20" height="150"></rect>
                <circle cx="340" cy="186" r="7"></circle>
                <rect x="360" y="235" width="40" height="105"></rect>
                <rect x="410" y="205" width="16" height="135"></rect>
                <rect x="435" y="255" width="90" height="85"></rect>
                <rect x="535" y="215" width="14" height="125"></rect>
                <rect x="558" y="240" width="34" height="100"></rect>
                <rect x="600" y="185" width="18" height="155"></rect>
                <circle cx="609" cy="180" r="7"></circle>
                <rect x="630" y="250" width="60" height="90"></rect>
                <rect x="700" y="225" width="16" height="115"></rect>
                <rect x="725" y="255" width="45" height="85"></rect>
                <rect x="780" y="200" width="20" height="140"></rect>
                <circle cx="790" cy="195" r="6"></circle>
                <rect x="815" y="245" width="55" height="95"></rect>
              </g>
              <g className="cx-lights">
                <circle cx="150" cy="196" r="2.2"></circle>
                <circle cx="340" cy="186" r="2.2"></circle>
                <circle cx="609" cy="180" r="2.2"></circle>
                <circle cx="790" cy="195" r="2.2"></circle>
                <circle cx="70" cy="240" r="1.6"></circle>
                <circle cx="245" cy="235" r="1.6"></circle>
                <circle cx="415" cy="225" r="1.6"></circle>
                <circle cx="540" cy="235" r="1.6"></circle>
                <circle cx="705" cy="245" r="1.6"></circle>
                <circle cx="820" cy="265" r="1.6"></circle>
              </g>
            </svg>
          </div>
          <div className="cx-brand-content">
            <div className="cx-logo-badge">
              <img src="./images/abhitech-logo.png" alt="Abhitech logo" />
            </div>
            <h1 className="cx-brand-title">
              Combustion{" "}
              <span>Analyzer</span>
            </h1>
            <div className="cx-brand-rule"></div>
            <p className="cx-brand-sub">
              Advanced analysis and optimization for efficient combustion performance
            </p>
          </div>
        </section>
        <section className="cx-auth">
          <div className="cx-auth-bg" aria-hidden="true">
            <canvas id="cx-particles-canvas" className="cx-particles-canvas"></canvas>
            <div className="cx-auth-glow cx-auth-glow--a"></div>
            <div className="cx-auth-glow cx-auth-glow--b"></div>
            <div className="cx-auth-dotgrid"></div>
          </div>
          <div className="cx-card">
            <div className="cx-card-logo">
              <img src="./images/abhitech-logo.png" alt="Abhitech logo" />
            </div>
            <h2 className="cx-card-title">Welcome Back</h2>
            <p className="cx-card-sub">Sign in to access the Combustion Analyzer</p>
            <div className="cx-card-rule"></div>
            <form id="loginForm" autoComplete="on">
              <div className="cx-field">
                <svg className="cx-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M3.5 6.75A2.25 2.25 0 0 1 5.75 4.5h12.5A2.25 2.25 0 0 1 20.5 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H5.75A2.25 2.25 0 0 1 3.5 17.25V6.75Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"></path>
                  <path d="M4.5 7 12 12.75 19.5 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
                <input type="text" id="email" placeholder="Email" required autoComplete="username" />
              </div>
              <div className="cx-field cx-field--password">
                <svg className="cx-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="5" y="10.5" width="14" height="9.5" rx="2.2" stroke="currentColor" strokeWidth="1.6"></rect>
                  <path d="M8 10.5V7.75a4 4 0 1 1 8 0V10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"></path>
                </svg>
                <input type="password" id="password" placeholder="Password" required autoComplete="current-password" />
                {' '}
                <button type="button" className="cx-toggle-pass" id="togglePassword" aria-label="Show password" aria-pressed="false">
                  <svg className="cx-eye cx-eye--open" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M2.5 12S5.75 5.5 12 5.5 21.5 12 21.5 12 18.25 18.5 12 18.5 2.5 12 2.5 12Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"></path>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"></circle>
                  </svg>
                  <svg className="cx-eye cx-eye--closed" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M3.5 3.5l17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"></path>
                    <path d="M10.6 5.67A9.77 9.77 0 0 1 12 5.5c6.25 0 9.5 6.5 9.5 6.5a17.4 17.4 0 0 1-3.06 4.03M6.6 6.6C4.02 8.28 2.5 12 2.5 12s3.25 6.5 9.5 6.5a9.66 9.66 0 0 0 3.9-.82" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </button>
              </div>
              <button type="submit" className="cx-submit">
                <span>Login</span>
              </button>
            </form>
            <p id="message"></p>
            <div className="cx-card-divider"></div>
            <p className="cx-card-footer">
              Powered by{" "}
              <span>ABHITECH EnergyCon Ltd.</span>
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
