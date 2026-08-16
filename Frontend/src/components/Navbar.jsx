import React from "react";
import { Link, useLocation } from "react-router-dom";
import HLogo from "../assets/images/H_logo.png";


const Navbar = () => {
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path ? "nav-link active" : "nav-link";

  return (

    <nav className="navbar">
      {/* Left */}
      <div className="nav-left">
        <img src={HLogo} alt="CampusHire Logo" className="nav-logo" />
        <span className="logo-text">CampusHire</span>
      </div>

      {/* Right */}
      <div className="nav-right">
        <Link to="/login" className="nav-pill">
          Login
        </Link>

        <Link to="/register" className="nav-pill nav-register">
          Register
        </Link>
      </div>
    </nav>

  );
};

export default Navbar;
