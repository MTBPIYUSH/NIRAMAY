import { Link } from "react-router-dom";
import {
  Trash2,
  BarChart,
  Trophy,
  MessageCircle,
  Menu,
  X,
  Bell,
  Leaf,
  Sprout,
  Recycle,
} from "lucide-react";
import { Button } from "./ui/button";
import { ThemeToggle } from "./theme-toggle";
import { useState, useEffect } from "react";
import { UserAvatar } from "./auth/user-avatar";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(2); // Example notification count

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const clearNotifications = () => {
    setNotificationCount(0);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <div className="relative">
              <Recycle className="h-6 w-6 text-nature-500" />
              <Leaf className="h-3 w-3 text-leaf-500 absolute -top-1 -right-1" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-nature-600 to-ocean-600 bg-clip-text text-transparent">
              Niramay
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav
          className="hidden md:flex items-center gap-6"
          aria-label="Main navigation"
        >
          <Link
            to="/"
            className="text-sm font-medium hover:text-nature-600 transition-colors relative group"
          >
            Home
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-nature-500 transition-all group-hover:w-full"></span>
          </Link>
          <Link
            to="/report"
            className="text-sm font-medium hover:text-nature-600 transition-colors relative group"
          >
            Report Waste
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-nature-500 transition-all group-hover:w-full"></span>
          </Link>
          <Link
            to="/dashboard"
            className="text-sm font-medium hover:text-nature-600 transition-colors relative group"
          >
            Dashboard
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-nature-500 transition-all group-hover:w-full"></span>
          </Link>
          <Link
            to="/leaderboard"
            className="text-sm font-medium hover:text-nature-600 transition-colors relative group"
          >
            Leaderboard
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-nature-500 transition-all group-hover:w-full"></span>
          </Link>
          <Link
            to="/contact"
            className="text-sm font-medium hover:text-nature-600 transition-colors relative group"
          >
            Contact
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-nature-500 transition-all group-hover:w-full"></span>
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <Badge
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white"
                    variant="destructive"
                  >
                    {notificationCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Notifications</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearNotifications}
                    className="h-auto p-0 text-xs text-muted-foreground"
                  >
                    Mark all as read
                  </Button>
                </div>
                {notificationCount > 0 ? (
                  <div className="space-y-2">
                    <DropdownMenuItem className="p-3 cursor-default">
                      <div>
                        <p className="font-medium text-sm">
                          Waste Report Updated
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Your report #WR-1234 status changed to "In Progress"
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          2 hours ago
                        </p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="p-3 cursor-default">
                      <div>
                        <p className="font-medium text-sm">Points Earned!</p>
                        <p className="text-xs text-muted-foreground">
                          You earned 50 points for your recent waste report
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Yesterday
                        </p>
                      </div>
                    </DropdownMenuItem>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No new notifications
                  </p>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="hidden md:flex items-center gap-3">
            <Button
              asChild
              className="hidden md:flex bg-nature-600 hover:bg-nature-700 transition-colors"
            >
              <Link to="/report" className="flex items-center gap-1">
                <Sprout className="h-4 w-4" />
                Report Waste
              </Link>
            </Button>
            <UserAvatar />
          </div>

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
            <Link
              to="/login"
              className="flex items-center gap-2 p-2 hover:bg-muted rounded-md mt-2 border-t pt-4"
              onClick={toggleMenu}
            >
              Sign In / Register
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
