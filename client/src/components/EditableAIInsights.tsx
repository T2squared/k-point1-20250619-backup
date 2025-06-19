import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UserCheck, TrendingUp, Lightbulb, Target, Loader2, Edit, Save, X, Plus, Minus } from "lucide-react";

interface AnalysisResponse {
  insights: string[];
  recommendations: string[];
  trend: string;
}

interface EditableAIInsightsProps {
  type: 'department' | 'user' | 'distribution';
  data: any[];
  title: string;
  userRole?: string;
}

export default function EditableAIInsights({ type, data, title, userRole }: EditableAIInsightsProps) {
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [analysisId, setAnalysisId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingData, setEditingData] = useState({
    trend: '',
    insights: [''],
    recommendations: ['']
  });

  // コンポーネントマウント時に既存の分析結果を取得
  const loadExistingAnalysis = async () => {
    try {
      const response = await fetch(`/api/admin/coach-analysis/${type}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const result = await response.json();
        
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

  useEffect(() => {
    loadExistingAnalysis();
  }, [type]);

  const handleAnalyze = async () => {
    if (userRole !== 'superadmin') {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user-id': 'admin2'
        },
        credentials: 'include',
        body: JSON.stringify({ type, data, title })
      });

      if (response.ok) {
        const result = await response.json();
        const analysisResponse: AnalysisResponse = {
          insights: Array.isArray(result.insights) ? result.insights : [],
          recommendations: Array.isArray(result.recommendations) ? result.recommendations : [],
          trend: typeof result.trend === 'string' ? result.trend : ''
        };
        
        setAnalysis(analysisResponse);
        setEditingData({
          trend: analysisResponse.trend,
          insights: analysisResponse.insights.length > 0 ? analysisResponse.insights : [''],
          recommendations: analysisResponse.recommendations.length > 0 ? analysisResponse.recommendations : ['']
        });
        
        // 新しい分析後、IDを再取得
        await loadExistingAnalysis();
      }
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!analysisId) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/coach-analysis/${analysisId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user-id': 'admin2'
        },
        credentials: 'include',
        body: JSON.stringify({
          trend: editingData.trend,
          insights: editingData.insights.filter(item => item.trim()),
          recommendations: editingData.recommendations.filter(item => item.trim())
        })
      });

      if (response.ok) {
        const updatedAnalysis = await response.json();
        setAnalysis({
          insights: updatedAnalysis.insights || [],
          recommendations: updatedAnalysis.recommendations || [],
          trend: updatedAnalysis.trend || ''
        });
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving analysis:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingData({
      trend: analysis?.trend || '',
      insights: analysis?.insights && analysis.insights.length > 0 ? analysis.insights : [''],
      recommendations: analysis?.recommendations && analysis.recommendations.length > 0 ? analysis.recommendations : ['']
    });
  };

  const addInsightField = () => {
    setEditingData(prev => ({
      ...prev,
      insights: [...prev.insights, '']
    }));
  };

  const addRecommendationField = () => {
    setEditingData(prev => ({
      ...prev,
      recommendations: [...prev.recommendations, '']
    }));
  };

  const removeInsightField = (index: number) => {
    setEditingData(prev => ({
      ...prev,
      insights: prev.insights.filter((_, i) => i !== index)
    }));
  };

  const removeRecommendationField = (index: number) => {
    setEditingData(prev => ({
      ...prev,
      recommendations: prev.recommendations.filter((_, i) => i !== index)
    }));
  };

  const isSuperAdmin = userRole === 'superadmin';

  return (
    <Card className={`mt-4 ${isSuperAdmin ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'}`}>
      <CardHeader className="pb-3">
        <CardTitle className={`flex items-center justify-between ${isSuperAdmin ? 'text-green-900' : 'text-gray-600'}`}>
          <div className="flex items-center space-x-2">
            <UserCheck className="h-5 w-5" />
            <span>コーチからの分析</span>
          </div>
          {isSuperAdmin && analysis && !isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              size="sm"
              className="border-green-300 text-green-700 hover:bg-green-100"
            >
              <Edit className="h-4 w-4 mr-2" />
              編集
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 分析結果の表示セクション */}
        <div className="space-y-4 mb-6">
          {/* トレンド */}
          <div className="bg-white rounded-lg p-3 border border-green-100">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-900">トレンド</span>
            </div>
            {isEditing ? (
              <Textarea
                value={editingData.trend}
                onChange={(e) => setEditingData(prev => ({ ...prev, trend: e.target.value }))}
                placeholder="トレンドを入力..."
                className="min-h-[60px]"
              />
            ) : (
              <p className="text-sm text-gray-600">
                {analysis?.trend || "トレンドはまだ分析されていません"}
              </p>
            )}
          </div>

          {/* コーチの洞察 */}
          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Lightbulb className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">コーチの洞察</span>
              </div>
              {isEditing && (
                <Button
                  onClick={addInsightField}
                  variant="outline"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {isEditing ? (
                editingData.insights.map((insight, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      value={insight}
                      onChange={(e) => {
                        const newInsights = [...editingData.insights];
                        newInsights[index] = e.target.value;
                        setEditingData(prev => ({ ...prev, insights: newInsights }));
                      }}
                      placeholder="洞察を入力..."
                      className="flex-1"
                    />
                    {editingData.insights.length > 1 && (
                      <Button
                        onClick={() => removeInsightField(index)}
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                analysis?.insights && analysis.insights.length > 0 ? (
                  analysis.insights.map((insight, index) => (
                    <p key={index} className="text-sm text-gray-600">• {insight}</p>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">洞察はまだ生成されていません</p>
                )
              )}
            </div>
          </div>

          {/* 改善アドバイス */}
          <div className="bg-white rounded-lg p-3 border border-orange-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-orange-600" />
                <span className="font-medium text-orange-900">改善アドバイス</span>
              </div>
              {isEditing && (
                <Button
                  onClick={addRecommendationField}
                  variant="outline"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {isEditing ? (
                editingData.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      value={recommendation}
                      onChange={(e) => {
                        const newRecommendations = [...editingData.recommendations];
                        newRecommendations[index] = e.target.value;
                        setEditingData(prev => ({ ...prev, recommendations: newRecommendations }));
                      }}
                      placeholder="推奨事項を入力..."
                      className="flex-1"
                    />
                    {editingData.recommendations.length > 1 && (
                      <Button
                        onClick={() => removeRecommendationField(index)}
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                analysis?.recommendations && analysis.recommendations.length > 0 ? (
                  analysis.recommendations.map((recommendation, index) => (
                    <p key={index} className="text-sm text-gray-600">• {recommendation}</p>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">アドバイスはまだ生成されていません</p>
                )
              )}
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        {isSuperAdmin && (
          <div className="text-center border-t border-green-100 pt-4">
            {isEditing ? (
              <div className="flex justify-center space-x-4">
                <Button
                  onClick={handleSaveEdit}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  保存
                </Button>
                <Button
                  onClick={handleCancelEdit}
                  variant="outline"
                  disabled={isLoading}
                  className="border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  <X className="h-4 w-4 mr-2" />
                  キャンセル
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  最新データを分析して新しいアドバイスを生成
                </p>
                <Button
                  onClick={handleAnalyze}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700 text-white shadow-md"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <UserCheck className="h-4 w-4 mr-2" />
                  )}
                  新しい分析を実行
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}