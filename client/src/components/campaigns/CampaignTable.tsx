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
  companyName: string;
  contactFirstName: string | null;
  contactLastName: string | null;
  pastDueAmount: number | null;
  createdAt: string;
}

interface CampaignTableProps {
  campaigns: Campaign[];
}

export function CampaignTable({ campaigns }: CampaignTableProps) {
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
            <TableCell>{campaign.campaignName}</TableCell>
            <TableCell>{campaign.companyName || 'N/A'}</TableCell>
            <TableCell>
              {campaign.contactFirstName || campaign.contactLastName 
                ? `${campaign.contactFirstName || ''} ${campaign.contactLastName || ''}`
                : 'N/A'}
            </TableCell>
            <TableCell>
              {campaign.pastDueAmount !== null 
                ? `$${campaign.pastDueAmount.toFixed(2)}`
                : 'N/A'}
            </TableCell>
            <TableCell>
              {campaign.createdAt ? format(new Date(campaign.createdAt), 'MMM d, yyyy') : 'N/A'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}