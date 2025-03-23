import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Camera,
  Upload,
  MapPin,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/auth-provider";

export default function ReportWastePage() {
  const [location, setLocation] = useState("");
  const [wasteType, setWasteType] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      // Validate form data
      if (!location) {
        throw new Error("Location is required");
      }
      if (!wasteType) {
        throw new Error("Waste type is required");
      }
      if (!description) {
        throw new Error("Description is required");
      }

      console.log("Submitting waste report:", {
        location,
        wasteType,
        description,
        image,
      });

      // Get current user
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error("You must be logged in to submit a report");
      }

      // Generate a unique ID for the report
      const reportId = `WR-${Date.now().toString().slice(-6)}`;

      // Upload image if available
      let imageUrl = null;
      if (image) {
        const fileExt = image.name.split(".").pop();
        const filePath = `waste-reports/${reportId}/${Date.now()}.${fileExt}`;

        const { error: uploadError, data: uploadData } = await supabase.storage
          .from("waste-images")
          .upload(filePath, image);

        if (uploadError) {
          console.error("Image upload error:", uploadError);
          // Continue without image if upload fails
        } else if (uploadData) {
          const {
            data: { publicUrl },
          } = supabase.storage.from("waste-images").getPublicUrl(filePath);

          imageUrl = publicUrl;
        }
      }

      // Prepare location data
      let locationData = {};
      if (location.includes(",")) {
        // Assume it's coordinates
        const [lat, lng] = location
          .split(",")
          .map((coord) => parseFloat(coord.trim()));
        locationData = {
          latitude: lat,
          longitude: lng,
          formatted_address: location,
        };
      } else {
        // Assume it's an address
        locationData = {
          formatted_address: location,
        };
      }

      // Save report to database
      const { error: reportError } = await supabase
        .from("waste_reports")
        .insert({
          id: reportId,
          user_id: session.user.id,
          type: wasteType,
          status: "Pending",
          location: locationData,
          description: description,
          reported_at: new Date().toISOString(),
          image_url: imageUrl,
          urgent: wasteType === "hazardous",
        });

      if (reportError) {
        console.error("Error saving report:", reportError);
        throw new Error(`Failed to save report: ${reportError.message}`);
      }

      // Update user profile stats
      const { error: profileError } = await supabase
        .rpc("increment_user_reports", {
          user_id: session.user.id,
          points_to_add: 10,
        })
        .catch(() => {
          // If the RPC doesn't exist, update manually
          return supabase
            .from("user_profiles")
            .update({
              reports: supabase.rpc("increment", { value: 1 }),
              points: supabase.rpc("increment", { value: 10 }),
            })
            .eq("id", session.user.id);
        });

      if (profileError) {
        console.warn("Error updating user stats:", profileError);
        // Continue even if stats update fails
      }

      setSubmitSuccess(true);

      // Reset form after successful submission
      setTimeout(() => {
        setLocation("");
        setWasteType("");
        setDescription("");
        setImage(null);
        setPreview(null);
        setSubmitSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Report submission error:", error);
      setSubmitError(
        error instanceof Error ? error.message : "Failed to submit report",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation(`${latitude}, ${longitude}`);
        },
        (error) => {
          console.error("Error getting location:", error);
        },
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="container max-w-3xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              Report Waste
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Help keep our community clean by reporting waste that needs to be
              collected.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Waste Report Form</CardTitle>
              <CardDescription>
                Help keep our community clean by reporting waste that needs to
                be collected.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="flex gap-2">
                    <Input
                      id="location"
                      placeholder="Enter location or use current location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={getCurrentLocation}
                      className="flex gap-1 items-center"
                    >
                      <MapPin className="h-4 w-4" />
                      <span className="hidden sm:inline">Current</span>
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="waste-type">Waste Type</Label>
                  <Select
                    value={wasteType}
                    onValueChange={setWasteType}
                    required
                  >
                    <SelectTrigger id="waste-type">
                      <SelectValue placeholder="Select waste type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plastic">Plastic</SelectItem>
                      <SelectItem value="paper">Paper</SelectItem>
                      <SelectItem value="glass">Glass</SelectItem>
                      <SelectItem value="metal">Metal</SelectItem>
                      <SelectItem value="organic">Organic</SelectItem>
                      <SelectItem value="electronic">Electronic</SelectItem>
                      <SelectItem value="hazardous">Hazardous</SelectItem>
                      <SelectItem value="mixed">Mixed/Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the waste and any additional details"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image">Upload Image</Label>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <label
                        htmlFor="image-upload"
                        className="flex flex-col items-center cursor-pointer w-full h-full"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="h-8 w-8 text-gray-500 mb-2" />
                          <p className="text-sm text-gray-500">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            PNG, JPG, GIF up to 10MB
                          </p>
                        </div>
                        <input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {preview && (
                      <div className="relative border rounded-lg overflow-hidden h-[200px]">
                        <img
                          src={preview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setImage(null);
                            setPreview(null);
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                {submitError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{submitError}</AlertDescription>
                  </Alert>
                )}

                {submitSuccess && (
                  <Alert className="bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-800">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertDescription className="text-green-700 dark:text-green-400">
                      Report submitted successfully! Thank you for helping keep
                      our community clean.
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full bg-nature-600 hover:bg-nature-700 transition-colors"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Report"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
