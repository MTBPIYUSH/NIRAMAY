import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-1 py-16">
        <div className="container max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              Join SmartWaste
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Sign in to track your waste reports, earn rewards, and help create
              a cleaner environment
            </p>
          </div>

          <LoginForm />
        </div>
      </main>

      <Footer />
    </div>
  );
}
