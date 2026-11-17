import Link from "next/link";
import { claseCampo, clasePrincipal, claseSecundaria } from "@/components/acceso/estilos";
import { FormularioCliente } from "@/components/clientes/formularios";
import { cargarPagina, Estado, Paginacion, precioEnPesos, textoParametro } from "@/components/productos/listados";
import { Card } from "@/components/ui/card";
import type { requirePageUser } from "@/lib/auth-request";
import { listarClientes } from "@/services/clientes";

export function saldoEnPesos(centavos: number) {
  return (centavos < 0 ? "-" : "") + precioEnPesos(Math.abs(centavos));
}

export async function ListadoClientes({
  actor,
  q,
  page,
  pageSize,
  saldos = false,
}: {
  actor: Awaited<ReturnType<typeof requirePageUser>>;
  q: string | string[] | undefined;
  page: string | string[] | undefined;
  pageSize: string | string[] | undefined;
  saldos?: boolean;
}) {
  const ruta = saldos ? "/clientes/saldos" : "/clientes";
  const filtros = { q: textoParametro(q), pageSize: textoParametro(pageSize) };
  const clientes = await cargarPagina(ruta, filtros, () => listarClientes(actor, {
    ...filtros,
    page: textoParametro(page),
    ...(saldos ? { conDeuda: "true", orden: "saldo" } : {}),
  }));

  return (
    <section className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">{saldos ? "Saldos pendientes" : "Clientes"}</h1>
        {saldos ? (
          <Link href="/clientes" prefetch={false} className={claseSecundaria}>Volver a clientes</Link>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/clientes/saldos" prefetch={false} className={claseSecundaria}>Saldos pendientes</Link>
            <FormularioCliente />
          </div>
        )}
      </header>

      <Card className="gap-0 overflow-hidden py-0">
        <form action={ruta} method="get" className="flex flex-wrap items-end gap-3 border-b p-4 sm:p-5">
          <label className="grid min-w-48 grow gap-1.5 text-sm font-medium">
            Nombre o número de documento
            <input className={claseCampo} name="q" type="search" defaultValue={filtros.q} maxLength={150} />
          </label>
          <button className={clasePrincipal}>Buscar</button>
          {filtros.q && <Link href={ruta} prefetch={false} className={claseSecundaria}>Limpiar</Link>}
        </form>

        {saldos && (
          <div className="flex flex-wrap justify-between gap-2 border-b p-4 font-semibold sm:p-5">
            <span>Total adeudado del filtro</span>
            <span className="tabular-nums">{saldoEnPesos(clientes.totalAdeudado ?? 0)}</span>
          </div>
        )}
        {clientes.data.length === 0 ? (
          <p className="p-5 text-muted-foreground">
            {saldos ? "No hay saldos pendientes para esta búsqueda." : "No hay clientes que coincidan con la búsqueda."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table aria-label={saldos ? "Clientes con saldo pendiente" : "Catálogo de clientes"} className="w-full text-left text-sm">
              <thead className="border-b bg-background text-muted-foreground [&_th]:px-4 [&_th]:py-3">
                <tr>
                  <th scope="col">Nombre</th>
                  <th scope="col">Documento</th>
                  <th scope="col">Estado</th>
                  <th scope="col" className="text-right" aria-sort={saldos ? "descending" : undefined}>Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y [&_td]:px-4 [&_td]:py-3">
                {clientes.data.map((cliente) => (
                  <tr key={cliente.id}>
                    <td>
                      <Link
                        href={`/clientes/${cliente.id}`}
                        prefetch={false}
                        className="font-semibold break-words text-primary underline"
                      >
                        {cliente.nombre}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap">{cliente.tipoDoc} {cliente.nroDoc}</td>
                    <td><Estado activo={cliente.activo} /></td>
                    <td className="text-right whitespace-nowrap tabular-nums">{saldoEnPesos(cliente.saldo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Paginacion ruta={ruta} filtros={filtros} pagina={clientes} />
      </Card>
    </section>
  );
}
