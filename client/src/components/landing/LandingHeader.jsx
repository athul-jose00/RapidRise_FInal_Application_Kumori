import { ChevronDown, Menu, X } from "lucide-react";
import { useSelector } from "react-redux";
import { selectIsAuthenticated } from "../../redux/user/userSlice.js";
import { navLinks } from "../../data/landingData.js";
import { Button, classNames } from "./landingUtils.jsx";

export default function LandingHeader({ mobileOpen, setMobileOpen, scrolled }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  return (
    <header
      className={classNames(
        "sticky top-3 z-40 mx-auto w-[min(1220px,calc(100%-1rem))] border border-neutral-100/80 bg-white/90 backdrop-blur-md shadow-[0_8px_32px_rgba(42,46,51,0.04)] transition-shadow duration-200",
        mobileOpen ? "rounded-2xl" : "rounded-full",
        scrolled ? "py-1.5" : "py-2.5",
      )}
    >
      <div className="flex items-center justify-between px-5 sm:px-6">
        <a
          href="#top"
          className="flex items-center gap-2 transition-opacity hover:opacity-90"
        >
          <img
            src="/mascot.png"
            alt="Kumori Mascot"
            className="h-8 w-auto object-contain sm:h-9"
          />
          <span className="font-sans text-lg font-extrabold tracking-tight text-neutral-900 sm:text-xl">
            Kumori
          </span>
        </a>

        <nav className="hidden items-center gap-1.5 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-55 hover:text-neutral-900"
            >
              {link.label}
              {link.hasDropdown && (
                <ChevronDown className="h-3 w-3 text-neutral-400" />
              )}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-5 lg:flex">
          {isAuthenticated ? (
            <Button variant="accent" href="/dashboard">
              Dashboard
            </Button>
          ) : (
            <>
              <a href="/login" className="text-sm font-semibold text-neutral-600 transition-colors hover:text-neutral-900">
                Log in
              </a>
              <Button variant="accent" href="/register">
                Get Started
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-neutral-800 lg:hidden hover:bg-neutral-100/60 cursor-pointer"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label="Toggle navigation"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-neutral-100 lg:hidden px-5 pb-3 pt-2">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                {link.label}
                {link.hasDropdown && (
                  <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
                )}
              </a>
            ))}
            <div className="mt-2 border-t border-neutral-100 pt-3 flex flex-col gap-2">
              {isAuthenticated ? (
                <Button
                  variant="accent"
                  href="/dashboard"
                  className="w-full py-2.5 text-center"
                  onClick={() => setMobileOpen(false)}
                >
                  Dashboard
                </Button>
              ) : (
                <>
                  <a 
                    href="/login" 
                    onClick={() => setMobileOpen(false)}
                    className="w-full py-2.5 text-center text-sm font-semibold text-neutral-600 hover:bg-neutral-50 rounded-xl transition-colors"
                  >
                    Log in
                  </a>
                  <Button
                    variant="accent"
                    href="/register"
                    className="w-full py-2.5 text-center"
                    onClick={() => setMobileOpen(false)}
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
