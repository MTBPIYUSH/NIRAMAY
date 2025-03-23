import { Link } from "react-router-dom";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Recycle,
  MapPin,
  BarChart3,
  Award,
  Leaf,
  TreePine,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden leaf-decoration">
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=1200&q=80"
              alt="Smart City Waste Management"
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background to-background/60" />
          </div>

          <div className="container relative z-10">
            <div className="max-w-3xl space-y-6">
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-nature-700 to-ocean-700 bg-clip-text text-transparent">
                Automating Waste Management for a Cleaner Future
              </h1>
              <p className="text-xl text-muted-foreground">
                Niramay uses AI to optimize waste collection, encourage
                recycling, and create cleaner communities through citizen
                participation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  asChild
                  size="lg"
                  className="gap-2 bg-nature-600 hover:bg-nature-700 transition-colors"
                >
                  <Link to="/report">
                    Report Waste <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/dashboard">View Dashboard</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Decorative leaf element */}
          <div className="absolute bottom-10 right-10 opacity-10 pointer-events-none hidden lg:block">
            <Leaf className="h-32 w-32 text-nature-600" />
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-gradient-to-b from-background to-nature-50/30 dark:to-nature-950/10 tree-decoration">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight text-nature-700 dark:text-nature-400">
                How Niramay Works
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Our platform combines AI, community participation, and municipal
                coordination to revolutionize waste management.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-card rounded-lg p-6 shadow-sm border flex flex-col items-center text-center hover:shadow-md transition-shadow hover:border-nature-200 dark:hover:border-nature-800">
                <div className="h-12 w-12 rounded-full bg-nature-100 dark:bg-nature-900/30 flex items-center justify-center mb-4 shadow-sm">
                  <Recycle className="h-6 w-6 text-nature-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  AI Waste Classification
                </h3>
                <p className="text-muted-foreground">
                  Upload an image and our AI automatically identifies the type
                  of waste for proper disposal.
                </p>
              </div>

              <div className="bg-card rounded-lg p-6 shadow-sm border flex flex-col items-center text-center hover:shadow-md transition-shadow hover:border-nature-200 dark:hover:border-nature-800">
                <div className="h-12 w-12 rounded-full bg-nature-100 dark:bg-nature-900/30 flex items-center justify-center mb-4 shadow-sm">
                  <MapPin className="h-6 w-6 text-nature-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Location Reporting
                </h3>
                <p className="text-muted-foreground">
                  Easily report uncollected waste with precise location data for
                  faster municipal response.
                </p>
              </div>

              <div className="bg-card rounded-lg p-6 shadow-sm border flex flex-col items-center text-center hover:shadow-md transition-shadow hover:border-nature-200 dark:hover:border-nature-800">
                <div className="h-12 w-12 rounded-full bg-nature-100 dark:bg-nature-900/30 flex items-center justify-center mb-4 shadow-sm">
                  <BarChart3 className="h-6 w-6 text-nature-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Route Optimization
                </h3>
                <p className="text-muted-foreground">
                  Smart algorithms create efficient collection routes based on
                  waste density and urgency.
                </p>
              </div>

              <div className="bg-card rounded-lg p-6 shadow-sm border flex flex-col items-center text-center hover:shadow-md transition-shadow hover:border-nature-200 dark:hover:border-nature-800">
                <div className="h-12 w-12 rounded-full bg-nature-100 dark:bg-nature-900/30 flex items-center justify-center mb-4 shadow-sm">
                  <Award className="h-6 w-6 text-nature-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Gamification</h3>
                <p className="text-muted-foreground">
                  Earn points and rewards for reporting waste and recycling,
                  competing on our community leaderboard.
                </p>
              </div>
            </div>
          </div>

          {/* Decorative tree element */}
          <div className="absolute bottom-0 right-0 opacity-10 pointer-events-none hidden lg:block">
            <TreePine className="h-40 w-40 text-nature-600" />
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-gradient-to-r from-nature-600 to-ocean-600 text-white relative overflow-hidden">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="p-4 rounded-lg backdrop-blur-sm bg-white/5 hover:bg-white/10 transition-colors">
                <h3 className="text-4xl font-bold">2,500+</h3>
                <p className="mt-2 text-white/80">Waste Reports</p>
              </div>
              <div className="p-4 rounded-lg backdrop-blur-sm bg-white/5 hover:bg-white/10 transition-colors">
                <h3 className="text-4xl font-bold">85%</h3>
                <p className="mt-2 text-white/80">Collection Rate</p>
              </div>
              <div className="p-4 rounded-lg backdrop-blur-sm bg-white/5 hover:bg-white/10 transition-colors">
                <h3 className="text-4xl font-bold">1,200+</h3>
                <p className="mt-2 text-white/80">Active Users</p>
              </div>
              <div className="p-4 rounded-lg backdrop-blur-sm bg-white/5 hover:bg-white/10 transition-colors">
                <h3 className="text-4xl font-bold">30%</h3>
                <p className="mt-2 text-white/80">Recycling Increase</p>
              </div>
            </div>
          </div>

          {/* Wave decoration */}
          <div className="absolute bottom-0 left-0 w-full h-8 bg-wave-pattern opacity-20"></div>
        </section>

        {/* CTA Section */}
        <section className="py-16">
          <div className="container">
            <div className="bg-card border rounded-lg p-8 md:p-12 shadow-sm relative overflow-hidden leaf-decoration">
              <div className="max-w-3xl mx-auto text-center space-y-6 relative z-10">
                <h2 className="text-3xl font-bold tracking-tight text-nature-700 dark:text-nature-400">
                  Join the Niramay Movement
                </h2>
                <p className="text-lg text-muted-foreground">
                  Be part of the solution. Report waste, earn rewards, and help
                  create cleaner, more sustainable communities.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                  <Button
                    asChild
                    size="lg"
                    className="gap-2 bg-nature-600 hover:bg-nature-700 transition-colors"
                  >
                    <Link to="/report">
                      Report Waste <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="border-nature-200 hover:border-nature-300 dark:border-nature-800 dark:hover:border-nature-700"
                  >
                    <Link to="/leaderboard">View Leaderboard</Link>
                  </Button>
                </div>
              </div>

              {/* Background pattern */}
              <div className="absolute inset-0 bg-leaf-pattern opacity-5"></div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
