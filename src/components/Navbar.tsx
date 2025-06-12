import { Link, useLocation } from "react-router-dom";
import { ConnectWalletButton } from "./ConnectWalletButton";
import "./Navbar.css";

export const Navbar = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <div className="brand-icon">
            <span className="brand-symbol">🐸</span>
          </div>
          <span className="brand-text">GORF</span>
          <span className="brand-subtitle">TOKEN LOCKER</span>
        </Link>

        <div className="navbar-links">
          <Link to="/" className={`nav-link ${isActive("/") ? "active" : ""}`}>
            Explorer
          </Link>
          <Link
            to="/my-locks"
            className={`nav-link ${isActive("/my-locks") ? "active" : ""}`}>
            My Locks
          </Link>
          <Link
            to="/create-lock"
            className={`nav-link create-new-lock ${
              isActive("/create-lock") ? "active" : ""
            }`}>
            Create New Lock
          </Link>
        </div>

        <ConnectWalletButton />
      </div>
    </nav>
  );
};
