import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";

interface DepartmentRanking {
  name: string;
  totalPoints: number;
  memberCount: number;
}

interface DepartmentRankingsProps {
  rankings: DepartmentRanking[];
}

export default function DepartmentRankings({ rankings }: DepartmentRankingsProps) {
  const getRankBadge = (index: number) => {
    const rank = index + 1;
    if (rank === 1) return <Badge className="bg-yellow-500 text-white">1位</Badge>;
    if (rank === 2) return <Badge className="bg-gray-400 text-white">2位</Badge>;
    if (rank === 3) return <Badge className="bg-orange-600 text-white">3位</Badge>;
    return <Badge variant="outline">{rank}位</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <span>部署別ランキング</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {rankings && rankings.length > 0 ? (
            rankings.slice(0, 5).map((dept, index) => (
              <div key={dept.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {getRankBadge(index)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{dept.name}</p>
                    <p className="text-xs text-gray-500">{dept.memberCount}名</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-secondary">{dept.totalPoints}</p>
                  <p className="text-xs text-gray-500">ポイント</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>データがありません</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
