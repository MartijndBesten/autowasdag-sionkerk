"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { label: "Home",       href: "/#home" },
  { label: "Op de dag",  href: "/#op-de-dag" },
  { label: "Pakketten",  href: "/#pakketten" },
  { label: "Help mee",   href: "/help-mee" },
  { label: "Bijdragen",  href: "/bijdragen" },
  { label: "Praktisch",  href: "/#praktisch" },
];

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-[0_1px_0_rgba(0,0,0,0.07)]"
          : "bg-white/80 backdrop-blur-sm"
      }`}
    >
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-green-800 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8 2 5 5.5 5 9.5c0 5 7 12.5 7 12.5s7-7.5 7-12.5C19 5.5 16 2 12 2z" />
              </svg>
            </div>
            <div className="leading-tight">
              <span className="block font-bold text-sm text-green-950 group-hover:text-green-700 transition-colors">
                Autowasdag
              </span>
              <span className="block text-xs text-green-500">
                Sionkerk Houten
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((link) => {
              const isActive = pathname === "/" && link.href.startsWith("/#");
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={`relative px-3.5 py-2 rounded-full text-sm font-medium transition-colors duration-150
                    text-green-900 hover:text-green-700 hover:bg-green-50
                    ${isActive ? "after:absolute after:bottom-1 after:left-3.5 after:right-3.5 after:h-0.5 after:bg-green-500 after:rounded-full" : ""}
                  `}
                >
                  {link.label}
                </a>
              );
            })}
          </div>

          {/* CTA + hamburger */}
          <div className="flex items-center gap-2">
            <Link
              href="/reserveren"
              className="hidden sm:inline-flex items-center gap-1.5 bg-green-800 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-green-900 transition-colors shadow-sm"
            >
              Reserveren
            </Link>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 rounded-lg text-green-800 hover:bg-green-50 transition-colors"
              aria-label="Menu"
            >
              {menuOpen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobiel menu */}
        {menuOpen && (
          <div className="lg:hidden bg-white border-t border-stone-100 pb-5 shadow-sm">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 text-sm text-green-900 font-medium hover:bg-green-50 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="px-4 pt-3">
              <Link
                href="/reserveren"
                onClick={() => setMenuOpen(false)}
                className="block w-full text-center bg-green-800 text-white px-5 py-3 rounded-full text-sm font-semibold hover:bg-green-900 transition-colors"
              >
                Reserveren
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
