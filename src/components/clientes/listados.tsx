import Link from "next/link";
import { EstadoVacio } from "@/components/estados";
import { Estado } from "@/components/insignia";
import { CampoFiltro, EncabezadoPagina, Panel } from "@/components/pagina";
import { claseCampo } from "@/components/acceso/estilos";
import { FormularioCliente } from "@/components/clientes/formularios";
import { Fila, Grilla, Pila, Texto } from "@/components/maquetacion";
import { Pestanas, pestanasClientes } from "@/components/pestanas";
import { cargarPagina, Paginacion, textoParametro } from "@/components/productos/listados";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { requirePageUser } from "@/lib/auth-request";
import { precioEnPesos as saldoEnPesos } from "@/lib/formatos";
import { listarClientes } from "@/services/clientes";

export { saldoEnPesos };

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
    <Grilla gap="lg">
      <EncabezadoPagina
        titulo="Clientes"
        descripcion={saldos ? "Clientes con saldo pendiente, de mayor a menor deuda." : undefined}
        acciones={!saldos && <FormularioCliente />}
      />

      <Pila gap="md">
        <Pestanas etiqueta="Secciones de clientes" pestanas={pestanasClientes} />
        <Panel className="overflow-hidden">
          <form action={ruta} method="get" className="border-b p-4 sm:p-5">
            <Fila gap="md" className="items-end">
              <div className="min-w-48 grow">
                <CampoFiltro etiqueta="Nombre o número de documento">
                  <input className={claseCampo} name="q" type="search" defaultValue={filtros.q} maxLength={150} />
                </CampoFiltro>
              </div>
              <Fila>
                <Button>Buscar</Button>
                {filtros.q && <Button asChild variant="ghost"><Link href={ruta} prefetch={false}>Limpiar</Link></Button>}
              </Fila>
            </Fila>
          </form>

          {saldos && (
            <Fila as="dl" gap="md" className="items-baseline justify-between border-b bg-tinta-50 px-4 py-3 sm:px-5">
              <Texto as="dt" tono="secundario" className="font-medium">Total adeudado del filtro</Texto>
              <dd className="angosta subrayado-doble pb-2 text-xl font-bold text-tapa">{saldoEnPesos(clientes.totalAdeudado ?? 0)}</dd>
            </Fila>
          )}
          {clientes.data.length === 0 ? (
            <EstadoVacio>
              {saldos ? "No hay saldos pendientes para esta búsqueda." : "No hay clientes que coincidan con la búsqueda."}
            </EstadoVacio>
          ) : (
            <Table aria-label={saldos ? "Clientes con saldo pendiente" : "Catálogo de clientes"}>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right" aria-sort={saldos ? "descending" : undefined}>Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientes.data.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell className="whitespace-normal">
                      <Link href={`/clientes/${cliente.id}`} prefetch={false} className="font-semibold break-words text-tapa hover:underline">
                        {cliente.nombre}
                      </Link>
                    </TableCell>
                    <TableCell>{cliente.tipoDoc} {cliente.nroDoc}</TableCell>
                    <TableCell><Estado activo={cliente.activo} /></TableCell>
                    <TableCell className={cliente.saldo > 0 ? "text-right font-semibold" : "text-right text-muted-foreground"}>
                      {saldoEnPesos(cliente.saldo)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <Paginacion ruta={ruta} filtros={filtros} pagina={clientes} />
        </Panel>
      </Pila>
    </Grilla>
  );
}
