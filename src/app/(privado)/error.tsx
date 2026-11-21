"use client";

import { useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function ErrorPrivado({ retry }: { retry: () => void }) {
  const [reintentando, iniciar] = useTransition();

  return (
    <Alert variant="destructive" className="grid gap-3 p-5">
      <p className="font-semibold">No se pudo cargar la información.</p>
      <Button variant="outline" className="w-fit text-foreground" disabled={reintentando}
        onClick={() => iniciar(retry)}>
        {reintentando ? "Reintentando…" : "Reintentar"}
      </Button>
    </Alert>
  );
}
