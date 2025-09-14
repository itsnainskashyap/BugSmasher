import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, Copy, Key, Plus, Eye, EyeOff } from "lucide-react";
import type { ApiKey } from "@shared/schema";

export default function ApiKeyManagement() {
  const { toast } = useToast();
  const [newKeyName, setNewKeyName] = useState("");
  const [showNewKey, setShowNewKey] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  const { data: apiKeys = [], isLoading } = useQuery<ApiKey[]>({
    queryKey: ["/api/api-keys"],
  });

  const createApiKeyMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      const response = await apiRequest("POST", "/api/api-keys", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "API Key Created",
        description: "Your new API key has been generated. Copy it now as it won't be shown again.",
      });
      setShowNewKey(data.key);
      setNewKeyName("");
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteApiKeyMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/api-keys/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "API Key Deactivated",
        description: "The API key has been deactivated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Deactivation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    createApiKeyMutation.mutate({ name: newKeyName.trim() });
  };

  const handleDeleteApiKey = (id: string) => {
    deleteApiKeyMutation.mutate(id);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "API key copied to clipboard",
    });
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleKeyVisibility = (keyId: string) => {
    const newVisibleKeys = new Set(visibleKeys);
    if (newVisibleKeys.has(keyId)) {
      newVisibleKeys.delete(keyId);
    } else {
      newVisibleKeys.add(keyId);
    }
    setVisibleKeys(newVisibleKeys);
  };

  const maskKey = (key: string) => {
    return key.substring(0, 8) + "..." + key.substring(key.length - 4);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center" data-testid="text-loading-api-keys">Loading API keys...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* New API Key Display */}
      {showNewKey && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center space-x-2">
              <Key className="h-5 w-5" />
              <span>New API Key Created</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-green-700">
                Copy this key now. For security reasons, it won't be shown again.
              </p>
              <div className="flex items-center space-x-2 p-3 bg-white rounded border">
                <code className="flex-1 text-sm font-mono" data-testid="text-new-api-key">
                  {showNewKey}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(showNewKey)}
                  data-testid="button-copy-new-key"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowNewKey(null)}
                data-testid="button-dismiss-new-key"
              >
                I've copied it
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create API Key */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Key className="h-5 w-5" />
              <span>API Key Management</span>
            </span>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-api-key">
                  <Plus className="h-4 w-4 mr-2" />
                  Create API Key
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New API Key</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateApiKey} className="space-y-4">
                  <div>
                    <Label htmlFor="key-name">Key Name</Label>
                    <Input
                      id="key-name"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="e.g., Production Website, Mobile App"
                      data-testid="input-api-key-name"
                      required
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Choose a descriptive name to identify where this key will be used.
                    </p>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createApiKeyMutation.isPending || !newKeyName.trim()}
                      data-testid="button-generate-api-key"
                    >
                      {createApiKeyMutation.isPending ? "Creating..." : "Generate Key"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            API keys allow external applications to initiate payments through OnionPay. Keep them secure and never share them publicly.
          </p>
          
          {apiKeys.length === 0 ? (
            <div className="text-center py-8" data-testid="text-no-api-keys">
              <Key className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No API keys found</p>
              <p className="text-sm text-muted-foreground">Create your first API key to start accepting payments</p>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground" data-testid="text-existing-api-keys-title">
                Existing API Keys ({apiKeys.length})
              </h3>
              {apiKeys.map((apiKey) => (
                <Card key={apiKey.id} className="border-border" data-testid={`card-api-key-${apiKey.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium" data-testid={`text-api-key-name-${apiKey.id}`}>
                            {apiKey.name}
                          </span>
                          <Badge variant="secondary">Active</Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                            {visibleKeys.has(apiKey.id) ? apiKey.keyHash : maskKey(apiKey.keyHash)}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleKeyVisibility(apiKey.id)}
                            data-testid={`button-toggle-key-visibility-${apiKey.id}`}
                          >
                            {visibleKeys.has(apiKey.id) ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(apiKey.keyHash)}
                            data-testid={`button-copy-key-${apiKey.id}`}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div data-testid={`text-api-key-created-${apiKey.id}`}>
                            Created: {formatDate(apiKey.createdAt)}
                          </div>
                          {apiKey.lastUsedAt && (
                            <div data-testid={`text-api-key-last-used-${apiKey.id}`}>
                              Last used: {formatDate(apiKey.lastUsedAt)}
                            </div>
                          )}
                          {!apiKey.lastUsedAt && (
                            <div className="text-yellow-600" data-testid={`text-api-key-never-used-${apiKey.id}`}>
                              Never used
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteApiKey(apiKey.id)}
                        disabled={deleteApiKeyMutation.isPending}
                        data-testid={`button-delete-api-key-${apiKey.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Integration Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">1. Initiate Payment</h4>
              <div className="bg-muted p-3 rounded text-sm font-mono">
                <div>POST /api/onionpay/initiate</div>
                <div className="text-muted-foreground mt-1">Authorization: Bearer YOUR_API_KEY</div>
                <div className="text-muted-foreground">
                  {"{"}<br />
                  &nbsp;&nbsp;"productId": "product_id",<br />
                  &nbsp;&nbsp;"description": "Payment for Product",<br />
                  &nbsp;&nbsp;"customerEmail": "customer@example.com"<br />
                  {"}"}
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">2. Check Payment Status</h4>
              <div className="bg-muted p-3 rounded text-sm font-mono">
                <div>GET /api/onionpay/status/[orderId]</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}