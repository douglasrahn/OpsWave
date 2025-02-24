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
  companyName: z.string().min(1, "Company name is required"),
  contactFirstName: z.string().optional().nullable(),
  contactLastName: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  companyAddress1: z.string().optional().nullable(),
  companyAddress2: z.string().optional().nullable(),
  companyCity: z.string().optional().nullable(),
  companyState: z.string().optional().nullable(),
  companyZip: z.string().optional().nullable(),
  companyPhone: z.string().optional().nullable(),
  pastDueAmount: z.number().min(0, "Amount must be positive"),
  previousNotes: z.string().optional().nullable(),
  log: z.string().optional().nullable()
});

type CampaignFormData = z.infer<typeof campaignSchema>;

export function NewCampaignDialog() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      campaignName: "",
      companyName: "",
      contactFirstName: "",
      contactLastName: "",
      contactPhone: "",
      companyAddress1: "",
      companyAddress2: "",
      companyCity: "",
      companyState: "",
      companyZip: "",
      companyPhone: "",
      pastDueAmount: 0,
      previousNotes: "",
      log: ""
    }
  });

  const onSubmit = async (data: CampaignFormData) => {
    try {
      await addDoc(collection(db, "campaigns"), {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      toast({
        title: "Campaign created successfully"
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
            Enter the details for the new collection campaign.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Input
              placeholder="Campaign Name"
              {...form.register("campaignName")}
            />
            <Input
              placeholder="Company Name"
              {...form.register("companyName")}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Contact First Name"
                {...form.register("contactFirstName")}
              />
              <Input
                placeholder="Contact Last Name"
                {...form.register("contactLastName")}
              />
            </div>
            <Input
              placeholder="Contact Phone"
              {...form.register("contactPhone")}
            />
            <Input
              placeholder="Past Due Amount"
              type="number"
              step="0.01"
              {...form.register("pastDueAmount", { valueAsNumber: true })}
            />
            <Input
              placeholder="Previous Notes"
              {...form.register("previousNotes")}
            />
            <Button type="submit">Create Campaign</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}