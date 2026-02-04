"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, memo } from "react";
import { Menu, X, User, Bell } from "lucide-react";
import { Button, StatLineLogo } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/hooks/useAuth";
import { SearchBar } from "./search-bar";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, loading } = useAuth();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <StatLineLogo size="md" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink href="/games" active={pathname.startsWith("/games")}>Games</NavLink>
            <NavLink href="/teams" active={pathname.startsWith("/teams")}>Teams</NavLink>
            <NavLink href="/compare" active={pathname.startsWith("/compare")}>Compare</NavLink>
            <NavLink href="/predictions" active={pathname.startsWith("/predictions")}>Predictions</NavLink>
            <NavLink href="/all-time" active={pathname.startsWith("/all-time")}>Top 100</NavLink>
          </nav>

          {/* Search & Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block w-64">
              <SearchBar />
            </div>

            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="p-2">
                      <Bell className="w-5 h-5" />
                    </Button>
                    <Link href="/profile">
                      <Button variant="ghost" size="sm" className="p-2">
                        <User className="w-5 h-5" />
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="hidden sm:flex items-center gap-2">
                    <Link href="/login">
                      <Button variant="ghost" size="sm">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/signup">
                      <Button size="sm">Sign Up</Button>
                    </Link>
                  </div>
                )}
              </>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="mb-4">
              <SearchBar onClose={() => setIsMenuOpen(false)} />
            </div>
            <nav className="flex flex-col gap-1">
              <MobileNavLink href="/games" active={pathname.startsWith("/games")} onClick={() => setIsMenuOpen(false)}>
                Games
              </MobileNavLink>
              <MobileNavLink href="/teams" active={pathname.startsWith("/teams")} onClick={() => setIsMenuOpen(false)}>
                Teams
              </MobileNavLink>
              <MobileNavLink href="/compare" active={pathname.startsWith("/compare")} onClick={() => setIsMenuOpen(false)}>
                Compare
              </MobileNavLink>
              <MobileNavLink href="/predictions" active={pathname.startsWith("/predictions")} onClick={() => setIsMenuOpen(false)}>
                Predictions
              </MobileNavLink>
              <MobileNavLink href="/all-time" active={pathname.startsWith("/all-time")} onClick={() => setIsMenuOpen(false)}>
                Top 100
              </MobileNavLink>
              {!user && (
                <>
                  <hr className="border-border my-2" />
                  <MobileNavLink href="/login" onClick={() => setIsMenuOpen(false)}>
                    Sign In
                  </MobileNavLink>
                  <MobileNavLink href="/signup" onClick={() => setIsMenuOpen(false)}>
                    Sign Up
                  </MobileNavLink>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

// PERF: Memoize NavLink to prevent recreation when pathname changes in parent
const NavLink = memo(function NavLink({
  href,
  children,
  active,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "px-3 py-2 text-sm font-medium rounded-lg transition-colors",
        active
          ? "text-primary bg-primary/10"
          : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
      )}
    >
      {children}
    </Link>
  );
});

// PERF: Memoize MobileNavLink to prevent recreation when parent re-renders
const MobileNavLink = memo(function MobileNavLink({
  href,
  children,
  active,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "px-4 py-3 text-base font-medium rounded-lg transition-colors",
        active
          ? "text-primary bg-primary/10"
          : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
      )}
    >
      {children}
    </Link>
  );
});
