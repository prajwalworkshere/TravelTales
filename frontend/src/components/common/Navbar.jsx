import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Navbar.css";

const API_ORIGIN = "http://localhost:5000";

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const getNavClass = ({ isActive }) =>
    `nav-link travel-nav-link ${isActive ? "active" : ""}`;

  const profileImage = user?.profile_image
    ? user.profile_image.startsWith("http")
      ? user.profile_image
      : `${API_ORIGIN}/${user.profile_image.replace(/^\/+/, "")}`
    : "";

  const initials = (user?.full_name || "Traveller")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

  return (
    <nav className="navbar navbar-expand-lg travel-navbar">
      <div className="container">
        {/* BRAND */}
        <Link className="navbar-brand travel-brand" to="/">
          <i className="bi bi-globe-asia-australia"></i>
          <span>TravelTales</span>
        </Link>

        {/* MOBILE TOGGLER */}
        <button
          className="navbar-toggler travel-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#travelNavbar"
          aria-controls="travelNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* NAVIGATION */}
        <div className="collapse navbar-collapse" id="travelNavbar">
          <ul className="navbar-nav ms-auto align-items-lg-center">
            <li className="nav-item">
              <NavLink to="/" end className={getNavClass}>
                Home
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink to="/explore" className={getNavClass}>
                Explore
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink to="/about" className={getNavClass}>
                About
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink to="/contact" className={getNavClass}>
                Contact
              </NavLink>
            </li>

            {!isAuthenticated ? (
              <>
                <li className="nav-item">
                  <NavLink to="/login" className={getNavClass}>
                    Login
                  </NavLink>
                </li>

                <li className="nav-item ms-lg-2">
                  <NavLink
                    to="/register"
                    className="nav-link travel-register-btn"
                  >
                    Get Started
                  </NavLink>
                </li>
              </>
            ) : (
              <>
                {user?.role === "ADMIN" && (
                  <li className="nav-item">
                    <NavLink to="/admin/dashboard" className={getNavClass}>
                      <i className="bi bi-speedometer2 me-1"></i>
                      Admin
                    </NavLink>
                  </li>
                )}

                {/* PROFILE - NORMAL NAVIGATION STYLE */}
                <li className="nav-item">
                  <NavLink
                    to="/profile"
                    className={({ isActive }) =>
                      `nav-link travel-nav-link profile-nav-link ${
                        isActive ? "active" : ""
                      }`
                    }
                  >
                    <span className="nav-profile-avatar">
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt=""
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                            event.currentTarget.nextElementSibling.style.display =
                              "flex";
                          }}
                        />
                      ) : null}

                      <span
                        className="nav-profile-initials"
                        style={{ display: profileImage ? "none" : "flex" }}
                      >
                        {initials || "T"}
                      </span>
                    </span>

                    <span className="nav-profile-username">
                      {user?.full_name || "My Profile"}
                    </span>
                  </NavLink>
                </li>

                {/* LOGOUT */}
                <li className="nav-item logout-nav-item">
                  <button
                    type="button"
                    className="travel-logout-btn"
                    onClick={handleLogout}
                  >
                    <i className="bi bi-box-arrow-right"></i>
                    <span>Logout</span>
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
