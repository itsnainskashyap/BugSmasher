import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { Order } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import useWebSocket from "@/hooks/useWebSocket";
import { CheckCircle, XCircle, Search, Download } from "lucide-react";

export default function PendingPayments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const { lastMessage } = useWebSocket();

  const { data: pendingOrders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/dashboard/pending-orders"],
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Handle WebSocket updates
  useEffect(() => {
    if (lastMessage) {
      const data = JSON.parse(lastMessage.data);
      if (['PAYMENT_SUBMITTED', 'PAYMENT_APPROVED', 'PAYMENT_REJECTED'].includes(data.type)) {
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/pending-orders"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      }
    }
  }, [lastMessage, queryClient]);

  const approveMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest("POST", `/api/dashboard/approve-payment/${orderId}`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment Approved",
        description: "Payment has been successfully approved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/pending-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error: Error) => {
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
        title: "Approval Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest("POST", `/api/dashboard/reject-payment/${orderId}`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment Rejected",
        description: "Payment has been rejected.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/pending-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error: Error) => {
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
        title: "Rejection Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredOrders = pendingOrders.filter((order: any) => 
    order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.utr?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateTimeRemaining = (createdAt: string, expiresAt: string) => {
    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
    
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return { minutes, seconds, remaining };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle data-testid="text-pending-payments-title">Pending Payment Approvals</CardTitle>
            <p className="text-sm text-muted-foreground">Review and approve UTR submissions</p>
          </div>
          <div className="flex space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
                data-testid="input-search-payments"
              />
            </div>
            <Button variant="outline" size="sm" data-testid="button-export-payments">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8" data-testid="text-loading-payments">Loading pending payments...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground" data-testid="text-no-pending-payments">
            {searchTerm ? "No payments found matching your search." : "No pending payments at the moment."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Order ID</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Amount</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">UTR</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Time Remaining</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order: any) => {
                  const timeInfo = calculateTimeRemaining(order.createdAt, order.expiresAt);
                  const isUrgent = timeInfo.remaining < 60;
                  
                  return (
                    <tr key={order.id} className="border-b hover:bg-muted/20" data-testid={`row-payment-${order.orderId}`}>
                      <td className="p-4">
                        <div className="font-mono text-sm text-primary" data-testid={`text-order-id-${order.orderId}`}>
                          {order.orderId}
                        </div>
                        <div className="text-sm text-muted-foreground" data-testid={`text-description-${order.orderId}`}>
                          {order.description || 'N/A'}
                        </div>
                        {order.customerEmail && (
                          <div className="text-xs text-muted-foreground" data-testid={`text-customer-${order.orderId}`}>
                            {order.customerEmail}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-foreground" data-testid={`text-amount-${order.orderId}`}>
                          ₹{(order.amount / 100).toFixed(2)}
                        </span>
                      </td>
                      <td className="p-4">
                        {order.utr ? (
                          <div>
                            <span className="font-mono text-sm bg-muted text-muted-foreground px-2 py-1 rounded" data-testid={`text-utr-${order.orderId}`}>
                              {order.utr}
                            </span>
                            <div className="text-xs text-muted-foreground mt-1">
                              Submitted {new Date(order.updatedAt).toLocaleTimeString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Awaiting UTR</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className={`font-semibold ${isUrgent ? 'text-red-600 animate-pulse' : 'text-yellow-600'}`} data-testid={`text-time-remaining-${order.orderId}`}>
                          {timeInfo.remaining > 0 ? `${timeInfo.minutes}m ${timeInfo.seconds}s` : 'Expired'}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div 
                            className={`h-1.5 rounded-full ${isUrgent ? 'bg-red-500' : 'bg-yellow-500'}`}
                            style={{ width: `${Math.max(0, (timeInfo.remaining / 300) * 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="p-4">
                        {order.utr && timeInfo.remaining > 0 ? (
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => approveMutation.mutate(order.orderId)}
                              disabled={approveMutation.isPending}
                              data-testid={`button-approve-${order.orderId}`}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => rejectMutation.mutate(order.orderId)}
                              disabled={rejectMutation.isPending}
                              data-testid={`button-reject-${order.orderId}`}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            {!order.utr ? 'Awaiting submission' : 'Expired'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
