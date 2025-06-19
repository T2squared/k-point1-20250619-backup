import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Send } from "lucide-react";
import type { User } from "@shared/schema";

const sendPointsSchema = z.object({
  receiverId: z.string().min(1, "送付先を選択してください"),
  points: z.number().min(1).max(3),
  message: z.string().optional(),
});

type SendPointsFormData = z.infer<typeof sendPointsSchema>;

interface SendPointsCardProps {
  user: User;
}

export default function SendPointsCard({ user }: SendPointsCardProps) {
  const [selectedPoints, setSelectedPoints] = useState(3);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: allUsers } = useQuery({
    queryKey: ["/api/users"],
    retry: false,
  });

  const form = useForm<SendPointsFormData>({
    resolver: zodResolver(sendPointsSchema),
    defaultValues: {
      points: 3,
      message: "",
    },
  });

  const sendPointsMutation = useMutation({
    mutationFn: async (data: SendPointsFormData) => {
      const response = await apiRequest("POST", "/api/transactions", {
        senderId: user.id,
        receiverId: data.receiverId,
        points: data.points,
        message: data.message,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/with-stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      form.reset({
        receiverId: "",
        points: 3,
        message: "",
      });
      setSelectedPoints(3);
      
      toast({
        title: "K-pointを送付しました",
        description: `${selectedPoints}ポイントを正常に送付しました。`,
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
        title: "送付に失敗しました",
        description: error.message || "K-pointの送付に失敗しました。",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SendPointsFormData) => {
    sendPointsMutation.mutate({ ...data, points: selectedPoints });
  };

  const selectPoints = (points: number) => {
    setSelectedPoints(points);
    form.setValue("points", points);
  };

  const otherUsers = allUsers?.filter((u: User) => u.id !== user.id && u.isActive) || [];
  const dailySentCount = (user as any).dailySentCount || 0;
  const dailyProgress = (dailySentCount / 3) * 100;
  const canSend = dailySentCount < 3 && user.pointBalance >= selectedPoints;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Send className="h-5 w-5 text-primary" />
          <span>K-pointを送付する</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* User Selection */}
            <FormField
              control={form.control}
              name="receiverId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>送付先</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="送付先を選択してください" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {otherUsers.map((otherUser: User) => (
                        <SelectItem key={otherUser.id} value={otherUser.id}>
                          {otherUser.lastName} {otherUser.firstName} ({otherUser.department})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Point Amount */}
            <div>
              <FormLabel>送付ポイント数</FormLabel>
              <div className="flex space-x-2 mt-2">
                {[1, 2, 3].map((points) => (
                  <Button
                    key={points}
                    type="button"
                    variant={selectedPoints === points ? "default" : "outline"}
                    className={`flex-1 py-6 ${
                      selectedPoints === points 
                        ? "bg-primary text-white" 
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                    onClick={() => selectPoints(points)}
                  >
                    <div className="text-center">
                      <div className="text-lg font-semibold text-secondary">{points}</div>
                      <div className="text-xs">ポイント</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Message */}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>メッセージ</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="感謝のメッセージを入力してください（任意）"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Send Button */}
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white"
              disabled={sendPointsMutation.isPending || !canSend}
            >
              <Send className="h-4 w-4 mr-2" />
              {sendPointsMutation.isPending 
                ? "送付中..." 
                : canSend 
                  ? "K-pointを送付する"
                  : dailySentCount >= 3
                    ? "今日の送付上限に達しました"
                    : "ポイントが不足しています"
              }
            </Button>

            {/* Daily Limit Indicator */}
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">今日の送付状況</span>
                <span className="text-sm text-gray-500">{dailySentCount}/3回</span>
              </div>
              <Progress value={dailyProgress} className="h-2" />
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
