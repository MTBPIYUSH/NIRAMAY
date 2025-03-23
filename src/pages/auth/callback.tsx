import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the URL hash and handle the auth callback
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Error during auth callback:", error);
          setError(error.message);
          return;
        }

        if (!data.session) {
          console.error("No session found during auth callback");
          setError("Authentication failed. Please try again.");
          return;
        }

        console.log("Auth callback successful, redirecting to dashboard");
        // Redirect to dashboard after successful authentication
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
      } catch (err: any) {
        console.error("Exception during auth callback:", err);
        setError(err.message || "An unexpected error occurred");
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen p-4">
      {error ? (
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4 text-center">
            <button
              onClick={() => navigate("/login")}
              className="text-primary hover:underline"
            >
              Return to login
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Completing authentication...</p>
        </>
      )}
    </div>
  );
}
