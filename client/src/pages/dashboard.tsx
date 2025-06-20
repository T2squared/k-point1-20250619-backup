import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import SendPointsCard from "@/components/SendPointsCard";
import RecentActivity from "@/components/RecentActivity";
import TransactionHistory from "@/components/TransactionHistory";
import DepartmentRankings from "@/components/DepartmentRankings";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Coins, Send, Gift, TrendingUp, Settings } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Dashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  // Team distribution state
  const [isTeamDistributionDialogOpen, setIsTeamDistributionDialogOpen] = useState(false);
  const [distributionData, setDistributionData] = useState({
    team: '',
    totalPoints: 0,
    reason: ''
  });

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

  // Team distribution mutation (admin/superadmin only)
  const distributeToTeamMutation = useMutation({
    mutationFn: async (data: { team: string; totalPoints: number; reason: string }) => {
      const res = await apiRequest('POST', `/api/admin/departments/${data.team}/distribute`, {
        totalPoints: data.totalPoints,
        reason: data.reason
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP ${res.status}`);
      }
      return await res.json();
    },
    onSuccess: (data) => {
      setIsTeamDistributionDialogOpen(false);
      setDistributionData({ team: '', totalPoints: 0, reason: '' });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/departments/rankings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/with-stats'] });
      toast({
        title: "チーム分配完了",
        description: `${data.team}チームに${data.totalPoints}ポイントを分配しました。`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "認証エラー",
          description: "ログアウトしました。再度ログインしてください。",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "エラー",
        description: error.message || "チーム分配に失敗しました。",
        variant: "destructive",
      });
    },
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
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">ダッシュボード</h2>
            <p className="text-gray-600">チームメンバーに感謝の気持ちをK-pointで表現しましょう</p>
          </div>
          {(user.role === 'admin' || user.role === 'superadmin') && (
            <Dialog open={isTeamDistributionDialogOpen} onOpenChange={setIsTeamDistributionDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="bg-primary text-white hover:bg-primary/90">
                  <Gift className="h-4 w-4 mr-2" />
                  チーム分配
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>チーム別ポイント分配</DialogTitle>
                  <DialogDescription>
                    指定したチームの全メンバーに均等にポイントを分配します。
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="distributeTeam" className="text-right">
                      チーム
                    </Label>
                    <Select value={distributionData.team} onValueChange={(value) => setDistributionData({...distributionData, team: value})}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="チームを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="チーム集積">チーム集積</SelectItem>
                        <SelectItem value="チーム製造1">チーム製造1</SelectItem>
                        <SelectItem value="チーム製造2">チーム製造2</SelectItem>
                        <SelectItem value="チーム大臣">チーム大臣</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="totalPoints" className="text-right">
                      総ポイント数
                    </Label>
                    <Input
                      id="totalPoints"
                      type="number"
                      value={distributionData.totalPoints}
                      onChange={(e) => setDistributionData({...distributionData, totalPoints: parseInt(e.target.value) || 0})}
                      className="col-span-3"
                      min="1"
                      placeholder="分配する総ポイント数"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="distributionReason" className="text-right">
                      理由
                    </Label>
                    <Input
                      id="distributionReason"
                      value={distributionData.reason}
                      onChange={(e) => setDistributionData({...distributionData, reason: e.target.value})}
                      className="col-span-3"
                      placeholder="分配理由（任意）"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsTeamDistributionDialogOpen(false)}
                  >
                    キャンセル
                  </Button>
                  <Button 
                    onClick={() => distributeToTeamMutation.mutate(distributionData)}
                    disabled={distributeToTeamMutation.isPending || !distributionData.team || !distributionData.totalPoints}
                  >
                    {distributeToTeamMutation.isPending ? "分配中..." : "分配実行"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
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
