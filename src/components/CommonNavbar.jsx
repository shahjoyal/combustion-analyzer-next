'use client';

// Shared top navigation. The legacy page scripts look the buttons up by
// `data-target` and the logout button by id, so those hooks are preserved.
export default function CommonNavbar({ items, logoutId = 'common-logout-btn' }) {
  return (
    <div className="common-navbar-wrapper" role="navigation" aria-label="Main navigation">
      <nav className="common-navbar">
        <div className="brand">
          <img src="/images/abhitech-logo.png" alt="Abhitech logo" />
          <h1 className="title">Combustion Analyzer</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="nav-buttons" role="menubar" aria-label="Primary">
            {items.map(({ target, label, title, active }) => (
              <button key={target} data-target={target} title={title || label} className={active ? 'active' : undefined}>
                {label}
              </button>
            ))}
          </div>
          <div style={{ width: 8 }} />
          <div className="nav-buttons">
            <button className="logout-btn" id={logoutId} title="Logout">Logout</button>
          </div>
        </div>
      </nav>
    </div>
  );
}
