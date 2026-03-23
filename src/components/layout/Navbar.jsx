import { NavLink } from "react-router-dom";
import { SITE_CONFIG } from "../../config/site.config.js";
import { Home, Newspaper, Users } from "lucide-react";

const NAV_ITEMS = [
  { to: "/",            label: SITE_CONFIG.nav.home,        icon: Home      },
  { to: "/novedades",   label: SITE_CONFIG.nav.news,        icon: Newspaper },
  { to: "/comunidades", label: SITE_CONFIG.nav.communities, icon: Users     },
];

export default function Navbar({ mobileOpen, onClose }) {
  return (
    <nav className={`navbar ${mobileOpen ? "navbar-open" : ""}`}>
      <div className="navbar-inner">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) => `nav-item ${isActive ? "nav-item-active" : ""}`}
            onClick={onClose}
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
