import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Medal, Gift, ArrowRight, Star, Award } from "lucide-react";

// Mock data for leaderboard
const mockUsers = [
  {
    id: 1,
    name: "Alex Johnson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    points: 1250,
    reports: 42,
    recycling: 85,
    badges: ["Eco Warrior", "Cleanup Champion", "Recycling Expert"],
    level: 5,
  },
  {
    id: 2,
    name: "Sam Rodriguez",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sam",
    points: 980,
    reports: 36,
    recycling: 72,
    badges: ["Eco Warrior", "Cleanup Champion"],
    level: 4,
  },
  {
    id: 3,
    name: "Taylor Kim",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Taylor",
    points: 840,
    reports: 29,
    recycling: 68,
    badges: ["Eco Warrior"],
    level: 3,
  },
  {
    id: 4,
    name: "Jordan Patel",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan",
    points: 720,
    reports: 24,
    recycling: 60,
    badges: ["Cleanup Champion"],
    level: 3,
  },
  {
    id: 5,
    name: "Casey Martinez",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Casey",
    points: 650,
    reports: 20,
    recycling: 55,
    badges: [],
    level: 2,
  },
  {
    id: 6,
    name: "Riley Thompson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Riley",
    points: 580,
    reports: 18,
    recycling: 50,
    badges: [],
    level: 2,
  },
  {
    id: 7,
    name: "Morgan Wilson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Morgan",
    points: 520,
    reports: 15,
    recycling: 45,
    badges: [],
    level: 2,
  },
  {
    id: 8,
    name: "Jamie Garcia",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jamie",
    points: 450,
    reports: 12,
    recycling: 40,
    badges: [],
    level: 1,
  },
  {
    id: 9,
    name: "Quinn Lee",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Quinn",
    points: 380,
    reports: 10,
    recycling: 35,
    badges: [],
    level: 1,
  },
  {
    id: 10,
    name: "Avery Smith",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Avery",
    points: 320,
    reports: 8,
    recycling: 30,
    badges: [],
    level: 1,
  },
];

// Mock rewards data
const mockRewards = [
  {
    id: 1,
    name: "10% Discount at EcoStore",
    points: 500,
    image:
      "https://images.unsplash.com/photo-1572454591674-2739f30a2b2f?w=300&q=80",
    description:
      "Get 10% off your next purchase at EcoStore, valid for 3 months.",
  },
  {
    id: 2,
    name: "Free Reusable Water Bottle",
    points: 750,
    image:
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=300&q=80",
    description:
      "Claim a high-quality stainless steel water bottle to reduce plastic waste.",
  },
  {
    id: 3,
    name: "Community Garden Membership",
    points: 1000,
    image:
      "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=300&q=80",
    description: "One month free membership to your local community garden.",
  },
  {
    id: 4,
    name: "Eco-Friendly Home Kit",
    points: 1500,
    image:
      "https://images.unsplash.com/photo-1545127398-14699f92334b?w=300&q=80",
    description:
      "Kit includes biodegradable cleaning products and reusable household items.",
  },
  {
    id: 5,
    name: "Electric Scooter Rental",
    points: 2000,
    image:
      "https://images.unsplash.com/photo-1604868189265-219ba7ffc595?w=300&q=80",
    description: "Free 3-day rental of an electric scooter from GreenRide.",
  },
  {
    id: 6,
    name: "Tree Planting Certificate",
    points: 1200,
    image:
      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=300&q=80",
    description: "We'll plant a tree in your name and send you a certificate.",
  },
];

// Mock user profile (current user)
const currentUser = {
  id: 42,
  name: "You",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=You",
  points: 680,
  reports: 22,
  recycling: 58,
  badges: ["Eco Warrior"],
  level: 2,
  nextLevel: 800,
  rank: 5,
};

