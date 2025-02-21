import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";

interface Client {
  id: string;
  companyName: string;
  url: string;
  collections: boolean;
  salesQualifier: boolean;
  survey: boolean;
}

interface SubscriptionTableProps {
  clients: Client[];
  onToggleSubscription: (clientId: string, service: string, value: boolean) => void;
}

export function SubscriptionTable({ clients, onToggleSubscription }: SubscriptionTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Company Name</TableHead>
          <TableHead>URL</TableHead>
          <TableHead>Collections</TableHead>
          <TableHead>Sales Qualifier</TableHead>
          <TableHead>Survey</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((client) => (
          <TableRow key={client.id}>
            <TableCell>{client.companyName}</TableCell>
            <TableCell>{client.url}</TableCell>
            <TableCell>
              <Switch
                checked={client.collections}
                onCheckedChange={(checked) => 
                  onToggleSubscription(client.id, "collections", checked)
                }
              />
            </TableCell>
            <TableCell>
              <Switch
                checked={client.salesQualifier}
                onCheckedChange={(checked) =>
                  onToggleSubscription(client.id, "salesQualifier", checked)
                }
              />
            </TableCell>
            <TableCell>
              <Switch
                checked={client.survey}
                onCheckedChange={(checked) =>
                  onToggleSubscription(client.id, "survey", checked)
                }
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
