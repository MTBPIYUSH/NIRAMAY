import { useState } from "react";
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
import { Upload, MapPin, Check, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function ReportWastePage() {
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [wasteType, setWasteType] = useState<string | null>(null);
  const [aiClassification, setAiClassification] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
        // Simulate AI classification
        setTimeout(() => {
          const types = ["Biodegradable", "Recyclable", "Hazardous", "E-Waste"];
          const randomType = types[Math.floor(Math.random() * types.length)];
          setAiClassification(randomType);
          setWasteType(randomType);

          toast({
            title: "AI Classification Complete",
            description: `The waste has been classified as ${randomType}`,
            duration: 5000,
          });
        }, 1500);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Report Submitted Successfully",
        description:
          "Thank you for your contribution to a cleaner environment!",
        variant: "default",
      });
      setIsSubmitting(false);
      setImagePreview(null);
      setWasteType(null);
      setAiClassification(null);

      // Reset form
      const form = e.target as HTMLFormElement;
      form.reset();
    }, 2000);
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
                        </div>
                        <div className="flex justify-center">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setImagePreview(null);
                              setAiClassification(null);
                            }}
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

                {aiClassification && (
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
                    onValueChange={setWasteType}
                    className="grid grid-cols-2 gap-4"
                  >
                    <Label
                      htmlFor="biodegradable"
                      className={`flex flex-col items-center justify-between rounded-md border-2 p-4 cursor-pointer hover:bg-accent ${wasteType === "Biodegradable" ? "border-primary" : "border-muted"}`}
                    >
                      <RadioGroupItem
                        value="Biodegradable"
                        id="biodegradable"
                        className="sr-only"
                      />
                      <span className="text-sm font-medium">Biodegradable</span>
                    </Label>
                    <Label
                      htmlFor="recyclable"
                      className={`flex flex-col items-center justify-between rounded-md border-2 p-4 cursor-pointer hover:bg-accent ${wasteType === "Recyclable" ? "border-primary" : "border-muted"}`}
                    >
                      <RadioGroupItem
                        value="Recyclable"
                        id="recyclable"
                        className="sr-only"
                      />
                      <span className="text-sm font-medium">Recyclable</span>
                    </Label>
                    <Label
                      htmlFor="hazardous"
                      className={`flex flex-col items-center justify-between rounded-md border-2 p-4 cursor-pointer hover:bg-accent ${wasteType === "Hazardous" ? "border-primary" : "border-muted"}`}
                    >
                      <RadioGroupItem
                        value="Hazardous"
                        id="hazardous"
                        className="sr-only"
                      />
                      <span className="text-sm font-medium">Hazardous</span>
                    </Label>
                    <Label
                      htmlFor="ewaste"
                      className={`flex flex-col items-center justify-between rounded-md border-2 p-4 cursor-pointer hover:bg-accent ${wasteType === "E-Waste" ? "border-primary" : "border-muted"}`}
                    >
                      <RadioGroupItem
                        value="E-Waste"
                        id="ewaste"
                        className="sr-only"
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
                    <div className="border rounded-md overflow-hidden aspect-video relative">
                      <div className="absolute inset-0 flex items-center justify-center bg-muted">
                        <div className="text-center space-y-2">
                          <MapPin className="h-8 w-8 text-muted-foreground mx-auto" />
                          <p className="text-sm text-muted-foreground">
                            Map integration would be here. Click on the map to
                            set the waste location.
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="address" className="space-y-4">
                    <div className="grid gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Input id="city" placeholder="Enter city" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="postal-code">Postal Code</Label>
                          <Input
                            id="postal-code"
                            placeholder="Enter postal code"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="street-address">Street Address</Label>
                        <Input
                          id="street-address"
                          placeholder="Enter street address"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="landmark">Landmark (Optional)</Label>
                        <Input
                          id="landmark"
                          placeholder="Enter a nearby landmark"
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
                    disabled={!imagePreview || !wasteType || isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Report"}
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
