import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { ConnectWalletButton } from "./ConnectWalletButton";

export const Navbar = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const navLinks = [
    { path: "/", label: "Explorer" },
    { path: "/my-locks", label: "My Locks" },
    { path: "/create-lock", label: "Create New Lock", isSpecial: true },
    { path: "/how-to-use", label: "How to Use" },
  ];

  return (
    <nav className="bg-gray-900 border-b border-gray-700 px-4 lg:px-8 sticky top-0 z-50">
      <div className="flex items-center justify-between max-w-7xl mx-auto h-16 lg:h-18">
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-3 text-white no-underline">
          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
            <span className="font-bold text-lg text-black">🐸</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xl lg:text-2xl font-bold text-white">
              GORF
            </span>
            <span className="text-xs text-gray-400 hidden sm:block">
              TOKEN LOCKER
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6 lg:gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isActive(link.path)
                  ? "text-green-400 bg-green-400/15"
                  : link.isSpecial
                  ? "text-green-400 hover:text-green-300 hover:bg-green-400/10"
                  : "text-gray-400 hover:text-green-400 hover:bg-green-400/10"
              }`}>
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop Connect Button */}
        <div className="hidden md:block">
          <ConnectWalletButton />
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMobileMenu}
          className="md:hidden p-2 text-gray-400 hover:text-white transition-all duration-200 hover:bg-gray-800 rounded-lg"
          aria-label="Toggle mobile menu">
          <div className="relative w-6 h-6">
            <Menu
              size={24}
              className={`absolute inset-0 transition-all duration-300 ${
                isMobileMenuOpen
                  ? "opacity-0 rotate-180 scale-75"
                  : "opacity-100 rotate-0 scale-100"
              }`}
            />
            <X
              size={24}
              className={`absolute inset-0 transition-all duration-300 ${
                isMobileMenuOpen
                  ? "opacity-100 rotate-0 scale-100"
                  : "opacity-0 -rotate-180 scale-75"
              }`}
            />
          </div>
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden fixed inset-0 top-16 z-40 transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}>
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={closeMobileMenu}
        />

        {/* Menu Content */}
        <div
          className={`relative bg-gray-900 h-full transform transition-all duration-300 ease-in-out ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}>
          <div className="px-6 py-8 h-full flex flex-col">
            {/* Navigation Links */}
            <div className="space-y-6 flex-1">
              {navLinks.map((link, index) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={closeMobileMenu}
                  className={`block px-6 py-4 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 ${
                    isActive(link.path)
                      ? "text-green-400 bg-green-400/15 border border-green-400/30"
                      : link.isSpecial
                      ? "text-green-400 hover:text-green-300 hover:bg-green-400/10 border border-green-400/20"
                      : "text-gray-300 hover:text-green-400 hover:bg-green-400/10 border border-gray-700 hover:border-green-400/30"
                  }`}
                  style={{
                    transitionDelay: isMobileMenuOpen
                      ? `${index * 100}ms`
                      : "0ms",
                  }}>
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Connect Button at Bottom */}
            <div
              className={`pt-6 border-t border-gray-700 transform transition-all duration-300 ease-in-out ${
                isMobileMenuOpen
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}
              style={{
                transitionDelay: isMobileMenuOpen ? "300ms" : "0ms",
              }}>
              <ConnectWalletButton />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
