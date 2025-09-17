import React, { useState } from "react";
import { Search } from "lucide-react";
import { Link } from "react-router-dom";
import { FaUserCircle, FaBars } from "react-icons/fa";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b bg-white">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <span className="font-bold text-lg">Find Them</span>
        </div>

        {/* Hamburger for mobile */}
        <button
          className="md:hidden text-2xl"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Open menu"
        >
          <FaBars />
        </button>

        {/* Links */}
        <nav
          className={`flex-col md:flex-row md:flex items-center space-y-4 md:space-y-0 md:space-x-8 text-sm font-medium absolute md:static top-16 left-0 w-full md:w-auto bg-white md:bg-transparent px-6 py-4 md:p-0 z-50 transition-all ${
            menuOpen ? "flex" : "hidden md:flex"
          }`}
        >
          <Link to="/" className="hover:text-blue-500">Home</Link>
          <Link to="/missing-persons" className="hover:text-blue-500">Chat</Link>
          <Link to="/create-report" className="hover:text-blue-500">Report Missing Person</Link>
          <Link to="/create-danger-report" className="hover:text-blue-500">Report Dangers</Link>

          {/* Button */}
          <Link to="/signup" className="bg-yellow-400 hover:bg-yellow-500 transition px-4 py-1 rounded font-semibold">
            Sign Up
          </Link>
          <Link to="/login" className="border border-gray-300 px-4 py-1 rounded font-semibold">
            Login
          </Link>
          {/* User Account Icon */}
          <Link to="/account" className="text-2xl ml-2">
            <FaUserCircle />
          </Link>
        </nav>
      </div>
    </header>
  );
}