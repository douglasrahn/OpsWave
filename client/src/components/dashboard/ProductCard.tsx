import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  title: string;
  description: string;
  isComingSoon?: boolean;
  onClick?: () => void;
}

export function ProductCard({ title, description, isComingSoon, onClick }: ProductCardProps) {
  return (
    <Card 
      className={`cursor-pointer transition-transform hover:scale-105 ${isComingSoon ? 'opacity-75' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        {isComingSoon && (
          <Badge variant="secondary">Coming Soon</Badge>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
