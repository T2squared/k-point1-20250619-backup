import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function NotFound() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2 items-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">ページが見つかりません</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600 mb-6">
            お探しのページは存在しないか、移動された可能性があります。
          </p>

          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                ダッシュボードに戻る
              </Link>
            </Button>
            
            {user && (user.role === 'admin' || user.role === 'superadmin') && (
              <Button asChild variant="outline" className="w-full">
                <Link href="/admin">
                  <Settings className="mr-2 h-4 w-4" />
                  管理画面
                </Link>
              </Button>
            )}
          </div>

          <p className="mt-4 text-xs text-gray-500 text-center">
            問題が続く場合は、管理者にお問い合わせください。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
