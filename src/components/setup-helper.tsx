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
      // First check if we have the necessary permissions to run SQL
      const { error: permissionCheckError } = await supabase.rpc("exec_sql", {
        sql: "SELECT current_user;",
      });

      if (permissionCheckError) {
        console.error("Permission error:", permissionCheckError);
        setStatus("error");
        setMessage(
          `You don't have permission to run SQL commands. Please use the migration file instead.`,
        );
        setIsLoading(false);
        return;
      }

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
        .select("count");

      if (profilesError) {
        console.error("Error verifying tables:", profilesError);
        setStatus("error");
        setMessage(
          "Database setup completed with errors. Some tables may not have been created properly.",
        );
      } else {
        setStatus("success");
        setMessage("Database setup completed successfully!");
      }
    } catch (err) {
      console.error("Setup script error:", err);
      setStatus("error");
      setMessage(`Error setting up database: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Alert variant={status === "error" ? "destructive" : "default"}>
        <Database className="h-4 w-4" />
        <AlertTitle>
          {status === "idle" && "Database Setup"}
          {status === "loading" && "Setting up database..."}
          {status === "success" && "Setup Complete"}
          {status === "error" && "Setup Error"}
        </AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>

      <Button
        onClick={runSetupScript}
        disabled={isLoading || status === "loading"}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Setting up database...
          </>
        ) : status === "success" ? (
          <>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Database Ready
          </>
        ) : status === "error" ? (
          <>
            <AlertTriangle className="mr-2 h-4 w-4" />
            Retry Setup
          </>
        ) : (
          <>Initialize Database</>
        )}
      </Button>
    </div>
  );
}
