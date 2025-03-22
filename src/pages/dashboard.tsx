import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Filter,
  Search,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Loader2,
} from "lucide-react";

// Mock data for waste reports
const mockReports = [
  {
    id: "WR-1234",
    type: "Recyclable",
    location: "123 Main St, Downtown",
    reportedAt: "2023-06-15T10:30:00",
    status: "Collected",
    image:
      "https://images.unsplash.com/photo-1604187351574-c75ca79f5807?w=500&q=80",
    description: "Several cardboard boxes and plastic bottles",
    urgent: false,
  },
  {
    id: "WR-1235",
    type: "Biodegradable",
    location: "45 Park Avenue, Westside",
    reportedAt: "2023-06-16T14:20:00",
    status: "In Progress",
    image:
      "https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=500&q=80",
    description: "Food waste and garden trimmings",
    urgent: false,
  },
  {
    id: "WR-1236",
    type: "Hazardous",
    location: "78 Industrial Zone, Eastside",
    reportedAt: "2023-06-16T09:15:00",
    status: "Pending",
    image:
      "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=500&q=80",
    description: "Chemical containers and paint cans",
    urgent: true,
  },
  {
    id: "WR-1237",
    type: "E-Waste",
    location: "22 Tech Street, Northside",
    reportedAt: "2023-06-17T11:45:00",
    status: "Pending",
    image:
      "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=500&q=80",
    description: "Old computers and electronic devices",
    urgent: true,
  },
  {
    id: "WR-1238",
    type: "Recyclable",
    location: "90 Community Center, Southside",
    reportedAt: "2023-06-17T16:30:00",
    status: "In Progress",
    image:
      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=500&q=80",
    description: "Glass bottles and aluminum cans",
    urgent: false,
  },
];

type StatusType = "Pending" | "In Progress" | "Collected";

export default function DashboardPage() {
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

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
        return <Clock className="h-4 w-4" />;
      case "In Progress":
        return <Loader2 className="h-4 w-4" />;
      case "Collected":
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "Biodegradable":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "Recyclable":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "Hazardous":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "E-Waste":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      default:
        return "";
    }
  };

  const filteredReports = mockReports.filter((report) => {
    // Filter by type or status
    if (
      filter !== "all" &&
      filter !== report.type &&
      filter !== report.status
    ) {
      return false;
    }

    // Filter by search query
    if (
      searchQuery &&
      !(
        report.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    ) {
      return false;
    }

    return true;
  });

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-1 py-8">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Waste Management Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Monitor and manage waste reports across the city
              </p>
            </div>
            <Button asChild>
              <a href="/report">Report New Waste</a>
            </Button>
          </div>

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Stats Cards */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{mockReports.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  +12% from last month
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
                <div className="text-3xl font-bold">
                  {mockReports.filter((r) => r.status === "Pending").length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  2 urgent reports
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
                <div className="text-3xl font-bold">
                  {mockReports.filter((r) => r.status === "In Progress").length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Estimated completion: 24h
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Collected</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {mockReports.filter((r) => r.status === "Collected").length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">+3 today</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="list" className="mt-8">
            <TabsList className="grid w-full md:w-auto grid-cols-2">
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="map">Map View</TabsTrigger>
            </TabsList>

            <div className="flex flex-col md:flex-row gap-4 mt-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ID, location or description..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-[180px]">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <SelectValue placeholder="Filter" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Reports</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Collected">Collected</SelectItem>
                    <SelectItem value="Biodegradable">Biodegradable</SelectItem>
                    <SelectItem value="Recyclable">Recyclable</SelectItem>
                    <SelectItem value="Hazardous">Hazardous</SelectItem>
                    <SelectItem value="E-Waste">E-Waste</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <TabsContent value="list" className="space-y-4">
              {filteredReports.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No waste reports match your filters
                  </p>
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
                          src={report.image}
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
                              <span className="text-sm">{report.location}</span>
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
                            {new Date(report.reportedAt).toLocaleString()}
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
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
