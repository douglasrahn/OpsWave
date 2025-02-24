import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { FileSpreadsheet } from "lucide-react";

interface Campaign {
  id: string;
  campaignName: string;
  createdAt: string;
  //Other fields remain here, accessible through raw data editor
  companyName?: string;
  contactFirstName?: string | null;
  contactLastName?: string | null;
  pastDueAmount?: number | null;

}

interface CampaignTableProps {
  campaigns: Campaign[];
}

export function CampaignTable({ campaigns }: CampaignTableProps) {
  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <FileSpreadsheet className="h-12 w-12 mb-4" />
        <p className="text-lg font-medium">No campaigns yet</p>
        <p className="text-sm">Create a new campaign to get started.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[400px]">Campaign Name</TableHead>
            <TableHead className="w-[200px]">Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign) => (
            <TableRow key={campaign.id}>
              <TableCell className="font-medium">{campaign.campaignName}</TableCell>
              <TableCell>
                {format(new Date(campaign.createdAt), 'MMM d, yyyy')}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}