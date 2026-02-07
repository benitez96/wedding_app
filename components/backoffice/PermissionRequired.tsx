import { Card, CardBody } from "@heroui/card";
import { ShieldAlert } from "lucide-react";
import { Button } from "@heroui/button";
import Link from "next/link";

interface PermissionRequiredProps {
  permission: string;
  message?: string;
}

/**
 * Componente que se muestra cuando un usuario no tiene permisos
 * para acceder a una funcionalidad específica.
 */
export default function PermissionRequired({
  permission,
  message = "No tienes permisos para acceder a esta sección",
}: PermissionRequiredProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md">
        <CardBody className="text-center space-y-4 p-8">
          <ShieldAlert className="mx-auto text-warning" size={64} />
          <div>
            <h2 className="text-xl font-bold mb-2">Acceso Restringido</h2>
            <p className="text-default-600">{message}</p>
          </div>
          <div className="bg-default-100 rounded-lg p-4">
            <p className="text-sm text-default-500">
              Permiso requerido: <code className="font-mono">{permission}</code>
            </p>
          </div>
          <div className="pt-4">
            <Button
              as={Link}
              href="/backoffice/dashboard"
              color="primary"
              variant="flat"
            >
              Volver al Dashboard
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
