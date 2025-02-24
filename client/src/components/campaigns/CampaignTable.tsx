import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

interface Campaign {
  id: string;
  campaignName: string;
  companyName?: string;
  contactFirstName?: string | null;
  contactLastName?: string | null;
  pastDueAmount?: number | null;
  createdAt: string;
}

interface CampaignTableProps {
  campaigns: Campaign[];
}

export function CampaignTable({ campaigns }: CampaignTableProps) {
  if (campaigns.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No campaigns found. Create a new campaign to get started.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Campaign Name</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Past Due Amount</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {campaigns.map((campaign) => (
          <TableRow key={campaign.id}>
            <TableCell className="font-medium">{campaign.campaignName}</TableCell>
            <TableCell>{campaign.companyName || 'Not Set'}</TableCell>
            <TableCell>
              {campaign.contactFirstName || campaign.contactLastName 
                ? `${campaign.contactFirstName || ''} ${campaign.contactLastName || ''}`.trim()
                : 'Not Set'}
            </TableCell>
            <TableCell>
              {campaign.pastDueAmount != null 
                ? `$${campaign.pastDueAmount.toFixed(2)}`
                : 'Not Set'}
            </TableCell>
            <TableCell>
              {format(new Date(campaign.createdAt), 'MMM d, yyyy')}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}