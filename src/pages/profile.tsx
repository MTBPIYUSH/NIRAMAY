import { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  User,
  Settings,
  Award,
  Edit,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  Trophy,
  Trash2,
  Camera,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/auth-provider";
import { UserProfile, UserBadge } from "@/types/database";

export default function ProfilePage() {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState("");
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || "");
      setAvatarUrl(userProfile.avatar_url);
    }
  }, [userProfile]);

  useEffect(() => {
    const fetchBadges = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("user_badges")
          .select("*")
          .eq("user_id", user.id);

        if (error) throw error;

        if (data && data.length > 0) {
          setBadges(data as UserBadge[]);
        } else {
          // Create sample badges if none exist
          const sampleBadges = [
            {
              id: "badge-1",
              user_id: user.id,
              badge_name: "First Report",
              earned_at: new Date(
                Date.now() - 1000 * 60 * 60 * 24 * 30,
              ).toISOString(), // 30 days ago
            },
            {
              id: "badge-2",
              user_id: user.id,
              badge_name: "Recycling Champion",
              earned_at: new Date(
                Date.now() - 1000 * 60 * 60 * 24 * 15,
              ).toISOString(), // 15 days ago
            },
            {
              id: "badge-3",
              user_id: user.id,
              badge_name: "Community Hero",
              earned_at: new Date(
                Date.now() - 1000 * 60 * 60 * 24 * 5,
              ).toISOString(), // 5 days ago
            },
          ];
          setBadges(sampleBadges as UserBadge[]);
        }
      } catch (err) {
        console.error("Error fetching badges:", err);
        // Use sample badges as fallback
        const sampleBadges = [
          {
            id: "badge-1",
            user_id: user.id,
            badge_name: "First Report",
            earned_at: new Date(
              Date.now() - 1000 * 60 * 60 * 24 * 30,
            ).toISOString(),
          },
          {
            id: "badge-2",
            user_id: user.id,
            badge_name: "Recycling Champion",
            earned_at: new Date(
              Date.now() - 1000 * 60 * 60 * 24 * 15,
            ).toISOString(),
          },
        ];
        setBadges(sampleBadges as UserBadge[]);
      }
    };

    fetchBadges();
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Upload avatar if changed
      let newAvatarUrl = avatarUrl;
      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop();
        const filePath = `avatars/${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, avatarFile);

        if (uploadError) {
          throw uploadError;
        }

        const { data } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);
        newAvatarUrl = data.publicUrl;
      }

      // Update profile
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({
          name,
          avatar_url: newAvatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setSuccess("Profile updated successfully");
      setEditMode(false);
      refreshUserProfile();
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (!user || !userProfile) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Navbar />
        <main className="flex-1 py-12">
          <div className="container max-w-4xl">
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading profile...</span>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Calculate level progress
  const currentPoints = userProfile.points || 0;
  const nextLevelPoints = userProfile.next_level_points || 200;
  const prevLevelPoints = nextLevelPoints - 200; // Simplified calculation
  const progress = Math.min(
    100,
    Math.max(
      0,
      ((currentPoints - prevLevelPoints) /
        (nextLevelPoints - prevLevelPoints)) *
        100,
    ),
  );

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="container max-w-4xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">
                My Profile
              </h1>
              <p className="text-muted-foreground">
                Manage your account and view your achievements
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Profile</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <div className="relative mb-4">
                    {editMode ? (
                      <div className="relative">
                        <Avatar className="h-24 w-24">
                          <AvatarImage
                            src={avatarPreview || avatarUrl || undefined}
                            alt={name}
                          />
                          <AvatarFallback>
                            {name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <label
                          htmlFor="avatar-upload"
                          className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1 cursor-pointer"
                        >
                          <Camera className="h-4 w-4" />
                          <input
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarChange}
                          />
                        </label>
                      </div>
                    ) : (
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={avatarUrl || undefined} alt={name} />
                        <AvatarFallback>
                          {name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>

                  {editMode ? (
                    <div className="w-full space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Display Name</Label>
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSaveProfile}
                          className="flex-1"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditMode(false);
                            setName(userProfile.name || "");
                            setAvatarUrl(userProfile.avatar_url);
                            setAvatarFile(null);
                            setAvatarPreview(null);
                          }}
                          disabled={loading}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-xl font-semibold mt-2">{name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
                      <div className="mt-4 w-full">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setEditMode(true)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Profile
                        </Button>
                      </div>
                    </>
                  )}

                  {error && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert className="mt-4 bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-800">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <AlertDescription className="text-green-700 dark:text-green-400">
                        {success}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Level</span>
                        <span className="text-sm font-medium">
                          {userProfile.level}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={progress} className="h-2" />
                        <span className="text-xs text-muted-foreground">
                          {Math.round(progress)}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {currentPoints} / {nextLevelPoints} points to level{" "}
                        {(userProfile.level || 0) + 1}
                      </p>
                    </div>

                    <div className="flex justify-between py-2 border-t">
                      <span className="text-sm">Rank</span>
                      <span className="font-medium">{userProfile.rank}</span>
                    </div>

                    <div className="flex justify-between py-2 border-t">
                      <span className="text-sm">Points</span>
                      <span className="font-medium">{userProfile.points}</span>
                    </div>

                    <div className="flex justify-between py-2 border-t">
                      <span className="text-sm">Reports</span>
                      <span className="font-medium">{userProfile.reports}</span>
                    </div>

                    <div className="flex justify-between py-2 border-t">
                      <span className="text-sm">Recycling</span>
                      <span className="font-medium">
                        {userProfile.recycling}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-2">
              <Tabs defaultValue="badges">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="badges">
                    <Award className="h-4 w-4 mr-2" />
                    Badges
                  </TabsTrigger>
                  <TabsTrigger value="rewards">
                    <Trophy className="h-4 w-4 mr-2" />
                    Rewards
                  </TabsTrigger>
                  <TabsTrigger value="settings">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="badges" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>My Badges</CardTitle>
                      <CardDescription>
                        Achievements you've earned through your contributions
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {badges.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          You haven't earned any badges yet. Start reporting
                          waste to earn badges!
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {badges.map((badge) => (
                            <Card key={badge.id}>
                              <CardContent className="p-4 flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Award className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                  <h4 className="font-semibold">
                                    {badge.badge_name}
                                  </h4>
                                  <p className="text-xs text-muted-foreground">
                                    Earned on{" "}
                                    {new Date(
                                      badge.earned_at,
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="rewards" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Available Rewards</CardTitle>
                      <CardDescription>
                        Redeem your points for these rewards
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Card>
                          <CardContent className="p-4">
                            <div className="aspect-video rounded-md bg-muted mb-4 overflow-hidden">
                              <img
                                src="https://images.unsplash.com/photo-1572119865084-43c285814d63?w=600&q=80"
                                alt="Discount Coupon"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <h4 className="font-semibold">
                              10% Discount Coupon
                            </h4>
                            <div className="flex justify-between items-center mt-2">
                              <Badge
                                variant="outline"
                                className="bg-primary/10"
                              >
                                200 points
                              </Badge>
                              <Button
                                size="sm"
                                disabled={userProfile.points < 200}
                              >
                                Redeem
                              </Button>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-4">
                            <div className="aspect-video rounded-md bg-muted mb-4 overflow-hidden">
                              <img
                                src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80"
                                alt="Tree Planting"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <h4 className="font-semibold">Plant a Tree</h4>
                            <div className="flex justify-between items-center mt-2">
                              <Badge
                                variant="outline"
                                className="bg-primary/10"
                              >
                                500 points
                              </Badge>
                              <Button
                                size="sm"
                                disabled={userProfile.points < 500}
                              >
                                Redeem
                              </Button>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-4">
                            <div className="aspect-video rounded-md bg-muted mb-4 overflow-hidden">
                              <img
                                src="https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=600&q=80"
                                alt="Eco-friendly Kit"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <h4 className="font-semibold">Eco-friendly Kit</h4>
                            <div className="flex justify-between items-center mt-2">
                              <Badge
                                variant="outline"
                                className="bg-primary/10"
                              >
                                750 points
                              </Badge>
                              <Button
                                size="sm"
                                disabled={userProfile.points < 750}
                              >
                                Redeem
                              </Button>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-4">
                            <div className="aspect-video rounded-md bg-muted mb-4 overflow-hidden">
                              <img
                                src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&q=80"
                                alt="Community Event"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <h4 className="font-semibold">
                              Community Event Ticket
                            </h4>
                            <div className="flex justify-between items-center mt-2">
                              <Badge
                                variant="outline"
                                className="bg-primary/10"
                              >
                                1000 points
                              </Badge>
                              <Button
                                size="sm"
                                disabled={userProfile.points < 1000}
                              >
                                Redeem
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="settings" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Account Settings</CardTitle>
                      <CardDescription>
                        Manage your account preferences and notifications
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" value={user.email || ""} disabled />
                        <p className="text-xs text-muted-foreground">
                          Your email address is used for login and notifications
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Password</Label>
                        <Button variant="outline" className="w-full">
                          Change Password
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label>Notifications</Label>
                        <div className="grid grid-cols-1 gap-4">
                          <div className="flex items-center justify-between border p-4 rounded-md">
                            <div>
                              <h4 className="font-medium">
                                Email Notifications
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                Receive updates about your reports and community
                                activity
                              </p>
                            </div>
                            <div className="flex items-center h-5">
                              <input
                                id="email-notifications"
                                aria-describedby="email-notifications-description"
                                name="email-notifications"
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                defaultChecked
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between border p-4 rounded-md">
                            <div>
                              <h4 className="font-medium">Report Updates</h4>
                              <p className="text-sm text-muted-foreground">
                                Get notified when your reports are processed
                              </p>
                            </div>
                            <div className="flex items-center h-5">
                              <input
                                id="report-updates"
                                aria-describedby="report-updates-description"
                                name="report-updates"
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                defaultChecked
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between border p-4 rounded-md">
                            <div>
                              <h4 className="font-medium">Marketing</h4>
                              <p className="text-sm text-muted-foreground">
                                Receive updates about new features and
                                promotions
                              </p>
                            </div>
                            <div className="flex items-center h-5">
                              <input
                                id="marketing"
                                aria-describedby="marketing-description"
                                name="marketing"
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <Button
                          variant="destructive"
                          className="w-full sm:w-auto"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Account
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          This will permanently delete your account and all your
                          data
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button className="ml-auto">Save Settings</Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
