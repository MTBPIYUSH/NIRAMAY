import { Link } from "react-router-dom";
import { Trash2, Github, Twitter, Facebook } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-background border-t py-8">
      <div className="container grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Trash2 className="h-6 w-6 text-green-600" />
            <span className="text-xl font-bold">SmartWaste</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Automating waste management for a cleaner future. Join us in making
            our cities cleaner and more sustainable.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Quick Links</h3>
          <ul className="space-y-2">
            <li>
              <Link
                to="/"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                to="/report"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Report Waste
              </Link>
            </li>
            <li>
              <Link
                to="/dashboard"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                to="/leaderboard"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Leaderboard
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Resources</h3>
          <ul className="space-y-2">
            <li>
              <Link
                to="/contact"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Contact Us
              </Link>
            </li>
            <li>
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Privacy Policy
              </a>
            </li>
            <li>
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Terms of Service
              </a>
            </li>
            <li>
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                FAQ
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Connect With Us</h3>
          <div className="flex space-x-4">
            <a href="#" className="text-muted-foreground hover:text-foreground">
              <Github className="h-5 w-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground">
              <Twitter className="h-5 w-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground">
              <Facebook className="h-5 w-5" />
            </a>
          </div>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">
              Subscribe to our newsletter
            </p>
            <div className="mt-2 flex gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
              <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mt-8 border-t pt-4">
        <p className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} SmartWaste. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
