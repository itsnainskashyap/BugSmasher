import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Order } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import OnionLogo from "@/components/onion-logo";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function PaymentPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { toast } = useToast();
  const [utr, setUtr] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);

  const { data: order, isLoading } = useQuery<{
    status: string;
    orderId: string;
    amount: number;
    updatedAt: string;
    description?: string;
  }>({
    queryKey: [`/api/onionpay/status/${orderId}`],
    refetchInterval: 5000, // Poll every 5 seconds
    retry: false,
  });

  const submitPaymentMutation = useMutation({
    mutationFn: async (data: { orderId: string; utr: string }) => {
      const response = await apiRequest("POST", "/api/onionpay/submit", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment Submitted",
        description: "Your payment proof has been submitted for verification.",
      });
      setUtr("");
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Countdown timer
  useEffect(() => {
    if (!order || order.status !== 'pending') return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiryTime = new Date(order.updatedAt).getTime() + (5 * 60 * 1000); // 5 minutes from creation
      const difference = expiryTime - now;

      if (difference > 0) {
        setTimeLeft(Math.floor(difference / 1000));
      } else {
        setTimeLeft(0);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [order]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId || !utr.trim()) return;

    submitPaymentMutation.mutate({ orderId, utr: utr.trim() });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span data-testid="text-loading">Loading payment details...</span>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2" data-testid="text-error-title">Payment Not Found</h2>
            <p className="text-muted-foreground">The payment link is invalid or has expired.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 py-8 px-4">
      <div className="max-w-md mx-auto">
        <Card className="shadow-xl border border-border overflow-hidden">
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-6 text-center">
            <div className="flex justify-center items-center space-x-2 mb-2">
              <OnionLogo size={24} className="text-white" />
              <h1 className="text-xl font-bold" data-testid="text-payment-header">OnionPay</h1>
            </div>
            <p className="text-sm opacity-90">Secure Payment Gateway</p>
          </div>

          <CardContent className="p-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-2" data-testid="text-payment-description">
                {order.description || "Payment"}
              </h3>
              <div className="text-3xl font-bold text-primary mb-4" data-testid="text-payment-amount">
                ₹{(order.amount / 100).toFixed(2)}
              </div>

              {order.status === 'pending' && timeLeft > 0 && (
                <div className="bg-muted/30 rounded-lg p-4 mb-4">
                  <div className="text-sm text-muted-foreground mb-2">Payment expires in:</div>
                  <div 
                    className={`text-2xl font-bold ${timeLeft < 60 ? 'text-red-600 animate-pulse' : 'text-foreground'}`}
                    data-testid="text-countdown-timer"
                  >
                    {formatTime(timeLeft)}
                  </div>
                  <div className="w-full bg-border rounded-full h-2 mt-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${(timeLeft / 300) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {order.status === 'pending' && timeLeft > 0 && (
                <>
                  <div className="mb-6">
                    <p className="text-sm text-muted-foreground mb-4">
                      Scan QR code and pay exactly ₹{(order.amount / 100).toFixed(2)}
                    </p>
                    <div className="w-48 h-48 mx-auto bg-muted border border-border rounded-md flex items-center justify-center">
                      <span className="text-muted-foreground">QR Code</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">UPI Payment</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="utr" className="block text-sm font-medium text-foreground mb-2">
                        Enter UTR Number
                      </Label>
                      <Input
                        id="utr"
                        type="text"
                        value={utr}
                        onChange={(e) => setUtr(e.target.value.toUpperCase())}
                        placeholder="12-digit UTR number"
                        maxLength={20}
                        className="w-full"
                        data-testid="input-utr"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 text-lg"
                      disabled={!utr.trim() || submitPaymentMutation.isPending}
                      data-testid="button-submit-payment"
                    >
                      {submitPaymentMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Payment Proof"
                      )}
                    </Button>
                  </form>
                </>
              )}

              {order.status === 'approved' && (
                <div className="text-center">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-green-600 mb-2" data-testid="text-payment-approved">
                    Payment Approved!
                  </h2>
                  <p className="text-muted-foreground">Your payment has been confirmed.</p>
                </div>
              )}

              {order.status === 'failed' && (
                <div className="text-center">
                  <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-red-600 mb-2" data-testid="text-payment-failed">
                    Payment Failed
                  </h2>
                  <p className="text-muted-foreground">Your payment was not approved.</p>
                </div>
              )}

              {(order.status === 'expired' || (order.status === 'pending' && timeLeft <= 0)) && (
                <div className="text-center">
                  <XCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-orange-600 mb-2" data-testid="text-payment-expired">
                    Payment Expired
                  </h2>
                  <p className="text-muted-foreground">The payment window has closed.</p>
                </div>
              )}

              <div className="mt-4 text-xs text-muted-foreground">
                <p>Order ID: <span className="font-mono" data-testid="text-order-id">{order.orderId}</span></p>
                <p>Secured by OnionPay • Your payment is protected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
