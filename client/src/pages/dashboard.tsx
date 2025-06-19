import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import SendPointsCard from "@/components/SendPointsCard";
import RecentActivity from "@/components/RecentActivity";
import TransactionHistory from "@/components/TransactionHistory";
import DepartmentRankings from "@/components/DepartmentRankings";
import { Card, CardContent } from "@/components/ui/card";
import { Coins, Send, Gift, TrendingUp, Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Dashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  const { data: userWithStats } = useQuery({
    queryKey: ["/api/users/with-stats"],
    enabled: !!user,
    select: (users: any[]) => users.find(u => u.id === user?.id),
    retry: false,
  });

  const { data: systemStats } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: !!user,
    retry: false,
  });

  const { data: departmentRankings } = useQuery({
    queryKey: ["/api/departments/rankings"],
    retry: false,
  });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  const currentUser = userWithStats || user;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={currentUser} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">ダッシュボード</h2>
          <p className="text-gray-600">チームメンバーに感謝の気持ちをK-pointで表現しましょう</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-primary/10">
                  <Coins className="h-6 w-6 text-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">現在の残高</p>
                  <p className="text-2xl font-bold text-gray-900">{currentUser.pointBalance}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-secondary/10">
                  <Send className="h-6 w-6 text-secondary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">今日の送付回数</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {currentUser.dailySentCount || 0}
                    <span className="text-sm text-gray-500">/3</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-success/10">
                  <Gift className="h-6 w-6 text-success" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">今月受取ポイント</p>
                  <p className="text-2xl font-bold text-gray-900">{currentUser.monthlyReceived || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-warning/10">
                  <TrendingUp className="h-6 w-6 text-warning" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">システム総流通量</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {systemStats?.totalCirculation || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Send Points Section */}
          <div className="lg:col-span-2">
            <SendPointsCard user={currentUser} />
          </div>

          {/* Recent Activity Sidebar */}
          <div className="space-y-6">
            <RecentActivity />
            <DepartmentRankings rankings={(departmentRankings || []).filter((dept: any) => dept.name !== 'SuperAdmin' && dept.name !== '')} />
          </div>
        </div>

        {/* Transaction History Table */}
        <div className="mt-8">
          <TransactionHistory />
        </div>

        {/* Admin Panel Preview */}
        {user.role === 'admin' && systemStats && (
          <div className="mt-8 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg border border-primary/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Settings className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">管理者機能</h3>
                  <p className="text-sm text-gray-600">システム管理とデータ出力</p>
                </div>
              </div>
              <Link href="/admin">
                <Button className="bg-primary text-white hover:bg-primary/90">
                  管理画面を開く
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-2xl font-bold text-gray-900">{systemStats.totalUsers}</div>
                <div className="text-sm text-gray-600">総ユーザー数</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-2xl font-bold text-gray-900">{systemStats.todayTransactions}</div>
                <div className="text-sm text-gray-600">今日の送付数</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-2xl font-bold text-gray-900">{systemStats.activeDepartments}</div>
                <div className="text-sm text-gray-600">アクティブ部署</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="text-2xl font-bold text-gray-900">{systemStats.totalCirculation}</div>
                <div className="text-sm text-gray-600">流通ポイント</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
