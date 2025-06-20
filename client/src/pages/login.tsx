import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogIn } from "lucide-react";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  // 既にログインしている場合はダッシュボードにリダイレクト
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      setLocation('/');
    }
  }, [isAuthenticated, authLoading, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const user = await response.json();
        // React Queryのキャッシュを無効化して認証状態を更新
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        toast({
          title: "ログイン成功",
          description: `${user.lastName} ${user.firstName}さん、おかえりなさい！`
        });
        // 少し待ってからリダイレクト
        setTimeout(() => {
          setLocation('/');
        }, 100);
      } else {
        const error = await response.json();
        toast({
          title: "ログイン失敗",
          description: error.message || "ユーザー名またはパスワードが正しくありません",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "ログイン中にエラーが発生しました",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800">
              K-Point システム
            </CardTitle>
            <p className="text-gray-600">ログインしてください</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">ユーザーID</Label>
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="ユーザーIDを入力"
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">パスワード</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="パスワードを入力"
                  required
                  disabled={isLoading}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <LogIn className="h-4 w-4 mr-2" />
                )}
                ログイン
              </Button>
            </form>


          </CardContent>
        </Card>
      </div>
    </div>
  );
}