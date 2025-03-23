import { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SetupHelper } from "@/components/setup-helper";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  MapPin,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Truck,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/auth-provider";
import { WasteReport } from "@/types/database";

type StatusType = "Pending" | "In Progress" | "Collected";

// Helper functions for styling
const getTypeBadgeVariant = (type: string) => {
  switch (type) {
    case "Recyclable":
      return "outline";
    case "Biodegradable":
      return "secondary";
    case "Hazardous":
      return "destructive";
    case "E-Waste":
      return "default";
    default:
      return "outline";
  }
};

const getStatusColor = (status: StatusType) => {
  switch (status) {
    case "Pending":
      return "bg-amber-500";
    case "In Progress":
      return "bg-blue-500";
    case "Collected":
      return "bg-green-500";
    default:
      return "bg-gray-500";
  }
};

const getStatusIcon = (status: StatusType) => {
  switch (status) {
    case "Pending":
      return <Clock className="h-3 w-3" />;
    case "In Progress":
      return <Truck className="h-3 w-3" />;
    case "Collected":
      return <CheckCircle2 className="h-3 w-3" />;
    default:
      return null;
  }
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    collected: 0,
    percentChange: {
      total: 0,
      pending: 0,
      inProgress: 0,
      collected: 0,
    },
  });

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        if (!user) {
          setReports([]);
          setStats({
            total: 0,
            pending: 0,
            inProgress: 0,
            collected: 0,
            percentChange: {
              total: 0,
              pending: 0,
              inProgress: 0,
              collected: 0,
            },
          });
          setLoading(false);
          return;
        }

        console.log("Fetching reports for user:", user.id);

        // Check if the waste_reports table exists
        const { error: tableCheckError } = await supabase
          .from("waste_reports")
          .select("id")
          .limit(1);

        if (tableCheckError) {
          console.error("Error checking waste_reports table:", tableCheckError);
          // Create sample data if table doesn't exist or is empty
          const sampleReports = generateSampleReports(user.id);
          setReports(sampleReports);

          // Calculate stats from sample data
          const pending = sampleReports.filter(
            (r) => r.status === "Pending",
          ).length;
          const inProgress = sampleReports.filter(
            (r) => r.status === "In Progress",
          ).length;
          const collected = sampleReports.filter(
            (r) => r.status === "Collected",
          ).length;

          setStats({
            total: sampleReports.length,
            pending,
            inProgress,
            collected,
            percentChange: {
              total: 12,
              pending: -5,
              inProgress: 8,
              collected: 15,
            },
          });

          setLoading(false);
          return;
        }

        // Fetch all reports for the current user
        const { data, error } = await supabase
          .from("waste_reports")
          .select("*")
          .eq("user_id", user.id)
          .order("reported_at", { ascending: false });

        console.log("Fetched reports:", data, "Error:", error);

        if (error) throw error;

        // If no reports found, create sample data
        if (!data || data.length === 0) {
          console.log("No reports found, using sample data");
          const sampleReports = generateSampleReports(user.id);
          setReports(sampleReports);

          // Calculate stats from sample data
          const pending = sampleReports.filter(
            (r) => r.status === "Pending",
          ).length;
          const inProgress = sampleReports.filter(
            (r) => r.status === "In Progress",
          ).length;
          const collected = sampleReports.filter(
            (r) => r.status === "Collected",
          ).length;

          setStats({
            total: sampleReports.length,
            pending,
            inProgress,
            collected,
            percentChange: {
              total: 12,
              pending: -5,
              inProgress: 8,
              collected: 15,
            },
          });
        } else {
          // Calculate stats from real data
          const reportsData = (data as WasteReport[]) || [];
          const pending = reportsData.filter(
            (r) => r.status === "Pending",
          ).length;
          const inProgress = reportsData.filter(
            (r) => r.status === "In Progress",
          ).length;
          const collected = reportsData.filter(
            (r) => r.status === "Collected",
          ).length;

          setReports(reportsData);
          setStats({
            total: reportsData.length,
            pending,
            inProgress,
            collected,
            percentChange: {
              total: 0, // In a real app, you would calculate this based on historical data
              pending: -5,
              inProgress: 8,
              collected: 15,
            },
          });
        }
      } catch (error) {
        console.error("Error fetching reports:", error);
        // Fallback to sample data on error
        const sampleReports = generateSampleReports(user.id);
        setReports(sampleReports);

        // Calculate stats from sample data
        const pending = sampleReports.filter(
          (r) => r.status === "Pending",
        ).length;
        const inProgress = sampleReports.filter(
          (r) => r.status === "In Progress",
        ).length;
        const collected = sampleReports.filter(
          (r) => r.status === "Collected",
        ).length;

        setStats({
          total: sampleReports.length,
          pending,
          inProgress,
          collected,
          percentChange: {
            total: 12,
            pending: -5,
            inProgress: 8,
            collected: 15,
          },
        });
      } finally {
        setLoading(false);
      }
    };

    // Function to generate sample reports for demo purposes
    const generateSampleReports = (userId: string): WasteReport[] => {
      const statuses: ("Pending" | "In Progress" | "Collected")[] = [
        "Pending",
        "In Progress",
        "Collected",
      ];
      const types: (
        | "Recyclable"
        | "Biodegradable"
        | "Hazardous"
        | "E-Waste"
      )[] = ["Recyclable", "Biodegradable", "Hazardous", "E-Waste"];
      const locations = [
        {
          latitude: 40.7128,
          longitude: -74.006,
          formatted_address: "New York, NY, USA",
        },
        {
          latitude: 34.0522,
          longitude: -118.2437,
          formatted_address: "Los Angeles, CA, USA",
        },
        {
          latitude: 41.8781,
          longitude: -87.6298,
          formatted_address: "Chicago, IL, USA",
        },
        {
          latitude: 29.7604,
          longitude: -95.3698,
          formatted_address: "Houston, TX, USA",
        },
      ];
      const descriptions = [
        "Large pile of plastic bottles and containers",
        "Food waste and garden trimmings",
        "Old paint cans and household chemicals",
        "Broken electronics and old computer parts",
        "Mixed waste including paper, plastic, and metal",
      ];

      return Array.from({ length: 5 }, (_, i) => {
        const reportDate = new Date();
        reportDate.setDate(
          reportDate.getDate() - Math.floor(Math.random() * 30),
        );

        const type = types[Math.floor(Math.random() * types.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const location =
          locations[Math.floor(Math.random() * locations.length)];
        const description =
          descriptions[Math.floor(Math.random() * descriptions.length)];

        let collectedDate = null;
        if (status === "Collected") {
          collectedDate = new Date();
          collectedDate.setDate(
            reportDate.getDate() + Math.floor(Math.random() * 5) + 1,
          );
        }

        return {
          id: `WR-${1000 + i}`,
          user_id: userId,
          type,
          status,
          location,
          description,
          reported_at: reportDate.toISOString(),
          collected_at: collectedDate ? collectedDate.toISOString() : null,
          image_url: `https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=500&q=80&random=${i}`,
          urgent: type === "Hazardous",
        };
      });
    };

    if (user) {
      fetchReports();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    console.log("Search query updated:", e.target.value);
  };

  // Filter reports based on search query and filters
  const filteredReports = reports.filter((report) => {
    // Search filter
    const locationStr =
      typeof report.location === "string"
        ? report.location
        : report.location?.formatted_address || "";

    const matchesSearch =
      searchQuery === "" ||
      report.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      locationStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesStatus =
      statusFilter === "all" || report.status === statusFilter;

    // Type filter
    const matchesType = typeFilter === "all" || report.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">
                Waste Management Dashboard
              </h1>
              <p className="text-muted-foreground">
                Monitor and manage waste reports across the community
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" className="gap-2">
                <BarChart className="h-4 w-4" /> Analytics
              </Button>
              <Button className="gap-2 bg-nature-600 hover:bg-nature-700 transition-colors">
                <MapPin className="h-4 w-4" /> View Map
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.percentChange.total > 0 ? "+" : ""}
                  {stats.percentChange.total}% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Collection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pending}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.percentChange.pending > 0 ? "+" : ""}
                  {stats.percentChange.pending}% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  In Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.inProgress}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.percentChange.inProgress > 0 ? "+" : ""}
                  {stats.percentChange.inProgress}% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Collected</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.collected}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.percentChange.collected > 0 ? "+" : ""}
                  {stats.percentChange.collected}% from last month
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports by ID, location, or description..."
                className="pl-8"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>

            <div className="flex gap-2">
              <div className="w-[180px]">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <SelectValue placeholder="Status" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Collected">Collected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-[180px]">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <SelectValue placeholder="Type" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Recyclable">Recyclable</SelectItem>
                    <SelectItem value="Biodegradable">Biodegradable</SelectItem>
                    <SelectItem value="Hazardous">Hazardous</SelectItem>
                    <SelectItem value="E-Waste">E-Waste</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Tabs defaultValue="list" className="space-y-4">
            <TabsList>
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="map">Map View</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-4">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading reports...</span>
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {reports.length === 0
                      ? "No waste reports found. Start by reporting waste!"
                      : "No waste reports match your filters"}
                  </p>
                  {reports.length === 0 && (
                    <Button className="mt-4" asChild>
                      <a href="/report">Report Waste</a>
                    </Button>
                  )}
                </div>
              ) : (
                filteredReports.map((report) => (
                  <Card
                    key={report.id}
                    className={report.urgent ? "border-red-500" : ""}
                  >
                    <div className="md:flex">
                      <div className="md:w-1/4 h-48 md:h-auto relative">
                        <img
                          src={
                            report.image_url ||
                            "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=500&q=80"
                          }
                          alt={`Waste report ${report.id}`}
                          className="w-full h-full object-cover rounded-t-lg md:rounded-l-lg md:rounded-tr-none"
                        />
                        {report.urgent && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Urgent
                          </div>
                        )}
                      </div>

                      <div className="p-6 md:w-3/4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
                          <div>
                            <h3 className="text-lg font-semibold">
                              {report.id}
                            </h3>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span className="text-sm">
                                {typeof report.location === "string"
                                  ? report.location
                                  : report.location?.formatted_address ||
                                    "Unknown location"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge className={getTypeBadgeVariant(report.type)}>
                              {report.type}
                            </Badge>
                            <div className="flex items-center gap-1.5">
                              <div
                                className={`h-2 w-2 rounded-full ${getStatusColor(report.status as StatusType)}`}
                              />
                              <span className="text-sm font-medium flex items-center gap-1">
                                {getStatusIcon(report.status as StatusType)}
                                {report.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground mb-4">
                          {report.description}
                        </p>

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="text-sm text-muted-foreground">
                            Reported:{" "}
                            {new Date(report.reported_at).toLocaleString()}
                          </div>

                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                            {report.status !== "Collected" && (
                              <Button size="sm">
                                {report.status === "Pending"
                                  ? "Start Collection"
                                  : "Mark as Collected"}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="map">
              <Card>
                <CardHeader>
                  <CardTitle>Waste Report Map</CardTitle>
                  <CardDescription>
                    View all waste reports on the map for better geographical
                    context
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-md overflow-hidden aspect-video relative">
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                      <div className="text-center space-y-2">
                        <MapPin className="h-8 w-8 text-muted-foreground mx-auto" />
                        <p className="text-muted-foreground">
                          Map integration would be displayed here with markers
                          for each waste report
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <SetupHelper />
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
