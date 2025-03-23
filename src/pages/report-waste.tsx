import { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, MapPin, Check, AlertTriangle, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { classifyWasteImage, WasteClassification } from "@/lib/gemini";
import { GoogleMap } from "@/components/maps/google-map";
import { Location, getAddressFromCoordinates } from "@/lib/maps";
import { useAuth } from "@/components/auth/auth-provider";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function ReportWastePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [wasteType, setWasteType] = useState<WasteClassification | null>(null);
  const [aiClassification, setAiClassification] =
    useState<WasteClassification | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState({
    city: "",
    postalCode: "",
    streetAddress: "",
    landmark: "",
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to report waste",
        variant: "destructive",
      });
      navigate("/login", { state: { returnTo: "/report" } });
    }
  }, [user, navigate, toast]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image under 10MB",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = async () => {
        const imageData = reader.result as string;
        setImagePreview(imageData);

        // Classify with Gemini API
        setIsClassifying(true);
        try {
          const classification = await classifyWasteImage(imageData);
          setAiClassification(classification);
          setWasteType(classification);

          toast({
            title: "AI Classification Complete",
            description: `The waste has been classified as ${classification}`,
            duration: 5000,
          });
        } catch (error) {
          console.error("Classification error:", error);
          toast({
            title: "Classification Failed",
            description:
              "Could not classify the image. Please select waste type manually.",
            variant: "destructive",
          });
        } finally {
          setIsClassifying(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLocationSelect = async (location: Location) => {
    setSelectedLocation(location);

    // If address is provided in the location object, use it
    if (location.address) {
      // Try to parse the address components
      const addressParts = location.address
        .split(",")
        .map((part) => part.trim());

      if (addressParts.length >= 3) {
        setAddress({
          streetAddress: addressParts[0],
          city: addressParts[1],
          postalCode: addressParts[addressParts.length - 2],
          landmark: "",
        });
      }
    } else {
      // Get address from coordinates
      try {
        const formattedAddress = await getAddressFromCoordinates(
          location.lat,
          location.lng,
        );
        const addressParts = formattedAddress
          .split(",")
          .map((part) => part.trim());

        if (addressParts.length >= 3) {
          setAddress({
            streetAddress: addressParts[0],
            city: addressParts[1],
            postalCode: addressParts[addressParts.length - 2],
            landmark: "",
          });
        }
      } catch (error) {
        console.error("Error getting address:", error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to report waste",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    setIsSubmitting(true);

    try {
      // Format the location data
      let locationData = {};

      if (selectedLocation) {
        locationData = {
          latitude: selectedLocation.lat,
          longitude: selectedLocation.lng,
          formatted_address: selectedLocation.address,
        };
      } else {
        // Use manually entered address
        const formattedAddress = [
          address.streetAddress,
          address.city,
          address.postalCode,
          address.landmark,
        ]
          .filter(Boolean)
          .join(", ");

        locationData = {
          formatted_address: formattedAddress,
          city: address.city,
          postal_code: address.postalCode,
          street_address: address.streetAddress,
          landmark: address.landmark,
        };
      }

      // Create a unique report ID
      const reportId = `WR-${Math.floor(Math.random() * 10000)}`;

      // Save the report to Supabase
      const { error } = await supabase.from("waste_reports").insert({
        id: reportId,
        user_id: user.id,
        type: wasteType,
        description: description,
        location: locationData,
        image_url: imagePreview, // In a real app, you'd upload this to storage first
        status: "Pending",
        reported_at: new Date().toISOString(),
        urgent: wasteType === "Hazardous",
      });

      if (error) throw error;

      toast({
        title: "Report Submitted Successfully",
        description: `Thank you for your contribution! Your report ID is ${reportId}`,
        variant: "default",
      });

      // Reset form
      setImagePreview(null);
      setWasteType(null);
      setAiClassification(null);
      setSelectedLocation(null);
      setDescription("");
      setAddress({
        city: "",
        postalCode: "",
        streetAddress: "",
        landmark: "",
      });

      // Redirect to dashboard
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (error) {
      console.error("Error submitting report:", error);
      toast({
        title: "Submission Failed",
        description:
          "There was an error submitting your report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="container max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              Report Waste
            </h1>
            <p className="text-muted-foreground">
              Help keep our community clean by reporting waste that needs
              collection.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Waste Report Form</CardTitle>
              <CardDescription>
                Upload an image of the waste and provide details to help with
                collection.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="image">Upload Image</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center">
                    {imagePreview ? (
                      <div className="space-y-4 w-full">
                        <div className="relative aspect-video w-full max-w-md mx-auto overflow-hidden rounded-lg">
                          <img
                            src={imagePreview}
                            alt="Waste preview"
                            className="w-full h-full object-cover"
                          />
                          {isClassifying && (
                            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                              <div className="text-center space-y-2">
                                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                                <p className="text-sm font-medium">
                                  Analyzing image...
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex justify-center">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setImagePreview(null);
                              setAiClassification(null);
                            }}
                            disabled={isClassifying}
                          >
                            Remove Image
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-4">
                        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                          <Upload className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <div className="text-center space-y-2">
                          <p>Drag and drop an image or click to browse</p>
                          <p className="text-sm text-muted-foreground">
                            Supported formats: JPG, PNG, WEBP (max 10MB)
                          </p>
                        </div>
                        <Input
                          id="image"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() =>
                            document.getElementById("image")?.click()
                          }
                        >
                          Select Image
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {aiClassification && !isClassifying && (
                  <div className="bg-muted p-4 rounded-lg flex items-start gap-3">
                    <div className="mt-0.5">
                      <Check className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <h4 className="font-medium">AI Classification Result</h4>
                      <p className="text-sm text-muted-foreground">
                        Our AI has classified this waste as{" "}
                        <strong>{aiClassification}</strong>. You can change this
                        classification if needed.
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Waste Type</Label>
                  <RadioGroup
                    value={wasteType || ""}
                    onValueChange={setWasteType as any}
                    className="grid grid-cols-2 gap-4"
                    disabled={isClassifying}
                  >
                    <Label
                      htmlFor="biodegradable"
                      className={`flex flex-col items-center justify-between rounded-md border-2 p-4 cursor-pointer hover:bg-accent ${wasteType === "Biodegradable" ? "border-primary" : "border-muted"} ${isClassifying ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <RadioGroupItem
                        value="Biodegradable"
                        id="biodegradable"
                        className="sr-only"
                        disabled={isClassifying}
                      />
                      <span className="text-sm font-medium">Biodegradable</span>
                    </Label>
                    <Label
                      htmlFor="recyclable"
                      className={`flex flex-col items-center justify-between rounded-md border-2 p-4 cursor-pointer hover:bg-accent ${wasteType === "Recyclable" ? "border-primary" : "border-muted"} ${isClassifying ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <RadioGroupItem
                        value="Recyclable"
                        id="recyclable"
                        className="sr-only"
                        disabled={isClassifying}
                      />
                      <span className="text-sm font-medium">Recyclable</span>
                    </Label>
                    <Label
                      htmlFor="hazardous"
                      className={`flex flex-col items-center justify-between rounded-md border-2 p-4 cursor-pointer hover:bg-accent ${wasteType === "Hazardous" ? "border-primary" : "border-muted"} ${isClassifying ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <RadioGroupItem
                        value="Hazardous"
                        id="hazardous"
                        className="sr-only"
                        disabled={isClassifying}
                      />
                      <span className="text-sm font-medium">Hazardous</span>
                    </Label>
                    <Label
                      htmlFor="ewaste"
                      className={`flex flex-col items-center justify-between rounded-md border-2 p-4 cursor-pointer hover:bg-accent ${wasteType === "E-Waste" ? "border-primary" : "border-muted"} ${isClassifying ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <RadioGroupItem
                        value="E-Waste"
                        id="ewaste"
                        className="sr-only"
                        disabled={isClassifying}
                      />
                      <span className="text-sm font-medium">E-Waste</span>
                    </Label>
                  </RadioGroup>
                </div>

                <Tabs defaultValue="map">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="map">Map Location</TabsTrigger>
                    <TabsTrigger value="address">Manual Address</TabsTrigger>
                  </TabsList>
                  <TabsContent value="map" className="space-y-4">
                    <GoogleMap
                      height="400px"
                      onLocationSelect={handleLocationSelect}
                      initialLocation={selectedLocation || undefined}
                      markers={selectedLocation ? [selectedLocation] : []}
                    />
                    {selectedLocation && (
                      <div className="p-3 bg-muted rounded-md">
                        <p className="text-sm font-medium">
                          Selected Location:
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedLocation.address ||
                            `Lat: ${selectedLocation.lat.toFixed(6)}, Lng: ${selectedLocation.lng.toFixed(6)}`}
                        </p>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="address" className="space-y-4">
                    <div className="grid gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            placeholder="Enter city"
                            value={address.city}
                            onChange={(e) =>
                              setAddress({ ...address, city: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="postal-code">Postal Code</Label>
                          <Input
                            id="postal-code"
                            placeholder="Enter postal code"
                            value={address.postalCode}
                            onChange={(e) =>
                              setAddress({
                                ...address,
                                postalCode: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="street-address">Street Address</Label>
                        <Input
                          id="street-address"
                          placeholder="Enter street address"
                          value={address.streetAddress}
                          onChange={(e) =>
                            setAddress({
                              ...address,
                              streetAddress: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="landmark">Landmark (Optional)</Label>
                        <Input
                          id="landmark"
                          placeholder="Enter a nearby landmark"
                          value={address.landmark}
                          onChange={(e) =>
                            setAddress({ ...address, landmark: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    Additional Description (Optional)
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Provide any additional details about the waste or location that might help with collection"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="bg-muted p-4 rounded-lg flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Important Note</h4>
                    <p className="text-sm text-muted-foreground">
                      For hazardous waste, please ensure it's properly contained
                      and not accessible to children or animals.
                    </p>
                  </div>
                </div>

                <CardFooter className="px-0 pt-4">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={
                      !imagePreview ||
                      !wasteType ||
                      isSubmitting ||
                      isClassifying ||
                      (!selectedLocation &&
                        (!address.city || !address.streetAddress))
                    }
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                        Submitting...
                      </>
                    ) : (
                      "Submit Report"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
