import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Edit, Trash2, Plus } from "lucide-react";

export default function ProductManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
  });

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/products", {
        ...data,
        price: parseInt(data.price) * 100, // Convert to paise
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Product Created",
        description: "Product has been created successfully.",
      });
      setFormData({ name: "", description: "", price: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
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
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await apiRequest("DELETE", `/api/products/${productId}`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Product Deleted",
        description: "Product has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
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
        title: "Deletion Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      toast({
        title: "Validation Error",
        description: "Name and price are required.",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Add Product Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center" data-testid="text-add-product-title">
            <Plus className="h-5 w-5 mr-2" />
            Add New Product
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                Product Name
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter product name"
                data-testid="input-product-name"
              />
            </div>
            <div>
              <Label htmlFor="price" className="block text-sm font-medium text-foreground mb-2">
                Price (₹)
              </Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                placeholder="0"
                min="1"
                data-testid="input-product-price"
              />
            </div>
            <div>
              <Label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Product description"
                rows={3}
                data-testid="textarea-product-description"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={createMutation.isPending}
              data-testid="button-add-product"
            >
              {createMutation.isPending ? "Adding..." : "Add Product"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Existing Products */}
      <Card>
        <CardHeader>
          <CardTitle data-testid="text-existing-products-title">Existing Products</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8" data-testid="text-loading-products">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-no-products">
              No products found. Create your first product above.
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((product: any) => (
                <div 
                  key={product.id} 
                  className="flex items-center justify-between p-4 bg-muted/20 rounded-md"
                  data-testid={`card-product-${product.id}`}
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground" data-testid={`text-product-name-${product.id}`}>
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="text-sm text-muted-foreground" data-testid={`text-product-description-${product.id}`}>
                        {product.description}
                      </p>
                    )}
                    <p className="text-lg font-semibold text-primary" data-testid={`text-product-price-${product.id}`}>
                      ₹{(product.price / 100).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      data-testid={`button-edit-product-${product.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => deleteMutation.mutate(product.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-product-${product.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
