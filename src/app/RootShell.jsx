import '@/styles/base.css';
import SessionGate from '@/components/SessionGate';

// Runs before first paint: tells the CSS whether this *tab* has signed in (sessionStorage is
// cleared when the tab is closed). SessionGate uses it to blur + lock the page until re-login.
const TAB_AUTH_BOOT = `try{document.documentElement.setAttribute('data-ca-auth',sessionStorage.getItem('ca_tab_auth')==='1'?'ok':'locked')}catch(e){document.documentElement.setAttribute('data-ca-auth','locked')}`;

// Shared <html>/<body> shell for the root layouts. Each route group has its own
// root layout so a page can have a *server-rendered* body class (needed by the
// Calculation page's `body.page-slagging` rules — previously that class was added
// from useEffect, so on every refresh the page painted unstyled until JS ran).
export default function RootShell({ bodyClassName, children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: TAB_AUTH_BOOT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
        />
      </head>
      <body className={bodyClassName}>
        <SessionGate />
        {children}
      </body>
    </html>
  );
}