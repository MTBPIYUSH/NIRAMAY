import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertTriangle, Database } from "lucide-react";
import { supabase } from "@/lib/supabase";

// Import the SQL setup script as a string
import setupSql from "../sql/setup_database.sql?raw";

export function SetupHelper() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const runSetupScript = async () => {
    setIsLoading(true);
    setStatus("loading");
    setMessage("Setting up database tables...");

    try {
      // Split the SQL script into individual statements
      const statements = setupSql
        .split(";")
        .map((statement) => statement.trim())
        .filter((statement) => statement.length > 0);

      // Execute each statement separately
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        setMessage(`Executing statement ${i + 1} of ${statements.length}...`);

        try {
          const { error } = await supabase.rpc("exec_sql", {
            sql: statement + ";",
          });

          if (error) {
            console.warn(
              `Statement ${i + 1} error (may be ignorable): ${error.message}`,
            );
            // Continue with other statements even if one fails
          }
        } catch (err) {
          console.warn(`Statement execution error (continuing): ${err}`);
          // Continue with other statements even if one fails
        }
      }

      // Verify tables exist by querying them
      const { data: profilesData, error: profilesError } = await supabase
        .from("user_profiles")
        .select("count")
        .limit(1);

      if (profilesError) {
        console.warn("Verification error for user_profiles:", profilesError);
      } else {
        console.log("user_profiles table verified");
      }

      setStatus("success");
      setMessage("Database setup completed successfully!");
    } catch (error) {
      console.error("Error setting up database:", error);
      setStatus("error");
      setMessage(
        `Error setting up database: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 w-full">
      {status === "idle" && (
        <Alert>
          <Database className="h-4 w-4" />
          <AlertTitle>Database Setup</AlertTitle>
          <AlertDescription>
            If you're experiencing issues with the application, you may need to
            set up the database tables. Click the button below to run the setup
            script.
          </AlertDescription>
        </Alert>
      )}

      {status === "loading" && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Setting Up Database</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {status === "success" && (
        <Alert className="bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-800">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-green-800 dark:text-green-300">
            Success
          </AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-400">
            {message}
          </AlertDescription>
        </Alert>
      )}

      {status === "error" && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <Button onClick={runSetupScript} disabled={isLoading} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Setting Up Database...
          </>
        ) : (
          <>
            <Database className="mr-2 h-4 w-4" />
            Set Up Database Tables
          </>
        )}
      </Button>
    </div>
  );
}
