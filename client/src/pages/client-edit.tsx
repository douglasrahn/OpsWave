import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Import the JSON file directly
import clientsData from "../../../server/data/clients.json";

const clientSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  companyName: z.string().min(1, "Company name is required"),
  url: z.string().url("Must be a valid URL"),
});

type ClientFormData = z.infer<typeof clientSchema>;

export default function ClientEditPage({ params }: { params: { id: string } }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isNewClient, setIsNewClient] = useState(false);

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      clientId: params.id,
      companyName: "",
      url: "",
    },
  });

  useEffect(() => {
    // Find the client in our JSON data
    const client = clientsData.clients.find(c => c.clientId === params.id);
    console.log('[Client Edit] Loading client data:', client);

    if (client) {
      // Existing client - populate form
      form.reset({
        clientId: client.clientId,
        companyName: client.companyName,
        url: client.url,
      });
    } else {
      // New client
      setIsNewClient(true);
      form.reset({
        clientId: params.id,
        companyName: "",
        url: "",
      });
    }
  }, [params.id, form]);

  const onSubmit = async (data: ClientFormData) => {
    setIsLoading(true);
    try {
      console.log('[Client Edit] Submitting data:', data);
      console.log('[Client Edit] isNewClient:', isNewClient);

      const endpoint = isNewClient ? '/api/clients' : `/api/clients/${params.id}`;
      const method = isNewClient ? 'POST' : 'PATCH';

      console.log('[Client Edit] Making request to:', endpoint, 'with method:', method);

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          users: isNewClient ? [] : undefined // Only include empty users array for new clients
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || (isNewClient ? "Failed to create client" : "Failed to update client"));
      }

      const savedData = await response.json();
      console.log('[Client Edit] Server response:', savedData);

      toast({
        title: "Success",
        description: isNewClient ? "Client created successfully" : "Client updated successfully",
      });
      setLocation("/user-management");
    } catch (error) {
      console.error('[Client Edit] Error saving client:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save client",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{isNewClient ? "Create Client" : "Edit Client"}</h1>
        <p className="text-muted-foreground mt-2">
          {isNewClient ? "Add a new client to the system" : "Update client information"}
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Client Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client ID</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website URL</FormLabel>
                    <FormControl>
                      <Input {...field} type="url" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : (isNewClient ? "Create Client" : "Save Changes")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/user-management")}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}