import { Card } from "@/components/ui/card";

export default function Inicio() {
  return (
    <main className="grid min-h-dvh place-items-center px-5 py-12 sm:px-8">
      <Card className="w-full max-w-xl gap-4 border-t-4 border-t-primary px-6 py-8 sm:px-10 sm:py-10">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Gestión comercial
        </h1>
        <p className="max-w-sm leading-relaxed text-muted-foreground">
          Sistema para gestionar las ventas, el stock y las cuentas corrientes
          de un comercio.
        </p>
      </Card>
    </main>
  );
}
