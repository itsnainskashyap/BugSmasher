import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X, Smartphone } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

export const InstallPrompt = () => {
  const { 
    isInstallable, 
    isInstalled, 
    showInstallPrompt, 
    hideInstallDialog, 
    installApp,
    requestNotificationPermission,
    subscribeToNotifications 
  } = usePWA();
  
  const [hasShownPrompt, setHasShownPrompt] = useState(false);

  useEffect(() => {
    // Show install prompt after user is logged in and app is installable
    const checkAndShowPrompt = () => {
      if (isInstallable && !isInstalled && !hasShownPrompt) {
        // Check if user dismissed before
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (!dismissed && window.location.pathname !== '/') { // User is logged in
          setTimeout(() => {
            setHasShownPrompt(true);
            setShowInstallPrompt(true); // Actually show the dialog
          }, 2000);
        }
      }
    };

    checkAndShowPrompt();
  }, [isInstallable, isInstalled, hasShownPrompt]);

  const handleInstall = async () => {
    await installApp();
    
    // After installation, request notification permission
    const notificationPermission = await requestNotificationPermission();
    if (notificationPermission === 'granted') {
      await subscribeToNotifications();
    }
  };

  const handleClose = () => {
    hideInstallDialog();
    setHasShownPrompt(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!isInstallable || isInstalled) {
    return null;
  }

  return (
    <>
      {/* Install Button in Header/Navbar */}
      <Button
        onClick={() => handleInstall()}
        variant="outline"
        size="sm"
        className="hidden md:flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 hover:from-purple-700 hover:to-pink-700"
        data-testid="button-install-app"
      >
        <Download className="h-4 w-4" />
        Install App
      </Button>

      {/* Mobile Install FAB */}
      <div className="fixed bottom-4 right-4 md:hidden z-50">
        <Button
          onClick={() => handleInstall()}
          size="lg"
          className="rounded-full h-14 w-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
          data-testid="button-install-mobile"
        >
          <Smartphone className="h-6 w-6" />
        </Button>
      </div>

      {/* Install Dialog */}
      <Dialog open={showInstallPrompt} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-full">
                <Smartphone className="h-6 w-6 text-purple-600" />
              </div>
              Install OnionPay App
            </DialogTitle>
            <DialogDescription>
              Install OnionPay on your device for faster access and push notifications when payments are received.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
              <h4 className="font-semibold text-sm mb-2">Benefits of installing:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Instant notifications for new payments</li>
                <li>• Work offline and sync when connected</li>
                <li>• Quick access from home screen</li>
                <li>• Native app-like experience</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={handleClose}
              data-testid="button-install-later"
            >
              <X className="h-4 w-4 mr-2" />
              Maybe Later
            </Button>
            <Button 
              onClick={handleInstall}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              data-testid="button-install-confirm"
            >
              <Download className="h-4 w-4 mr-2" />
              Install Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};