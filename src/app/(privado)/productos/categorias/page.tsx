import Link from "next/link";
import { CambiarEstado, FormularioCategoria } from "@/components/productos/formularios";
import { Estado } from "@/components/productos/listados";
import { Card } from "@/components/ui/card";
import { requirePageUser } from "@/lib/auth-request";
import { listarCategorias } from "@/services/productos";

export const metadata = { title: "Categorías | Gestión comercial" };

export default async function Categorias() {
  const actor = await requirePageUser();
  const admin = actor.rol === "admin";
  const categorias = await listarCategorias(actor, admin);

  return (
    <section className="grid gap-6">
      <header className="grid gap-3">
        <Link href="/productos" prefetch={false} className="w-fit text-sm font-medium text-primary underline">
          Volver a productos
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">Categorías</h1>
          {admin && <FormularioCategoria />}
        </div>
      </header>
      <Card className="gap-0 py-0">
        {categorias.length === 0 ? (
          <p className="p-5 text-muted-foreground">No hay categorías para mostrar.</p>
        ) : (
          <ul aria-label="Categorías de productos" className="divide-y">
            {categorias.map((categoria) => (
              <li
                key={categoria.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_6rem_auto] sm:px-5"
              >
                <h2 className="font-semibold break-words">{categoria.nombre}</h2>
                <div><Estado activo={categoria.activa} femenino /></div>
                {admin && (
                  <div className="col-span-2 flex flex-wrap gap-2 sm:col-span-1">
                    <FormularioCategoria categoria={categoria} />
                    <CambiarEstado categoria={categoria} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}
