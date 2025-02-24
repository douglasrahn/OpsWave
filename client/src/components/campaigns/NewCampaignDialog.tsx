import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

const campaignSchema = z.object({
  campaignName: z.string().min(1, "Campaign name is required"),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

export function NewCampaignDialog() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      campaignName: "",
    }
  });

  const onSubmit = async (data: CampaignFormData) => {
    try {
      // Create new campaign document with minimal data
      const docRef = await addDoc(collection(db, "campaigns"), {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      console.log("Created new campaign with ID:", docRef.id);

      toast({
        title: "Campaign created successfully",
        description: "You can now add details through CSV upload or raw data editor"
      });

      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      form.reset();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create campaign";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Campaign
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Campaign</DialogTitle>
          <DialogDescription>
            Enter a name for the new collection campaign. You can add contact details and other information later through CSV upload or the raw data editor.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Input
              placeholder="Campaign Name"
              {...form.register("campaignName")}
            />
            <Button type="submit" className="w-full">Create Campaign</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}