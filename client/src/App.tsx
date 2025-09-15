import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import PaymentPage from "@/pages/payment";
import IntegrationDocs from "@/pages/integration-docs";
import DemoPaymentPage from "@/pages/demo-payment";
import TestIntegrationPage from "@/pages/test-integration";
import IntegrationGuide from "@/pages/integration-guide";
import AutoAmountDemo from "@/pages/auto-amount-demo";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Public routes - accessible without authentication */}
      <Route path="/integration-docs" component={IntegrationDocs} />
      <Route path="/integration-guide" component={IntegrationGuide} />
      <Route path="/demo" component={DemoPaymentPage} />
      <Route path="/auto-amount-demo" component={AutoAmountDemo} />
      <Route path="/test-integration" component={TestIntegrationPage} />
      <Route path="/payment/:orderId" component={PaymentPage} />
      
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
        </>
      ) : (
        <>
          <Route path="/" component={Dashboard} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
