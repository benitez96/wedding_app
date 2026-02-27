import Link from "next/link";
import { Button } from "@heroui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-default-300">404</h1>
        <h2 className="text-xl font-semibold text-foreground mt-2">
          Pagina no encontrada
        </h2>
        <p className="text-default-500 mt-2 max-w-md">
          La pagina que buscas no existe o fue movida.
        </p>
      </div>
      <div className="flex gap-3">
        <Button as={Link} href="/" color="primary">
          Ir al inicio
        </Button>
        <Button as={Link} href="/backoffice" variant="bordered">
          Ir al backoffice
        </Button>
      </div>
    </div>
  );
}
