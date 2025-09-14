import { useQuery } from "@tanstack/react-query";
import type { Order } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, BarChart3 } from "lucide-react";

export default function Analytics() {
  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalRevenue: number;
    pendingPayments: number;
    successfulPayments: number;
    successRate: number;
    activeProducts: number;
  }>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentOrders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/dashboard/pending-orders"],
  });

  // Mock chart data (in production, implement with Recharts)
  const chartData = [
    { day: "Mon", amount: 1200 },
    { day: "Tue", amount: 1900 },
    { day: "Wed", amount: 1600 },
    { day: "Thu", amount: 2400 },
    { day: "Fri", amount: 2100 },
    { day: "Sat", amount: 1400 },
    { day: "Sun", amount: 2600 },
  ];

  const maxAmount = Math.max(...chartData.map(d => d.amount));

  return (
    <div className="space-y-6">
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center" data-testid="text-revenue-trend-title">
              <TrendingUp className="h-5 w-5 mr-2" />
              Revenue Trend (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-center space-x-2 p-4">
              {chartData.map((data, index) => (
                <div key={data.day} className="flex flex-col items-center">
                  <div
                    className="bg-primary rounded-t w-8 transition-all duration-300 hover:bg-primary/80"
                    style={{ height: `${(data.amount / maxAmount) * 200}px` }}
                    data-testid={`bar-revenue-${index}`}
                  />
                  <span className="text-xs text-muted-foreground mt-2">{data.day}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center" data-testid="text-payment-status-title">
              <BarChart3 className="h-5 w-5 mr-2" />
              Payment Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 128 128">
                  <circle 
                    cx="64" 
                    cy="64" 
                    r="56" 
                    fill="none" 
                    stroke="#E5E7EB" 
                    strokeWidth="16"
                  />
                  <circle 
                    cx="64" 
                    cy="64" 
                    r="56" 
                    fill="none" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth="16" 
                    strokeDasharray="300 52" 
                    strokeLinecap="round"
                  />
                  <circle 
                    cx="64" 
                    cy="64" 
                    r="56" 
                    fill="none" 
                    stroke="#F39C12" 
                    strokeWidth="16" 
                    strokeDasharray="30 322" 
                    strokeDashoffset="-300" 
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-center">
                  <div>
                    <div className="text-lg font-bold text-foreground" data-testid="text-success-rate-chart">
                      {statsLoading ? "..." : `${stats?.successRate || 0}%`}
                    </div>
                    <div className="text-xs text-muted-foreground">Success</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-center space-x-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-primary rounded-full mr-2"></div>
                <span className="text-muted-foreground">
                  Successful ({statsLoading ? "..." : `${stats?.successRate || 0}%`})
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <span className="text-muted-foreground">
                  Failed ({statsLoading ? "..." : `${Math.round(100 - (stats?.successRate || 0))}%`})
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle data-testid="text-recent-transactions-title">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="text-center py-8" data-testid="text-loading-transactions">Loading transactions...</div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-no-transactions">
              No transactions found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Order ID</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Amount</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.slice(0, 10).map((order: any) => (
                    <tr key={order.id} className="border-b" data-testid={`row-transaction-${order.orderId}`}>
                      <td className="p-4 font-mono text-sm" data-testid={`text-transaction-order-id-${order.orderId}`}>
                        {order.orderId}
                      </td>
                      <td className="p-4 font-semibold" data-testid={`text-transaction-amount-${order.orderId}`}>
                        ₹{(order.amount / 100).toFixed(2)}
                      </td>
                      <td className="p-4">
                        <span 
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            order.status === 'approved' ? 'bg-green-100 text-green-800' :
                            order.status === 'failed' ? 'bg-red-100 text-red-800' :
                            order.status === 'expired' ? 'bg-gray-100 text-gray-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}
                          data-testid={`status-transaction-${order.orderId}`}
                        >
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground" data-testid={`text-transaction-date-${order.orderId}`}>
                        {new Date(order.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
