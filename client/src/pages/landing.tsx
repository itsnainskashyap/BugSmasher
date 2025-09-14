import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import OnionLogo from "@/components/onion-logo";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            <div className="flex justify-center items-center space-x-3">
              <OnionLogo size={48} />
              <h1 className="text-3xl font-bold text-primary">OnionPay</h1>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">Admin Dashboard</h2>
              <p className="text-muted-foreground">Secure payment gateway management</p>
            </div>

            <div className="space-y-4">
              <Button 
                onClick={() => window.location.href = '/api/login'}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                size="lg"
                data-testid="button-admin-login"
              >
                Sign In as Admin
              </Button>

              <div className="text-xs text-muted-foreground">
                <p>Powered by OnionPay • Secure Admin Access</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
