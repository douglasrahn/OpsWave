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
    const loadClient = async () => {
      try {
        const response = await fetch(`/api/clients/${params.id}`);
        if (response.ok) {
          const client = await response.json();
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
      } catch (error) {
        console.error('Error loading client:', error);
        toast({
          title: "Error",
          description: "Failed to load client data",
          variant: "destructive",
        });
      }
    };

    loadClient();
  }, [params.id, form, toast]);

  const onSubmit = async (data: ClientFormData) => {
    setIsLoading(true);
    try {
      const endpoint = isNewClient ? '/api/clients' : `/api/clients/${params.id}`;
      const method = isNewClient ? 'POST' : 'PATCH';

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          users: isNewClient ? [] : undefined
        }),
      });

      if (!response.ok) {
        throw new Error(isNewClient ? "Failed to create client" : "Failed to update client");
      }

      toast({
        title: "Success",
        description: isNewClient ? "Client created successfully" : "Client updated successfully",
      });
      setLocation("/user-management");
    } catch (error) {
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