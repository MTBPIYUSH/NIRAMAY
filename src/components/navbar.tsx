import { Link } from "react-router-dom";
import { Trash2, BarChart, Trophy, MessageCircle, Menu, X } from "lucide-react";
import { Button } from "./ui/button";
import { ThemeToggle } from "./theme-toggle";
import { useState } from "react";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <Trash2 className="h-6 w-6 text-green-600" />
            <span className="text-xl font-bold">SmartWaste</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium hover:text-primary">
            Home
          </Link>
          <Link to="/report" className="text-sm font-medium hover:text-primary">
            Report Waste
          </Link>
          <Link
            to="/dashboard"
            className="text-sm font-medium hover:text-primary"
          >
            Dashboard
          </Link>
          <Link
            to="/leaderboard"
            className="text-sm font-medium hover:text-primary"
          >
            Leaderboard
          </Link>
          <Link
            to="/contact"
            className="text-sm font-medium hover:text-primary"
          >
            Contact
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Button asChild className="hidden md:flex">
            <Link to="/report">Report Waste</Link>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="md:hidden"
            onClick={toggleMenu}
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden container py-4 bg-background">
          <nav className="flex flex-col space-y-4">
            <Link
              to="/"
              className="flex items-center gap-2 p-2 hover:bg-muted rounded-md"
              onClick={toggleMenu}
            >
              Home
            </Link>
            <Link
              to="/report"
              className="flex items-center gap-2 p-2 hover:bg-muted rounded-md"
              onClick={toggleMenu}
            >
              <Trash2 className="h-4 w-4" />
              Report Waste
            </Link>
            <Link
              to="/dashboard"
              className="flex items-center gap-2 p-2 hover:bg-muted rounded-md"
              onClick={toggleMenu}
            >
              <BarChart className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              to="/leaderboard"
              className="flex items-center gap-2 p-2 hover:bg-muted rounded-md"
              onClick={toggleMenu}
            >
              <Trophy className="h-4 w-4" />
              Leaderboard
            </Link>
            <Link
              to="/contact"
              className="flex items-center gap-2 p-2 hover:bg-muted rounded-md"
              onClick={toggleMenu}
            >
              <MessageCircle className="h-4 w-4" />
              Contact
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
