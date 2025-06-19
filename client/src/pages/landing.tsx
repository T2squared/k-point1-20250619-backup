import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, Heart, Users, TrendingUp, LogIn } from "lucide-react";
import { useLocation } from "wouter";

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Coins className="h-12 w-12 text-primary mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">K-point</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            社内で感謝の気持ちを形にする。チームメンバー同士でK-pointを贈り合い、
            日々の貢献を可視化します。
          </p>
          
          {/* Login Button */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-lg mx-auto mb-8">
            <h3 className="text-lg font-semibold mb-4">システムにログイン</h3>
            <Button 
              onClick={() => setLocation('/login')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              <LogIn className="h-5 w-5 mr-2" />
              ログイン画面へ
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardHeader>
              <Coins className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle className="text-lg">ポイント送信</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                同僚の貢献や努力を認め、感謝の気持ちをK-pointで表現
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Heart className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle className="text-lg">感謝の可視化</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                日々の小さな親切や協力を数値化し、チーム全体で共有
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle className="text-lg">チーム連携</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                部署間の連携を促進し、組織全体のコミュニケーション向上
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle className="text-lg">成長分析</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                個人とチームの成長をAI分析で可視化し、継続的な改善をサポート
              </p>
            </CardContent>
          </Card>
        </div>

        {/* System Features */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">システムの特徴</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">簡単操作</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• 直感的なユーザーインターフェース</li>
                <li>• ワンクリックでポイント送信</li>
                <li>• リアルタイムでの残高確認</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">AI分析</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• チームのトレンド分析</li>
                <li>• 個人の成長指標</li>
                <li>• 改善提案とコーチング</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">管理機能</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• ユーザー管理とロール設定</li>
                <li>• 取引履歴の詳細分析</li>
                <li>• データエクスポート機能</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">セキュリティ</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• 安全なログイン認証</li>
                <li>• データの暗号化保護</li>
                <li>• アクセス権限の厳格管理</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500">
          <p>K-point システム - 社内感謝可視化プラットフォーム</p>
        </div>
      </div>
    </div>
  );
}