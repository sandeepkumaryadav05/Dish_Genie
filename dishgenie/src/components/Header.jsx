import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../App.css";
import { useAuth } from "../context/authContext.js";
import { useAdmin } from "../context/adminContext.js";
import { useTheme } from "../context/themeContext.js";
import dishgenieLogo from "../assets/dishgenie-logo.svg";

export default function Header() {
  const { user, logout } = useAuth();
  const { isAdmin } = useAdmin();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    if (loggingOut) return;
    try {
      setLoggingOut(true);
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setLoggingOut(false);
    }
  };

  const isActive = (path) => location.pathname === path;

  const userLabel = user?.displayName || user?.email?.split("@")[0] || "";
  const userInitial = userLabel.charAt(0).toUpperCase() || "?";

  const primaryNav = user
    ? [
        { to: "/", label: "Discover" },
        { to: "/planner", label: "Meal Planner" },
        { to: "/assistant", label: "AI Chef", accent: true },
        { to: "/favorites", label: "Favorites" },
      ]
    : [];

  return (
    <>
      <header className={`header${scrolled ? " scrolled" : ""}`}>
        <div className="header-inner">
          <Link to="/" className="brand">
            <img src={dishgenieLogo} alt="DishGenie" className="brand-icon" />
            <span className="brand-name">DishGenie</span>
          </Link>

          <nav className="header-nav">
            {primaryNav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`header-nav-link${item.accent ? " accent" : ""}${isActive(item.to) ? " active" : ""}`}
              >
                {item.accent && <span className="nav-ai-sparkle">✨</span>}
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="header-actions">
            <button
              className="header-icon-btn theme-toggle-header"
              onClick={toggle}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              <span className="icon-sun">☀️</span>
              <span className="icon-moon">🌙</span>
            </button>

            {user && (
              <div className="header-profile" ref={profileRef}>
                <button
                  className="profile-trigger"
                  onClick={() => setProfileOpen((o) => !o)}
                  aria-label="User menu"
                >
                  <span className="profile-avatar">{userInitial}</span>
                  <span className="profile-name">{userLabel}</span>
                  <svg
                    className={`profile-chevron${profileOpen ? " open" : ""}`}
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                  >
                    <path
                      d="M3 4.5L6 7.5L9 4.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {profileOpen && (
                  <div className="profile-dropdown">
                    <div className="dropdown-header">
                      <span className="dropdown-avatar">{userInitial}</span>
                      <div className="dropdown-user">
                        <span className="dropdown-name">{userLabel}</span>
                        {user.email && (
                          <span className="dropdown-email">{user.email}</span>
                        )}
                      </div>
                    </div>
                    <div className="dropdown-divider" />
                    <Link to="/preferences" className="dropdown-item">
                      ⚙️ Preferences
                    </Link>
                    <Link to="/favorites" className="dropdown-item">
                      ❤️ Favorites
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" className="dropdown-item admin-item">
                        🛠️ Admin Dashboard
                      </Link>
                    )}
                    <div className="dropdown-divider" />
                    <button
                      className="dropdown-item logout"
                      onClick={handleLogout}
                      disabled={loggingOut}
                    >
                      {loggingOut ? "Logging out..." : "🚪 Log out"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {!user && (
              <div className="header-auth-btns">
                <Link
                  to="/login"
                  className={`header-nav-link${isActive("/login") ? " active" : ""}`}
                >
                  Log in
                </Link>
                <Link to="/signup" className="header-cta-btn">
                  Sign up
                </Link>
              </div>
            )}

            <button
              className={`hamburger${mobileOpen ? " open" : ""}`}
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      <div className={`mobile-drawer${mobileOpen ? " open" : ""}`}>
        <div className="mobile-drawer-inner">
          {user && (
            <div className="mobile-user-info">
              <span className="mobile-avatar">{userInitial}</span>
              <div>
                <div className="mobile-user-name">{userLabel}</div>
                {user.email && (
                  <div className="mobile-user-email">{user.email}</div>
                )}
              </div>
            </div>
          )}

          <nav className="mobile-drawer-nav">
            {primaryNav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`mobile-drawer-link${item.accent ? " accent" : ""}${isActive(item.to) ? " active" : ""}`}
              >
                {item.accent && <span className="nav-ai-sparkle">✨</span>}
                {item.label}
              </Link>
            ))}

            {user && (
              <>
                <div className="mobile-drawer-divider" />
                <Link
                  to="/preferences"
                  className={`mobile-drawer-link${isActive("/preferences") ? " active" : ""}`}
                >
                  ⚙️ Preferences
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`mobile-drawer-link${isActive("/admin") ? " active" : ""}`}
                  >
                    🛠️ Admin
                  </Link>
                )}
                <div className="mobile-drawer-divider" />
                <button
                  className="mobile-drawer-link logout"
                  onClick={handleLogout}
                  disabled={loggingOut}
                >
                  🚪 {loggingOut ? "Logging out..." : "Log out"}
                </button>
              </>
            )}

            {!user && (
              <>
                <div className="mobile-drawer-divider" />
                <Link to="/login" className="mobile-drawer-link">
                  Log in
                </Link>
                <Link to="/signup" className="mobile-drawer-link cta">
                  Sign up
                </Link>
              </>
            )}
          </nav>

          <div className="mobile-drawer-footer">
            <button
              className="header-icon-btn theme-toggle-header"
              onClick={toggle}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              <span className="icon-sun">☀️</span>
              <span className="icon-moon">🌙</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
