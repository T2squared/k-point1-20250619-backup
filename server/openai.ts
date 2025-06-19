import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface AnalysisRequest {
  type: 'department' | 'user' | 'distribution';
  data: any[];
  context?: string;
}

export interface AnalysisResponse {
  insights: string[];
  recommendations: string[];
  trend: string;
}

export async function analyzeChartData(request: AnalysisRequest): Promise<AnalysisResponse> {
  try {
    let prompt = "";
    
    switch (request.type) {
      case 'department':
        prompt = `
以下は企業のK-Pointシステム（感謝ポイント制度）における部門別データです：
${JSON.stringify(request.data, null, 2)}

このデータを分析して、以下の観点から日本語で回答してください：
1. 主要な洞察（3つまで）
2. 改善提案（2つまで）
3. 全体的なトレンド（1つ）

回答はJSON形式で、insights配列、recommendations配列、trend文字列で構成してください。
各項目は簡潔で実用的な内容にしてください。
`;
        break;
        
      case 'user':
        prompt = `
以下は企業のK-Pointシステムにおけるユーザー活動データです：
${JSON.stringify(request.data, null, 2)}

このデータを分析して、以下の観点から日本語で回答してください：
1. ユーザー行動の主要な洞察（3つまで）
2. エンゲージメント向上提案（2つまで）
3. 活動パターンのトレンド（1つ）

回答はJSON形式で、insights配列、recommendations配列、trend文字列で構成してください。
`;
        break;
        
      case 'distribution':
        prompt = `
以下は企業のK-Pointシステムにおける部門別ポイント分布データです：
${JSON.stringify(request.data, null, 2)}

このデータを分析して、以下の観点から日本語で回答してください：
1. ポイント分布の主要な洞察（3つまで）
2. バランス改善提案（2つまで）
3. 分布の特徴（1つ）

回答はJSON形式で、insights配列、recommendations配列、trend文字列で構成してください。
`;
        break;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "あなたは企業の人事・組織分析の専門家です。データを分析して実用的な洞察と提案を提供してください。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1000
    });

    const rawContent = response.choices[0].message.content || '{}';
    const result = JSON.parse(rawContent);
    
    return {
      insights: result.insights || [],
      recommendations: result.recommendations || [],
      trend: result.trend || "分析結果が不明です"
    };
    
  } catch (error) {
    console.error("OpenAI analysis error:", error);
    return {
      insights: ["データ分析中にエラーが発生しました"],
      recommendations: ["システム管理者にお問い合わせください"],
      trend: "分析不可"
    };
  }
}