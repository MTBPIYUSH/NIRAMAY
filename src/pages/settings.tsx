import { useState } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Settings as SettingsIcon,
  Bell,
  User,
  Shield,
  Smartphone,
  Globe,
  Moon,
  Sun,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useTheme } from "@/components/theme-provider";

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSaveSettings = () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSuccess("Settings saved successfully");
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    }, 1000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="container max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">
                Settings
              </h1>
              <p className="text-muted-foreground">
                Manage your account settings and preferences
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6">
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <Tabs defaultValue="account" orientation="vertical" className="w-full">
                    <TabsList className="flex flex-col items-start h-auto w-full bg-transparent p-0 space-y-1">
                      <TabsTrigger 
                        value="account" 
                        className="w-full justify-start px-3 py-2 font-normal"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Account
                      </TabsTrigger>
                      <TabsTrigger 
                        value="notifications" 
                        className="w-full justify-start px-3 py-2 font-normal"
                      >
                        <Bell className="h-4 w-4 mr-2" />
                        Notifications
                      </TabsTrigger>
                      <TabsTrigger 
                        value="appearance" 
                        className="w-full justify-start px-3 py-2 font-normal"
                      >
                        <Moon className="h-4 w-4 mr-2" />
                        Appearance
                      </TabsTrigger>
                      <TabsTrigger 
                        value="privacy" 
                        className="w-full justify-start px-3 py-2 font-normal"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Privacy & Security
                      </TabsTrigger>
                      <TabsTrigger 
                        value="devices" 
                        className="w-full justify-start px-3 py-2 font-normal"
                      >
                        <Smartphone className="h-4 w-4 mr-2" />
                        Devices
                      </TabsTrigger>
                      <TabsTrigger 
                        value="language" 
                        className="w-full justify-start px-3 py-2 font-normal"
                      >
                        <Globe className="h-4 w-4 mr-2" />
                        Language & Region
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Tabs defaultValue="account">
                <TabsContent value="account" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Account Information</CardTitle>
                      <CardDescription>
                        Update your account details and personal information
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input id="name" defaultValue={user?.user_metadata?.name || ""} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" value={user?.email || ""} disabled />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <textarea
                          id="bio"
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Tell us about yourself"
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline">Cancel</Button>
                      <Button onClick={handleSaveSettings} disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </CardFooter>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Password</CardTitle>
                      <CardDescription>
                        Change your password to keep your account secure
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input id="current-password" type="password" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="new-password">New Password</Label>
                          <Input id="new-password" type="password" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirm-password">Confirm Password</Label>
                          <Input id="confirm-password" type="password" />
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button className="ml-auto">Change Password</Button>
                    </CardFooter>
                  </Card>
                </TabsContent>

                <TabsContent value="notifications" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Notification Preferences</CardTitle>
                      <CardDescription>
                        Choose how you want to be notified about activity
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="flex items-center justify-between border p-4 rounded-md">
                          <div>
                            <h4 className="font-medium">Email Notifications</h4>
                            <p className="text-sm text-muted-foreground">
                              Receive updates about your reports and community activity
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
                            <h4 className="font-medium">Community Activity</h4>
                            <p className="text-sm text-muted-foreground">
                              Get notified about leaderboard changes and community events
                            </p>
                          </div>
                          <div className="flex items-center h-5">
                            <input
                              id="community-activity"
                              aria-describedby="community-activity-description"
                              name="community-activity"
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
                              Receive updates about new features and promotions
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
                    </CardContent>
                    <CardFooter>
                      <Button className="ml-auto" onClick={handleSaveSettings} disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Preferences"
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>

                <TabsContent value="appearance" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Appearance</CardTitle>
                      <CardDescription>
                        Customize how the app looks and feels
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Theme</Label>
                        <div className="grid grid-cols-3 gap-4">
                          <div 
                            className={`border rounded-md p-4 cursor-pointer flex flex-col items-center gap-2 ${theme === 'light' ? 'border-primary bg-primary/5' : ''}`}
                            onClick={() => setTheme('light')}
                          >
                            <Sun className="h-6 w-6" />
                            <span className="text-sm">Light</span>
                          </div>
                          <div 
                            className={`border rounded-md p-4 cursor-pointer flex flex-col items-center gap-2 ${theme === 'dark' ? 'border-primary bg-primary/5' : ''}`}
                            onClick={() => setTheme('dark')}
                          >
                            <Moon className="h-6 w-6" />
                            <span className="text-sm">Dark</span>
                          </div>
                          <div 
                            className={`border rounded-md p-4 cursor-pointer flex flex-col items-center gap-2 ${theme === 'system' ? 'border-primary bg-primary/5' : ''}`}
                            onClick={() => setTheme('system')}
                          >
                            <SettingsIcon className="h-6 w-6" />
                            <span className="text-sm">System</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      {success && (
                        <Alert className="mr-auto bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-800">
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <AlertDescription className="text-green-700 dark:text-green-400">
                            {success}
                          </AlertDescription>
                        </Alert>
                      )}
                      {error && (
                        <Alert className="mr-auto" variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}
                      <Button className="ml-auto" onClick={handleSaveSettings} disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Preferences"
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>

                <TabsContent value="privacy" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Privacy & Security</CardTitle>
                      <CardDescription>
                        Manage your privacy settings and account security
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Privacy Settings</Label>
                        <div className="grid grid-cols-1 gap-4">
                          <div className="flex items-center justify-between border p-4 rounded-md">
                            <div>
                              <h4 className="font-medium">Profile Visibility</h4>
                              <p className="text-sm text-muted-foreground">
                                Control who can see your profile and activity
                              </p>
                            </div>
                            <select
                              id="profile-visibility"
                              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                              defaultValue="public"
                            >
                              <option value="public">Public</option>
                              <option value="friends">Friends Only</option>
                              <option value="private">Private</option>
                            </select>
                          </div>

                          <div className="flex items-center justify-between border p-4 rounded-md">
                            <div>
                              <h4 className="font-medium">Data Usage</h4>
                              <p className="text-sm text-muted-foreground">
                                Allow us to use your data to improve our services
                              </p>
                            </div>
                            <div className="flex items-center h-5">
                              <input
                                id="data-usage"
                                aria-describedby="data-usage-description"
                                name="data-usage"
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                defaultChecked
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 pt-4 border-t">
                        <Label>Security</Label>
                        <div className="grid grid-cols-1 gap-4">
                          <div className="flex items-center justify-between border p-4 rounded-md">
                            <div>
                              <h4 className="font-medium">Two-Factor Authentication</h4>
                              <p className="text-sm text-muted-foreground">
                                Add an extra layer of security to your account
                              </p>
                            </div>
                            <Button variant="outline" size="sm">
                              Enable
                            </Button>
                          </div>

