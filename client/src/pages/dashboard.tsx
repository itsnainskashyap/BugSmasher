import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OnionLogo from "@/components/onion-logo";
import PendingPayments from "@/components/pending-payments";
import ProductManagement from "@/components/product-management";
import QrManagement from "@/components/qr-management";
import Analytics from "@/components/analytics";
import useWebSocket from "@/hooks/useWebSocket";
import { Bell, LogOut, TrendingUp, Clock, CheckCircle, Package } from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const { user, isLoading } = useAuth() as { user: User | null; isLoading: boolean; };
  const { lastMessage } = useWebSocket();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [user, isLoading, toast]);

  // Handle WebSocket notifications
  useEffect(() => {
    if (lastMessage) {
      const data = JSON.parse(lastMessage.data);
      if (data.type === 'PAYMENT_SUBMITTED') {
        toast({
          title: "New Payment Submitted",
          description: `UTR: ${data.data.utr} - Amount: ₹${(data.data.amount / 100).toFixed(2)}`,
        });
      }
    }
  }, [lastMessage, toast]);

  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalRevenue: number;
    pendingPayments: number;
    successfulPayments: number;
    successRate: number;
    activeProducts: number;
  }>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading || !user) {
    return <div data-testid="text-loading">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <nav className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <OnionLogo size={32} />
              <h1 className="text-2xl font-bold text-primary" data-testid="text-app-title">OnionPay</h1>
              <span className="text-muted-foreground">Admin Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" data-testid="button-notifications">
                <Bell className="h-5 w-5" />
                {(stats?.pendingPayments ?? 0) > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {stats?.pendingPayments ?? 0}
                  </span>
                )}
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium" data-testid="text-user-initials">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </span>
                </div>
                <span className="text-sm font-medium" data-testid="text-user-email">{user.email}</span>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => window.location.href = '/api/logout'}
                  data-testid="button-logout"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-total-revenue">
                    {statsLoading ? "..." : `₹${stats?.totalRevenue?.toLocaleString('en-IN') || 0}`}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Payments</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-pending-payments">
                    {statsLoading ? "..." : stats?.pendingPayments || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-success-rate">
                    {statsLoading ? "..." : `${stats?.successRate || 0}%`}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Products</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-active-products">
                    {statsLoading ? "..." : stats?.activeProducts || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending" data-testid="tab-pending-payments">Pending Payments</TabsTrigger>
            <TabsTrigger value="products" data-testid="tab-products">Products</TabsTrigger>
            <TabsTrigger value="qr-management" data-testid="tab-qr-management">QR Management</TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <PendingPayments />
          </TabsContent>

          <TabsContent value="products">
            <ProductManagement />
          </TabsContent>

          <TabsContent value="qr-management">
            <QrManagement />
          </TabsContent>

          <TabsContent value="analytics">
            <Analytics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
