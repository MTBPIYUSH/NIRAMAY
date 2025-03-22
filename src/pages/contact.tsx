import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  MessageSquare,
  Send,
  Recycle,
  Trash2,
  AlertTriangle,
  Info,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function ContactPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Message Sent",
        description: "Thank you for your message. We'll get back to you soon!",
        variant: "default",
      });
      setIsSubmitting(false);

      // Reset form
      const form = e.target as HTMLFormElement;
      form.reset();
    }, 1500);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="container">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              Contact & Awareness
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Learn about proper waste management and get in touch with our team
              for any questions or support.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Get in Touch
                </CardTitle>
                <CardDescription>
                  Have questions or feedback? Send us a message and we'll
                  respond as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first-name">First Name</Label>
                      <Input
                        id="first-name"
                        placeholder="Enter your first name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last-name">Last Name</Label>
                      <Input
                        id="last-name"
                        placeholder="Enter your last name"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="What is your message about?"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Type your message here"
                      rows={5}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="mr-2">Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" /> Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Chatbot & Info */}
            <div className="space-y-8">
              {/* Chatbot */}
              <Card>
                <CardHeader>
                  <CardTitle>Waste Management Assistant</CardTitle>
                  <CardDescription>
                    Get instant answers to your waste management questions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg h-[300px] flex flex-col">
                    <div className="flex-1 p-4 overflow-y-auto space-y-4">
                      <div className="flex items-start gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                          SW
                        </div>
                        <div className="bg-muted p-3 rounded-lg rounded-tl-none max-w-[80%]">
                          <p className="text-sm">
                            Hello! I'm your SmartWaste assistant. How can I help
                            you with waste management today?
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 justify-end">
                        <div className="bg-primary p-3 rounded-lg rounded-tr-none max-w-[80%]">
                          <p className="text-sm text-primary-foreground">
                            How do I properly dispose of batteries?
                          </p>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-semibold text-sm">
                          You
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                          SW
                        </div>
                        <div className="bg-muted p-3 rounded-lg rounded-tl-none max-w-[80%]">
                          <p className="text-sm">
                            Batteries should never be thrown in regular trash as
                            they contain hazardous materials. You should:
                          </p>
                          <ul className="text-sm list-disc pl-5 mt-2 space-y-1">
                            <li>
                              Take them to a designated battery recycling point
                            </li>
                            <li>
                              Many electronics stores offer battery collection
                            </li>
                            <li>
                              Check your local waste management facility for
                              hazardous waste drop-off
                            </li>
                          </ul>
                          <p className="text-sm mt-2">
                            Would you like to know where the nearest battery
                            recycling point is in your area?
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t p-3 flex gap-2">
                      <Input placeholder="Type your question here..." />
                      <Button size="icon">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Information</CardTitle>
                  <CardDescription>
                    Important contacts and resources
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Info className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">Customer Support</h4>
                      <p className="text-sm text-muted-foreground">
                        support@smartwaste.com
                      </p>
                      <p className="text-sm text-muted-foreground">
                        +1 (555) 123-4567
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">Report Hazardous Waste</h4>
                      <p className="text-sm text-muted-foreground">
                        hazardous@smartwaste.com
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Emergency: +1 (555) 911-0000
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Recycle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">Recycling Information</h4>
                      <p className="text-sm text-muted-foreground">
                        recycling@smartwaste.com
                      </p>
                      <p className="text-sm text-muted-foreground">
                        +1 (555) 789-0123
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Educational Content */}
          <div className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold tracking-tight mb-2">
                Waste Management Education
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Learn about proper waste disposal techniques and how to reduce
                your environmental footprint.
              </p>
            </div>

            <Tabs defaultValue="general">
              <TabsList className="grid w-full md:w-[400px] mx-auto grid-cols-3 mb-8">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="recycling">Recycling</TabsTrigger>
                <TabsTrigger value="hazardous">Hazardous</TabsTrigger>
              </TabsList>

              <TabsContent value="general">
                <div className="grid md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">
                        Waste Reduction Tips
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <Trash2 className="h-4 w-4 mt-0.5 text-primary" />
                          <span>
                            Buy products with minimal packaging to reduce waste
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Trash2 className="h-4 w-4 mt-0.5 text-primary" />
                          <span>
                            Use reusable bags, bottles, and containers
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Trash2 className="h-4 w-4 mt-0.5 text-primary" />
                          <span>Compost food scraps and yard waste</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Trash2 className="h-4 w-4 mt-0.5 text-primary" />
                          <span>Repair items instead of replacing them</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Trash2 className="h-4 w-4 mt-0.5 text-primary" />
                          <span>
                            Donate usable items instead of throwing them away
                          </span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">
                        Waste Sorting Guide
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <div className="h-4 w-4 rounded-full bg-green-500 mt-0.5" />
                          <span>
                            <strong>Green Bin:</strong> Food waste, yard
                            trimmings, compostable items
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="h-4 w-4 rounded-full bg-blue-500 mt-0.5" />
                          <span>
                            <strong>Blue Bin:</strong> Paper, cardboard, glass,
                            metal, plastic containers
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="h-4 w-4 rounded-full bg-black mt-0.5" />
                          <span>
                            <strong>Black Bin:</strong> Non-recyclable and
                            non-compostable waste
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="h-4 w-4 rounded-full bg-red-500 mt-0.5" />
                          <span>
                            <strong>Red Bin:</strong> Hazardous waste
                            (batteries, chemicals)
                          </span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">
                        Environmental Impact
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 text-sm">
                        <p>
                          Improper waste disposal can lead to pollution of land,
                          water, and air, affecting both human health and
                          wildlife.
                        </p>
                        <p>
                          Landfills produce methane, a greenhouse gas 25 times
                          more potent than CO2, contributing to climate change.
                        </p>
                        <p>
                          Recycling one ton of paper saves 17 trees, 7,000
                          gallons of water, and 3 cubic yards of landfill space.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="recycling">
                <Card>
                  <CardHeader>
                    <CardTitle>Recycling Guidelines</CardTitle>
                    <CardDescription>
                      Learn how to properly recycle different materials
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="item-1">
                        <AccordionTrigger>Paper & Cardboard</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2">
                            <p className="text-sm">
                              Paper and cardboard are highly recyclable
                              materials. Here's how to prepare them:
                            </p>
                            <ul className="list-disc pl-5 text-sm space-y-1">
                              <li>
                                Remove any plastic wrapping, tape, or non-paper
                                materials
                              </li>
                              <li>Flatten cardboard boxes to save space</li>
                              <li>Keep paper dry and clean</li>
                              <li>
                                Shredded paper should be contained in a paper
                                bag
                              </li>
                            </ul>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-2">
                        <AccordionTrigger>Plastics</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2">
                            <p className="text-sm">
                              Not all plastics are recyclable. Check for these
                              recycling codes:
                            </p>
                            <ul className="list-disc pl-5 text-sm space-y-1">
                              <li>#1 (PET) - Water bottles, soda bottles</li>
                              <li>#2 (HDPE) - Milk jugs, detergent bottles</li>
                              <li>#5 (PP) - Yogurt containers, bottle caps</li>
                              <li>Rinse containers and remove lids</li>
                              <li>
                                No plastic bags, wraps, or films in regular
                                recycling
                              </li>
                            </ul>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-3">
                        <AccordionTrigger>Glass & Metal</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2">
                            <p className="text-sm">
                              Glass and metal are infinitely recyclable:
                            </p>
                            <ul className="list-disc pl-5 text-sm space-y-1">
                              <li>Rinse containers to remove food residue</li>
                              <li>Labels can remain on glass jars</li>
                              <li>Metal lids can be recycled separately</li>
                              <li>
                                Aluminum foil should be clean and balled up
                              </li>
                              <li>No broken glass, mirrors, or window glass</li>
                            </ul>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="hazardous">
                <Card>
                  <CardHeader>
                    <CardTitle>Hazardous Waste Disposal</CardTitle>
                    <CardDescription>
                      Special handling required for these dangerous materials
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-4 rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-amber-800 dark:text-amber-300">
                              Important Safety Notice
                            </h4>
                            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                              Never mix different hazardous materials together.
                              Keep them in their original containers whenever
                              possible. Store away from children and pets until
                              proper disposal.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">
                            Common Hazardous Materials
                          </h4>
                          <ul className="list-disc pl-5 text-sm space-y-1">
                            <li>
                              Batteries (especially lithium and car batteries)
                            </li>
                            <li>Paint, varnish, and solvents</li>
                            <li>Pesticides and fertilizers</li>
                            <li>Motor oil and automotive fluids</li>
                            <li>Cleaning products and chemicals</li>
                            <li>Fluorescent light bulbs (contain mercury)</li>
                            <li>Electronics and appliances</li>
                            <li>Medical waste and medications</li>
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Disposal Options</h4>
                          <ul className="list-disc pl-5 text-sm space-y-1">
                            <li>Community hazardous waste collection events</li>
                            <li>Permanent hazardous waste facilities</li>
                            <li>
                              Retailer take-back programs (electronics,
                              batteries)
                            </li>
                            <li>Pharmacy take-back for medications</li>
                            <li>
                              Auto parts stores often accept used motor oil
                            </li>
                            <li>Paint recycling programs for unused paint</li>
                          </ul>
                        </div>
                      </div>

                      <Button variant="outline" className="w-full">
                        Find Hazardous Waste Disposal Near You
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* FAQ Section */}
          <div className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold tracking-tight mb-2">
                Frequently Asked Questions
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Common questions about waste management and our services
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="faq-1">
                  <AccordionTrigger>
                    How does the AI waste classification work?
                  </AccordionTrigger>
                  <AccordionContent>
                    Our AI waste classification system uses computer vision
                    technology to analyze images of waste items. When you upload
                    a photo of waste through our app, the AI identifies the type
                    of material and categorizes it as recyclable, biodegradable,
                    hazardous, or e-waste. This helps users properly sort their
                    waste and contributes to more efficient recycling processes.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-2">
                  <AccordionTrigger>
                    What happens after I report waste?
                  </AccordionTrigger>
                  <AccordionContent>
                    After you report waste through our platform, the information
                    is sent to local waste management authorities. They
                    prioritize collection based on waste type, volume, and
                    location. You'll receive notifications about the status of
                    your report, including when the waste is scheduled for
                    collection and when it has been collected. This data also
                    helps optimize collection routes and resource allocation.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-3">
                  <AccordionTrigger>
                    How do I earn points on the leaderboard?
                  </AccordionTrigger>
                  <AccordionContent>
                    You earn points through various activities on our platform:
                    reporting waste (10-50 points depending on accuracy and
                    detail), confirming waste collection (5 points),
                    participating in community cleanup events (100 points),
                    completing educational quizzes (20 points), and referring
                    new users (50 points per user). Points accumulate to
                    increase your level and ranking on the community
                    leaderboard, and can be redeemed for rewards from our
                    eco-friendly partners.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-4">
                  <AccordionTrigger>
                    Can businesses use SmartWaste?
                  </AccordionTrigger>
                  <AccordionContent>
                    Yes, we offer specialized solutions for businesses through
                    our SmartWaste Business program. This includes waste audits,
                    customized recycling programs, employee education, and
                    detailed waste analytics. Businesses can track their waste
                    reduction progress, demonstrate environmental compliance,
                    and showcase their sustainability efforts. Contact our
                    business team at business@smartwaste.com for more
                    information.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-5">
                  <AccordionTrigger>
                    Is my personal information secure?
                  </AccordionTrigger>
                  <AccordionContent>
                    We take data security very seriously. All personal
                    information is encrypted and stored securely following
                    industry best practices. We only collect information
                    necessary for the functioning of our services, and we never
                    sell your data to third parties. You can review our complete
                    privacy policy for detailed information about how we handle
                    your data and your rights as a user.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
