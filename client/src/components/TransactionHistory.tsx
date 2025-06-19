import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import type { TransactionWithUsers } from "@shared/schema";

export default function TransactionHistory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["/api/transactions", { limit: 100, offset: 0 }],
    retry: false,
  });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const filteredTransactions = (transactions || []).filter((tx: TransactionWithUsers) => {
    if (!tx.sender || !tx.receiver) return false;
    
    const matchesSearch = searchQuery === "" || 
      `${tx.sender.lastName} ${tx.sender.firstName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${tx.receiver.lastName} ${tx.receiver.firstName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.message && tx.message.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterPeriod === "all") return true;
    
    const txDate = new Date(tx.createdAt!);
    const now = new Date();
    
    switch (filterPeriod) {
      case "today":
        return txDate.toDateString() === now.toDateString();
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return txDate >= weekAgo;
      case "month":
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        return txDate >= monthAgo;
      default:
        return true;
    }
  });

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>送付履歴</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 py-4">
                <div className="h-10 w-10 bg-gray-300 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>送付履歴</CardTitle>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="検索..."
                className="pl-10 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全期間</SelectItem>
                <SelectItem value="today">今日</SelectItem>
                <SelectItem value="week">今週</SelectItem>
                <SelectItem value="month">今月</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  送信者
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  受信者
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ポイント
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  メッセージ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  日時
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedTransactions.length > 0 ? (
                paginatedTransactions.map((transaction: TransactionWithUsers) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8">
                          <AvatarImage 
                            src={transaction.sender.profileImageUrl || `https://ui-avatars.com/api/?name=${transaction.sender.firstName}+${transaction.sender.lastName}&background=1976D2&color=fff`}
                            alt={`${transaction.sender.firstName} ${transaction.sender.lastName}`}
                          />
                          <AvatarFallback>
                            {transaction.sender.firstName?.[0]}{transaction.sender.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {transaction.sender.lastName} {transaction.sender.firstName}
                          </p>
                          <p className="text-xs text-gray-500">{transaction.sender.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8">
                          <AvatarImage 
                            src={transaction.receiver.profileImageUrl || `https://ui-avatars.com/api/?name=${transaction.receiver.firstName}+${transaction.receiver.lastName}&background=1976D2&color=fff`}
                            alt={`${transaction.receiver.firstName} ${transaction.receiver.lastName}`}
                          />
                          <AvatarFallback>
                            {transaction.receiver.firstName?.[0]}{transaction.receiver.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {transaction.receiver.lastName} {transaction.receiver.firstName}
                          </p>
                          <p className="text-xs text-gray-500">{transaction.receiver.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="secondary" className="bg-secondary/10 text-secondary">
                        {transaction.points} ポイント
                      </Badge>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="text-sm text-gray-900 truncate">
                        {transaction.message || "-"}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(new Date(transaction.createdAt!))}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    {searchQuery || filterPeriod !== "all" 
                      ? "条件に一致する履歴がありません" 
                      : "まだ送付履歴がありません"
                    }
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                前へ
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                次へ
              </Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">{startIndex + 1}</span>
                  から
                  <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredTransactions.length)}</span>
                  件目（全
                  <span className="font-medium">{filteredTransactions.length}</span>
                  件）
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
