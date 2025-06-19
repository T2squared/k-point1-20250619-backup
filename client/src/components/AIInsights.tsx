import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCheck, TrendingUp, Lightbulb, Target, Loader2 } from "lucide-react";

interface AnalysisResponse {
  insights: string[];
  recommendations: string[];
  trend: string;
}

interface AIInsightsProps {
  type: 'department' | 'user' | 'distribution';
  data: any[];
  title: string;
  userRole?: string;
}

export default function AIInsights({ type, data, title, userRole }: AIInsightsProps) {
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [analysisId, setAnalysisId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingData, setEditingData] = useState({
    trend: '',
    insights: [''],
    recommendations: ['']
  });

  console.log('AIInsights Component Props:', { type, title, userRole });
  console.log('Current analysis state:', analysis);

  // コンポーネントマウント時に既存の分析結果を取得
  const loadExistingAnalysis = async () => {
    try {
      const response = await fetch(`/api/admin/coach-analysis/${type}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Loaded existing analysis:', result);
        
        if (result.insights?.length > 0 || result.recommendations?.length > 0 || result.trend) {
          setAnalysis({
            insights: result.insights || [],
            recommendations: result.recommendations || [],
            trend: result.trend || ''
          });
          setAnalysisId(result.id);
          setEditingData({
            trend: result.trend || '',
            insights: result.insights && result.insights.length > 0 ? result.insights : [''],
            recommendations: result.recommendations && result.recommendations.length > 0 ? result.recommendations : ['']
          });
        }
      }
    } catch (error) {
      console.error('Failed to load existing analysis:', error);
    }
  };

  // コンポーネントマウント時に実行
  useEffect(() => {
    loadExistingAnalysis();
  }, [type]);

  const handleAnalyze = async () => {
    console.log('handleAnalyze called - User role:', userRole);
    console.log('Request data:', { type, data, title });
    
    setIsLoading(true);
    try {
      console.log('Making request to /api/admin/analyze...');
      
      const response = await fetch('/api/admin/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify({
          type,
          data,
          context: title
        })
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response body:', errorText);
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }
      
      const responseText = await response.text();
      console.log('Raw API response text:', responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Failed to parse response as JSON');
      }
      console.log('Parsed API response:', result);
      
      // レスポンスの型チェックを緩和し、基本的な構造をチェック
      if (result && typeof result === 'object') {
        const analysisResponse: AnalysisResponse = {
          insights: Array.isArray(result.insights) ? result.insights : ['分析結果を取得できませんでした'],
          recommendations: Array.isArray(result.recommendations) ? result.recommendations : ['推奨事項がありません'],
          trend: typeof result.trend === 'string' ? result.trend : '傾向不明'
        };
        console.log('Response validation passed, normalized:', analysisResponse);
        setAnalysis(analysisResponse);
      } else {
        console.error('Invalid response format:', result);
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysis({
        insights: ['分析中にエラーが発生しました'],
        recommendations: ['システム管理者にお問い合わせください'],
        trend: 'エラー'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isSuperAdmin = userRole === 'superadmin';

  return (
    <Card className={`mt-4 ${isSuperAdmin ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'}`}>
      <CardHeader className="pb-3">
        <CardTitle className={`flex items-center space-x-2 ${isSuperAdmin ? 'text-green-900' : 'text-gray-600'}`}>
          <UserCheck className="h-5 w-5" />
          <span>コーチからの分析</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 分析結果の表示セクション - 常に表示 */}
        <div className="space-y-4 mb-6">
          {/* トレンド */}
          <div className="bg-white rounded-lg p-3 border border-green-100">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-900">トレンド</span>
            </div>
            <p className="text-sm text-gray-600">
              {analysis?.trend || 'トレンド分析はまだ実行されていません'}
            </p>
          </div>

          {/* コーチの洞察 */}
          <div className="bg-white rounded-lg p-3 border border-green-100">
            <div className="flex items-center space-x-2 mb-2">
              <Lightbulb className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-900">コーチの洞察</span>
            </div>
            <div className="space-y-1">
              {analysis?.insights && analysis.insights.length > 0 ? (
                analysis.insights.map((insight, index) => (
                  <p key={index} className="text-sm text-gray-600">• {insight}</p>
                ))
              ) : (
                <p className="text-sm text-gray-500">洞察はまだ生成されていません</p>
              )}
            </div>
          </div>

          {/* 改善アドバイス */}
          <div className="bg-white rounded-lg p-3 border border-green-100">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-900">改善アドバイス</span>
            </div>
            <div className="space-y-1">
              {analysis?.recommendations && analysis.recommendations.length > 0 ? (
                analysis.recommendations.map((recommendation, index) => (
                  <p key={index} className="text-sm text-gray-600">• {recommendation}</p>
                ))
              ) : (
                <p className="text-sm text-gray-500">アドバイスはまだ生成されていません</p>
              )}
            </div>
          </div>
        </div>

        {/* スーパーユーザー用の分析ボタン */}
        {isSuperAdmin && (
          <div className="text-center border-t border-green-100 pt-4">
            <p className="text-sm text-gray-600 mb-4">
              最新データを分析して新しいアドバイスを生成
            </p>
            <Button 
              onClick={handleAnalyze}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  分析中...
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4 mr-2" />
                  新しい分析を実行
                </>
              )}
            </Button>
          </div>
        )}

        {/* 一般ユーザー用のメッセージ */}
        {!isSuperAdmin && (!analysis || (!analysis.insights && !analysis.recommendations)) && (
          <div className="text-center border-t border-gray-100 pt-4">
            <p className="text-sm text-gray-500">
              コーチからの新しい分析をお待ちください
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}