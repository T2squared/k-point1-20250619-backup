import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";
import { Link } from "wouter";
import type { TransactionWithUsers } from "@shared/schema";

export default function RecentActivity() {
  const { data: recentTransactions, isLoading } = useQuery({
    queryKey: ["/api/transactions/recent"],
    retry: false,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History className="h-5 w-5 text-primary" />
            <span>最近の活動</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-md animate-pulse">
                <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-24"></div>
                  <div className="h-3 bg-gray-300 rounded w-32"></div>
                  <div className="h-3 bg-gray-300 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "たった今";
    if (diffInMinutes < 60) return `${diffInMinutes}分前`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}時間前`;
    return `${Math.floor(diffInMinutes / 1440)}日前`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <History className="h-5 w-5 text-primary" />
          <span>最近の活動</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentTransactions && recentTransactions.length > 0 ? (
            recentTransactions.map((transaction: TransactionWithUsers) => (
              <div key={transaction.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-md">
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={transaction.sender.profileImageUrl || `https://ui-avatars.com/api/?name=${transaction.sender.firstName}+${transaction.sender.lastName}&background=1976D2&color=fff`}
                    alt={`${transaction.sender.firstName} ${transaction.sender.lastName}`}
                  />
                  <AvatarFallback>
                    {transaction.sender.firstName?.[0]}{transaction.sender.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {transaction.sender.lastName} {transaction.sender.firstName}
                  </p>
                  {transaction.message && (
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {transaction.message}
                    </p>
                  )}
                  <div className="flex items-center mt-1 space-x-2">
                    <span className="text-xs font-medium text-secondary">
                      +{transaction.points} ポイント
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTimeAgo(new Date(transaction.createdAt!))}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>まだ活動がありません</p>
            </div>
          )}
        </div>
        {recentTransactions && recentTransactions.length > 0 && (
          <Link href="/history">
            <Button variant="ghost" className="w-full mt-4 text-primary hover:text-primary/80">
              すべての履歴を見る
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