export default function LeaderboardPage() {
  const [timeframe, setTimeframe] = useState<string>("all-time");

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-1 py-8">
        <div className="container">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              Community Leaderboard
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Recognize top contributors who are making our community cleaner
              and more sustainable through active participation.
            </p>
          </div>

          {/* Top 3 Users */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Second Place */}
            <div className="order-2 md:order-1">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-4 border-silver">
                    <AvatarImage
                      src={mockUsers[1].avatar}
                      alt={mockUsers[1].name}
                    />
                    <AvatarFallback>
                      {mockUsers[1].name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-silver text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg">
                    2
                  </div>
                </div>
                <h3 className="mt-6 font-semibold text-lg">
                  {mockUsers[1].name}
                </h3>
                <p className="text-muted-foreground">
                  {mockUsers[1].points} points
                </p>
                <div className="mt-2 flex items-center gap-1">
                  <Medal className="h-4 w-4 text-silver" />
                  <span className="text-sm font-medium">Silver</span>
                </div>
              </div>
            </div>

            {/* First Place */}
            <div className="order-1 md:order-2">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <Avatar className="h-32 w-32 border-4 border-amber-400">
                    <AvatarImage
                      src={mockUsers[0].avatar}
                      alt={mockUsers[0].name}
                    />
                    <AvatarFallback>
                      {mockUsers[0].name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-400 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-xl">
                    1
                  </div>
                </div>
                <h3 className="mt-6 font-semibold text-xl">
                  {mockUsers[0].name}
                </h3>
                <p className="text-muted-foreground">
                  {mockUsers[0].points} points
                </p>
                <div className="mt-2 flex items-center gap-1">
                  <Trophy className="h-5 w-5 text-amber-400" />
                  <span className="text-sm font-medium">Gold</span>
                </div>
              </div>
            </div>

            {/* Third Place */}
            <div className="order-3">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-4 border-amber-700">
                    <AvatarImage
                      src={mockUsers[2].avatar}
                      alt={mockUsers[2].name}
                    />
                    <AvatarFallback>
                      {mockUsers[2].name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-700 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg">
                    3
                  </div>
                </div>
                <h3 className="mt-6 font-semibold text-lg">
                  {mockUsers[2].name}
                </h3>
                <p className="text-muted-foreground">
                  {mockUsers[2].points} points
                </p>
                <div className="mt-2 flex items-center gap-1">
                  <Medal className="h-4 w-4 text-amber-700" />
                  <span className="text-sm font-medium">Bronze</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Leaderboard Rankings */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Leaderboard Rankings</CardTitle>
                    <Tabs
                      value={timeframe}
                      onValueChange={setTimeframe}
                      className="w-[400px]"
                    >
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="weekly">Weekly</TabsTrigger>
                        <TabsTrigger value="monthly">Monthly</TabsTrigger>
                        <TabsTrigger value="all-time">All Time</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  <CardDescription>
                    Users ranked by points earned from waste reporting and
                    recycling activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockUsers.map((user, index) => (
                      <div
                        key={user.id}
                        className={`flex items-center justify-between p-3 rounded-lg ${index < 3 ? "bg-muted" : ""} ${user.id === currentUser.id ? "border border-primary" : ""}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-6 text-center font-medium">
                            {index + 1}
                          </div>
                          <Avatar>
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback>
                              {user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Level {user.level}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="font-medium">{user.points}</div>
                            <div className="text-sm text-muted-foreground">
                              Points
                            </div>
                          </div>

                          <div className="text-right hidden md:block">
                            <div className="font-medium">{user.reports}</div>
                            <div className="text-sm text-muted-foreground">
                              Reports
                            </div>
                          </div>

                          <div className="text-right hidden md:block">
                            <div className="font-medium">{user.recycling}%</div>
                            <div className="text-sm text-muted-foreground">
                              Recycling
                            </div>
                          </div>

                          {user.badges.length > 0 && (
                            <div className="hidden lg:flex gap-1">
                              {user.badges.map((badge, i) => (
                                <Badge
                                  key={i}
                                  variant="outline"
                                  className="flex items-center gap-1"
                                >
                                  <Star className="h-3 w-3" />
                                  {badge}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Your Profile & Rewards */}
            <div className="space-y-8">
              {/* Your Profile */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Profile</CardTitle>
                  <CardDescription>
                    Your current stats and progress
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage
                        src={currentUser.avatar}
                        alt={currentUser.name}
                      />
                      <AvatarFallback>
                        {currentUser.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {currentUser.name}
                      </h3>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span>Rank #{currentUser.rank}</span>
                        <span>•</span>
                        <span>Level {currentUser.level}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress to Level {currentUser.level + 1}</span>
                      <span>
                        {currentUser.points} / {currentUser.nextLevel}
                      </span>
                    </div>
                    <Progress
                      value={(currentUser.points / currentUser.nextLevel) * 100}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="text-2xl font-bold">
                        {currentUser.points}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Points
                      </div>
                    </div>
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="text-2xl font-bold">
                        {currentUser.reports}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Reports
                      </div>
                    </div>
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="text-2xl font-bold">
                        {currentUser.recycling}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Recycling
                      </div>
                    </div>
                  </div>

                  {currentUser.badges.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Your Badges</h4>
                      <div className="flex flex-wrap gap-2">
                        {currentUser.badges.map((badge, i) => (
                          <Badge key={i} className="flex items-center gap-1">
                            <Award className="h-3 w-3" />
                            {badge}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Rewards */}
              <Card>
                <CardHeader>
                  <CardTitle>Available Rewards</CardTitle>
                  <CardDescription>
                    Redeem your points for eco-friendly rewards
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockRewards.slice(0, 3).map((reward) => (
                      <div key={reward.id} className="flex gap-4 items-center">
                        <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                          <img
                            src={reward.image}
                            alt={reward.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm">{reward.name}</h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {reward.description}
                          </p>
                          <div className="mt-1 flex items-center gap-1 text-xs">
                            <Gift className="h-3 w-3" />
                            <span>{reward.points} points</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={
                            currentUser.points >= reward.points
                              ? "default"
                              : "outline"
                          }
                          disabled={currentUser.points < reward.points}
                        >
                          Redeem
                        </Button>
                      </div>
                    ))}

                    <Button variant="outline" className="w-full mt-2" asChild>
                      <a href="#">
                        View All Rewards <ArrowRight className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
