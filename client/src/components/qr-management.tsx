import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { QrCode } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Upload, QrCode as QrCodeIcon } from "lucide-react";

export default function QrManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [upiId, setUpiId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: qrCode, isLoading } = useQuery<QrCode | null>({
    queryKey: ["/api/qr-code"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: { upiId: string; file?: File }) => {
      const formData = new FormData();
      formData.append("upiId", data.upiId);
      if (data.file) {
        formData.append("qrImage", data.file);
      }

      const response = await fetch("/api/qr-code", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to upload QR code");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "QR Code Uploaded",
        description: "QR code has been uploaded successfully.",
      });
      setUpiId("");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      queryClient.invalidateQueries({ queryKey: ["/api/qr-code"] });
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
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image under 2MB.",
          variant: "destructive",
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!upiId.trim()) {
      toast({
        title: "Validation Error",
        description: "UPI ID is required.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate({ upiId: upiId.trim(), file: selectedFile || undefined });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Upload QR Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center" data-testid="text-upload-qr-title">
            <Upload className="h-5 w-5 mr-2" />
            Upload QR Code
          </CardTitle>
          <p className="text-sm text-muted-foreground">Upload UPI QR codes for payments</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="upiId" className="block text-sm font-medium text-foreground mb-2">
                UPI ID
              </Label>
              <Input
                id="upiId"
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="your-upi@paytm"
                data-testid="input-upi-id"
              />
            </div>
            <div>
              <Label htmlFor="qrImage" className="block text-sm font-medium text-foreground mb-2">
                QR Code Image
              </Label>
              <div 
                className="border-2 border-dashed border-border rounded-md p-6 text-center hover:border-primary transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                data-testid="dropzone-qr-upload"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  data-testid="input-qr-file"
                />
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-primary font-medium">
                  {selectedFile ? selectedFile.name : "Click to upload QR code"}
                </p>
                <p className="text-xs text-muted-foreground">PNG, JPG up to 2MB</p>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={uploadMutation.isPending}
              data-testid="button-upload-qr"
            >
              {uploadMutation.isPending ? "Uploading..." : "Upload QR Code"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Current QR Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center" data-testid="text-current-qr-title">
            <QrCodeIcon className="h-5 w-5 mr-2" />
            Current QR Code
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8" data-testid="text-loading-qr">Loading QR code...</div>
          ) : qrCode ? (
            <div className="text-center">
              {qrCode.imageUrl ? (
                <img 
                  src={qrCode.imageUrl} 
                  alt="Current UPI QR Code" 
                  className="mx-auto w-48 h-48 border border-border rounded-md mb-4 object-cover"
                  data-testid="img-current-qr"
                />
              ) : (
                <div className="mx-auto w-48 h-48 border border-border rounded-md mb-4 flex items-center justify-center bg-muted">
                  <QrCodeIcon className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground" data-testid="text-current-upi-id">
                  UPI ID: {qrCode.upiId}
                </p>
                <p className="text-sm text-muted-foreground" data-testid="text-qr-uploaded-date">
                  Uploaded: {qrCode.createdAt ? new Date(qrCode.createdAt).toLocaleDateString() : 'Unknown'}
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setUpiId(qrCode.upiId);
                    fileInputRef.current?.click();
                  }}
                  data-testid="button-replace-qr"
                >
                  Replace QR Code
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-no-qr">
              No QR code uploaded yet. Upload one above to start accepting payments.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
