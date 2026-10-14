import '@/styles/base.css';

// Shared <html>/<body> shell for the root layouts. Each route group has its own
// root layout so a page can have a *server-rendered* body class (needed by the
// Calculation page's `body.page-slagging` rules — previously that class was added
// from useEffect, so on every refresh the page painted unstyled until JS ran).
export default function RootShell({ bodyClassName, children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
        />
      </head>
      <body className={bodyClassName}>{children}</body>
    </html>
  );
}
