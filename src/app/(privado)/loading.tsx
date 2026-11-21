import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Cargando() {
  return (
    <Card className="gap-3 p-5" role="status">
      <p className="text-sm text-muted-foreground">Cargando…</p>
      <Skeleton className="h-5 w-1/3" aria-hidden="true" />
      <Skeleton className="h-8 w-full" aria-hidden="true" />
      <Skeleton className="h-8 w-full" aria-hidden="true" />
    </Card>
  );
}
