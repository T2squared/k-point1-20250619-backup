import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Users, 
  Download, 
  Upload, 
  RefreshCw, 
  TrendingUp,
  Settings,
  FileSpreadsheet,
  AlertTriangle,
  Edit,
  Plus,
  Save,
  X,
  BarChart3,
  PieChart
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
  ScatterChart,
  Scatter
} from "recharts";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import EditableAIInsights from "@/components/EditableAIInsights";

export default function Admin() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // User management state
  const [editingUser, setEditingUser] = useState<any>(null);
  
  // Name update mutation (superadmin only)
  const updateUserNameMutation = useMutation({
    mutationFn: async ({ userId, firstName, lastName }: { userId: string; firstName: string; lastName: string }) => {
      const res = await apiRequest('PUT', `/api/admin/users/${userId}/name`, { firstName, lastName });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/with-stats'] });
      setEditingUser(null);
      toast({
        title: "ユーザー名更新完了",
        description: "ユーザー名が正常に更新されました。",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "認証エラー",
          description: "再ログインしています...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "更新エラー",
        description: "ユーザー名の更新に失敗しました。",
        variant: "destructive",
      });
    },
  });
  
  // System circulation mutation (superadmin only)
  const setCirculationMutation = useMutation({
    mutationFn: async (amount: number) => {
      console.log("Setting circulation to:", amount);
      const res = await apiRequest('POST', '/api/admin/set-circulation', { amount });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP ${res.status}`);
      }
      return await res.json();
    },
    onSuccess: (data) => {
      console.log("Circulation set successfully:", data);
      setIsCirculationDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "システム流通量更新完了",
        description: `システム総流通量が${circulationAmount}ポイントに設定されました。`,
      });
    },
    onError: (error) => {
      console.error("Circulation setting error:", error);
      if (isUnauthorizedError(error)) {
        toast({
          title: "認証エラー",
          description: "再ログインしています...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "設定エラー",
        description: `システム流通量の設定に失敗しました: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    id: '',
    email: '',
    firstName: '',
    lastName: '',
    department: '',
    role: 'user',
    pointBalance: 20,
    isActive: true
  });
  
  // System circulation management state
  const [isCirculationDialogOpen, setIsCirculationDialogOpen] = useState(false);
  const [circulationAmount, setCirculationAmount] = useState(1000);

  // Redirect to home if not authenticated or not admin
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
    
    if (!isLoading && user && user.role !== 'admin' && user.role !== 'superadmin') {
      toast({
        title: "Access Denied",
        description: "Admin access required.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  const { data: systemStats } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: !!user && (user.role === 'admin' || user.role === 'superadmin'),
    retry: false,
  });

  const { data: allUsers } = useQuery({
    queryKey: ["/api/users/with-stats"],
    enabled: !!user && (user.role === 'admin' || user.role === 'superadmin'),
    retry: false,
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: !!user && (user.role === 'admin' || user.role === 'superadmin'),
    retry: false,
  });

  const { data: departmentRankings } = useQuery({
    queryKey: ["/api/departments/rankings"],
    enabled: !!user && (user.role === 'admin' || user.role === 'superadmin'),
    retry: false,
  });

  // Process data for charts
  const departmentChartData = departmentRankings ? departmentRankings.map((dept: any) => ({
    name: dept.name,
    totalPoints: dept.totalPoints,
    memberCount: dept.memberCount,
    averagePoints: Math.round(dept.totalPoints / dept.memberCount)
  })) : [];

  const userScatterData = allUsers ? allUsers.map((user: any) => ({
    name: `${user.lastName} ${user.firstName}`,
    sent: user.pointBalance, // Points they currently have (reverse of sent)
    received: user.monthlyReceived || 0,
    department: user.department
  })) : [];

  const departmentColors = [
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b'
  ];

  const exportTransactionsMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/export/transactions");
    },
    onSuccess: () => {
      toast({
        title: "成功",
        description: "送付履歴をGoogleスプレッドシートに出力しました。",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "エラー",
        description: "送付履歴の出力に失敗しました。",
        variant: "destructive",
      });
    },
  });

  const exportBalancesMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/export/balances");
    },
    onSuccess: () => {
      toast({
        title: "成功",
        description: "残高一覧をGoogleスプレッドシートに出力しました。",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "エラー",
        description: "残高一覧の出力に失敗しました。",
        variant: "destructive",
      });
    },
  });

  const downloadTransactionsCsv = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/export/transactions/csv", {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.blob();
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'transaction_history.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "エラー",
        description: "送付履歴CSVのダウンロードに失敗しました。",
        variant: "destructive",
      });
    },
  });

  const downloadBalancesCsv = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/export/balances/csv", {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.blob();
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'user_balances.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "エラー",
        description: "残高一覧CSVのダウンロードに失敗しました。",
        variant: "destructive",
      });
    },
  });

  const importUsersMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/import/users");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/with-stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "成功",
        description: `ユーザーを取り込みました。新規: ${data.imported}名、更新: ${data.updated}名`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "エラー",
        description: "ユーザーの取り込みに失敗しました。",
        variant: "destructive",
      });
    },
  });

  const resetQuarterlyMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/reset-quarterly");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/with-stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "成功",
        description: "四半期リセットを実行しました。全ユーザーの残高が20ポイントになりました。",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "エラー",
        description: "四半期リセットに失敗しました。",
        variant: "destructive",
      });
    },
  });

  // User management mutations
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: any }) => {
      await apiRequest("PUT", `/api/admin/users/${userId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/with-stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setEditingUser(null);
      toast({
        title: "成功",
        description: "ユーザー情報を更新しました。",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "エラー",
        description: "ユーザー情報の更新に失敗しました。",
        variant: "destructive",
      });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      await apiRequest("POST", "/api/admin/users", userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/with-stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setIsCreateUserDialogOpen(false);
      setNewUser({
        id: '',
        email: '',
        firstName: '',
        lastName: '',
        department: '',
        role: 'user',
        pointBalance: 20,
        isActive: true
      });
      toast({
        title: "成功",
        description: "新しいユーザーを作成しました。",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "エラー",
        description: "ユーザーの作成に失敗しました。",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Settings className="h-8 w-8 text-primary" />
            <h2 className="text-2xl font-bold text-gray-900">管理画面</h2>
            <Badge variant="secondary">Admin</Badge>
          </div>
          <p className="text-gray-600">K-pointシステムの管理とデータ出力</p>
        </div>

        {/* System Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">総ユーザー数</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-secondary/10">
                    <TrendingUp className="h-6 w-6 text-secondary" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">今日の送付数</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.todayTransactions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-success/10">
                    <FileSpreadsheet className="h-6 w-6 text-success" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">アクティブ部署</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.activeDepartments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-warning/10">
                      <TrendingUp className="h-6 w-6 text-warning" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">総流通量</p>
                      <p className="text-2xl font-bold text-gray-900">{stats?.totalCirculation || 0}</p>
                    </div>
                  </div>
                  {user?.role === 'superadmin' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setCirculationAmount(stats?.totalCirculation || 1000);
                        setIsCirculationDialogOpen(true);
                      }}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      変更
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Department Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span>部門別分析</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={12}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        value,
                        name === 'totalPoints' ? '総ポイント' : 
                        name === 'memberCount' ? 'メンバー数' : '平均ポイント'
                      ]}
                    />
                    <Legend 
                      formatter={(value) => 
                        value === 'totalPoints' ? '総ポイント' : 
                        value === 'memberCount' ? 'メンバー数' : '平均ポイント'
                      }
                    />
                    <Bar dataKey="totalPoints" fill="#1f77b4" name="totalPoints" />
                    <Bar dataKey="memberCount" fill="#ff7f0e" name="memberCount" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <EditableAIInsights 
                type="department"
                data={departmentChartData}
                title="部門別分析"
                userRole={user?.role}
              />
            </CardContent>
          </Card>

          {/* Department Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChart className="h-5 w-5 text-primary" />
                <span>部門別ポイント分布</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={departmentChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="totalPoints"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {departmentChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={departmentColors[index % departmentColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}ポイント`, '総ポイント']} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <EditableAIInsights 
                type="distribution"
                data={departmentChartData}
                title="部門別ポイント分布"
                userRole={user?.role}
              />
            </CardContent>
          </Card>
        </div>

        {/* User Analysis */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <span>ユーザー活動分析</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart data={userScatterData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    dataKey="sent" 
                    name="現在の残高"
                    label={{ value: '現在の残高', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="received" 
                    name="今月受信ポイント"
                    label={{ value: '今月受信ポイント', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    formatter={(value, name) => [
                      value,
                      name === 'sent' ? '現在の残高' : '今月受信ポイント'
                    ]}
                    labelFormatter={(label) => `ユーザー: ${userScatterData.find(d => d.name === label)?.name || ''}`}
                  />
                  <Scatter 
                    dataKey="received" 
                    fill="#1f77b4"
                    name="ユーザー活動"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <p>横軸: 現在の残高 / 縦軸: 今月受信ポイント</p>
              <p>右上のユーザーほど活発にポイントを受信しています</p>
            </div>
            <EditableAIInsights 
              type="user"
              data={userScatterData}
              title="ユーザー活動分析"
              userRole={user?.role}
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Google Sheets Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                <span>Googleスプレッドシート連携</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">データ出力</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-gray-600">送付履歴</h5>
                    <Button
                      onClick={() => exportTransactionsMutation.mutate()}
                      disabled={exportTransactionsMutation.isPending}
                      className="w-full justify-start text-xs"
                      variant="outline"
                      size="sm"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      {exportTransactionsMutation.isPending ? "出力中..." : "Sheets出力"}
                    </Button>
                    <Button
                      onClick={() => downloadTransactionsCsv.mutate()}
                      disabled={downloadTransactionsCsv.isPending}
                      className="w-full justify-start text-xs"
                      variant="secondary"
                      size="sm"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      {downloadTransactionsCsv.isPending ? "DL中..." : "CSV形式"}
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-gray-600">残高一覧</h5>
                    <Button
                      onClick={() => exportBalancesMutation.mutate()}
                      disabled={exportBalancesMutation.isPending}
                      className="w-full justify-start text-xs"
                      variant="outline"
                      size="sm"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      {exportBalancesMutation.isPending ? "出力中..." : "Sheets出力"}
                    </Button>
                    <Button
                      onClick={() => downloadBalancesCsv.mutate()}
                      disabled={downloadBalancesCsv.isPending}
                      className="w-full justify-start text-xs"
                      variant="secondary"
                      size="sm"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      {downloadBalancesCsv.isPending ? "DL中..." : "CSV形式"}
                    </Button>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">ユーザー管理</h4>
                <Button
                  onClick={() => importUsersMutation.mutate()}
                  disabled={importUsersMutation.isPending}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {importUsersMutation.isPending ? "取り込み中..." : "ユーザー一括取り込み"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-primary" />
                <span>システム管理</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">四半期リセット</h4>
                <p className="text-sm text-gray-600 mb-4">
                  全ユーザーのポイント残高を20ポイントにリセットします。
                  この操作は元に戻せません。
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full justify-start">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      四半期リセット実行
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>四半期リセットの確認</AlertDialogTitle>
                      <AlertDialogDescription>
                        本当に四半期リセットを実行しますか？
                        全ユーザーのポイント残高が20ポイントにリセットされます。
                        この操作は元に戻すことができません。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>キャンセル</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => resetQuarterlyMutation.mutate()}
                        disabled={resetQuarterlyMutation.isPending}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {resetQuarterlyMutation.isPending ? "実行中..." : "実行"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Management */}
        {allUsers && (
          <Card className="mt-8">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span>ユーザー管理</span>
                </CardTitle>
                <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      新規ユーザー作成
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>新規ユーザー作成</DialogTitle>
                      <DialogDescription>
                        新しいユーザーの情報を入力してください。
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="userId" className="text-right">
                          ユーザーID
                        </Label>
                        <Input
                          id="userId"
                          value={newUser.id}
                          onChange={(e) => setNewUser({ ...newUser, id: e.target.value })}
                          className="col-span-3"
                          placeholder="user123"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                          メール
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                          className="col-span-3"
                          placeholder="user@company.com"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="firstName" className="text-right">
                          名
                        </Label>
                        <Input
                          id="firstName"
                          value={newUser.firstName}
                          onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                          className="col-span-3"
                          placeholder="太郎"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="lastName" className="text-right">
                          姓
                        </Label>
                        <Input
                          id="lastName"
                          value={newUser.lastName}
                          onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                          className="col-span-3"
                          placeholder="山田"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="department" className="text-right">
                          部署
                        </Label>
                        <Select value={newUser.department} onValueChange={(value) => setNewUser({ ...newUser, department: value })}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="部署を選択" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="未設定">未設定</SelectItem>
                            <SelectItem value="集積">集積</SelectItem>
                            <SelectItem value="製造1">製造1</SelectItem>
                            <SelectItem value="製造2">製造2</SelectItem>
                            <SelectItem value="大臣">大臣</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role" className="text-right">
                          権限
                        </Label>
                        <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="pointBalance" className="text-right">
                          初期残高
                        </Label>
                        <Input
                          id="pointBalance"
                          type="number"
                          value={newUser.pointBalance}
                          onChange={(e) => setNewUser({ ...newUser, pointBalance: parseInt(e.target.value) || 0 })}
                          className="col-span-3"
                          min="0"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        onClick={() => createUserMutation.mutate(newUser)}
                        disabled={createUserMutation.isPending || !newUser.id || !newUser.firstName || !newUser.lastName}
                      >
                        {createUserMutation.isPending ? "作成中..." : "作成"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* System Circulation Setting Dialog */}
                <Dialog open={isCirculationDialogOpen} onOpenChange={setIsCirculationDialogOpen}>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>システム総流通量設定</DialogTitle>
                      <DialogDescription>
                        システム全体のポイント流通量を設定します。この設定はスーパーユーザーのみが変更可能です。
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="circulation" className="text-right">
                          流通量
                        </Label>
                        <Input
                          id="circulation"
                          type="number"
                          value={circulationAmount}
                          onChange={(e) => setCirculationAmount(parseInt(e.target.value) || 0)}
                          className="col-span-3"
                          min="0"
                          placeholder="1000"
                        />
                      </div>
                      <div className="text-sm text-gray-500 px-4">
                        現在の総流通量: {stats?.totalCirculation || 0} ポイント
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        onClick={() => setCirculationMutation.mutate(circulationAmount)}
                        disabled={setCirculationMutation.isPending || circulationAmount <= 0}
                      >
                        {setCirculationMutation.isPending ? "設定中..." : "設定"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ユーザー</TableHead>
                    <TableHead>部署</TableHead>
                    <TableHead>残高</TableHead>
                    <TableHead>今月受信</TableHead>
                    <TableHead>権限</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allUsers.map((rowUser: any) => (
                    <TableRow key={rowUser.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <img
                            className="h-8 w-8 rounded-full object-cover"
                            src={rowUser.profileImageUrl || `https://ui-avatars.com/api/?name=${rowUser.firstName}+${rowUser.lastName}&background=1976D2&color=fff`}
                            alt={`${rowUser.firstName} ${rowUser.lastName}`}
                          />
                          <div>
                            {editingUser?.id === rowUser.id && user?.role === 'superadmin' ? (
                              <div className="flex flex-col space-y-1">
                                <input
                                  type="text"
                                  value={editingUser.firstName}
                                  onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })}
                                  className="text-sm border rounded px-1 py-0.5 w-20"
                                  placeholder="名"
                                />
                                <input
                                  type="text"
                                  value={editingUser.lastName}
                                  onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value })}
                                  className="text-sm border rounded px-1 py-0.5 w-20"
                                  placeholder="姓"
                                />
                              </div>
                            ) : (
                              <div>
                                <p className="font-medium">{rowUser.lastName} {rowUser.firstName}</p>
                                <p className="text-sm text-gray-500">{rowUser.email}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {editingUser?.id === rowUser.id ? (
                          <Select 
                            value={editingUser.department} 
                            onValueChange={(value) => setEditingUser({ ...editingUser, department: value })}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">未設定</SelectItem>
                              <SelectItem value="集積">集積</SelectItem>
                              <SelectItem value="製造1">製造1</SelectItem>
                              <SelectItem value="製造2">製造2</SelectItem>
                              <SelectItem value="大臣">大臣</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          rowUser.department
                        )}
                      </TableCell>
                      <TableCell>{rowUser.pointBalance}</TableCell>
                      <TableCell>{rowUser.monthlyReceived || 0}</TableCell>
                      <TableCell>
                        {editingUser?.id === rowUser.id && user?.role === 'superadmin' ? (
                          <Select 
                            value={editingUser.role} 
                            onValueChange={(value) => setEditingUser({ ...editingUser, role: value })}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="superadmin">SuperAdmin</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant={
                            rowUser.role === 'superadmin' ? 'destructive' : 
                            rowUser.role === 'admin' ? 'default' : 'secondary'
                          }>
                            {rowUser.role === 'superadmin' ? 'SuperAdmin' : rowUser.role}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingUser?.id === rowUser.id ? (
                          <div className="flex space-x-2">
                            {user?.role === 'superadmin' && (editingUser.firstName !== rowUser.firstName || editingUser.lastName !== rowUser.lastName) && (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => updateUserNameMutation.mutate({ 
                                  userId: rowUser.id,
                                  firstName: editingUser.firstName,
                                  lastName: editingUser.lastName
                                })}
                                disabled={updateUserNameMutation.isPending}
                              >
                                名前保存
                              </Button>
                            )}
                            <Button
                              size="sm"
                              onClick={() => updateUserMutation.mutate({ 
                                userId: rowUser.id, 
                                updates: { 
                                  department: editingUser.department, 
                                  role: editingUser.role 
                                } 
                              })}
                              disabled={updateUserMutation.isPending}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingUser(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingUser({
                              id: rowUser.id,
                              firstName: rowUser.firstName,
                              lastName: rowUser.lastName,
                              department: rowUser.department,
                              role: rowUser.role
                            })}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
