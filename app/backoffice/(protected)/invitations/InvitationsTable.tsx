"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { useDisclosure } from "@heroui/use-disclosure";
import { Edit, Trash2 } from "lucide-react";
import { Invitation, InvitationWithTokens } from "./types";
import EditInvitationModal from "@/components/EditInvitationModal";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { formatDate } from "@/utils/date";

interface InvitationsTableProps {
  invitations: InvitationWithTokens[];
  searchTerm: string;
}

export default function InvitationsTable({
  invitations,
  searchTerm,
}: InvitationsTableProps) {
  const router = useRouter();
  const [selectedInvitation, setSelectedInvitation] =
    useState<Invitation | null>(null);
  const [invitationToDelete, setInvitationToDelete] = useState<{
    id: string;
    guestName: string;
  } | null>(null);

  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  const handleRowClick = (invitation: InvitationWithTokens) => {
    router.push(`/backoffice/invitations/${invitation.id}`);
  };

  // Prefetch on hover para mejor perceived performance (bundle-preload pattern)
  const handleRowHover = (invitationId: string) => {
    router.prefetch(`/backoffice/invitations/${invitationId}`);
  };

  const getStatusChip = (invitation: InvitationWithTokens) => {
    // Si no tiene tokens, está en estado "No enviado"
    if (!invitation.tokens || invitation.tokens.length === 0) {
      return (
        <Chip color="default" variant="flat" size="sm">
          No enviado
        </Chip>
      );
    }

    // Verificar si tiene tokens activos
    const activeTokens = invitation.tokens.filter((token) => token.isActive);

    // Si no hay tokens activos, está en estado "No enviado"
    if (activeTokens.length === 0) {
      return (
        <Chip color="default" variant="flat" size="sm">
          No enviado
        </Chip>
      );
    }

    // Verificar si algún token fue usado (firstAccessAt no es null)
    const hasUsedToken = activeTokens.some(
      (token) => token.firstAccessAt !== null,
    );

    // Si no tiene tokens usados, está "Enviado" pero no accedido
    if (!hasUsedToken) {
      return (
        <Chip
          color="primary"
          variant="flat"
          size="sm"
          className="bg-blue-100 text-blue-700"
        >
          Enviado
        </Chip>
      );
    }

    // Si tiene token usado pero no ha respondido, está "Pendiente"
    if (!invitation.hasResponded) {
      return (
        <Chip
          color="warning"
          variant="flat"
          size="sm"
          className="bg-amber-100 text-amber-700"
        >
          Pendiente
        </Chip>
      );
    }

    // Si ha respondido, verificar si confirmó o rechazó
    if (invitation.isAttending === true) {
      return (
        <Chip
          color="success"
          variant="flat"
          size="sm"
          className="bg-green-100 text-green-700"
        >
          Confirmado
        </Chip>
      );
    }

    if (invitation.isAttending === false) {
      return (
        <Chip
          color="danger"
          variant="flat"
          size="sm"
          className="bg-red-100 text-red-700"
        >
          Rechazado
        </Chip>
      );
    }

    // Fallback (no debería llegar aquí normalmente)
    return (
      <Chip
        color="warning"
        variant="flat"
        size="sm"
        className="bg-amber-100 text-amber-700"
      >
        Pendiente
      </Chip>
    );
  };

  const handleEditInvitation = (invitation: InvitationWithTokens) => {
    setSelectedInvitation(invitation);
    onEditOpen();
  };

  const handleDeleteInvitation = (invitation: InvitationWithTokens) => {
    setInvitationToDelete({
      id: invitation.id,
      guestName: invitation.guestName,
    });
    onDeleteOpen();
  };

  const handleInvitationUpdated = () => {
    // Recargar la página para obtener datos actualizados
    router.refresh();
    setSelectedInvitation(null);
    onEditClose();
  };

  const handleInvitationDeleted = () => {
    // Recargar la página para obtener datos actualizados
    router.refresh();
    setInvitationToDelete(null);
    onDeleteClose();
  };

  return (
    <>
      {/* Vista móvil compacta */}
      <div className="block md:hidden">
        <Card className="mb-6">
          <CardBody className="p-0">
            <Table
              aria-label="Tabla de invitaciones móvil"
              classNames={{
                wrapper: "min-h-[400px] max-h-[600px]",
                th: "text-default-500 border-b border-divider bg-default-50",
                td: "border-b border-divider",
                tr: "hover:bg-default-50 transition-colors",
                tbody: "divide-y divide-divider",
              }}
              selectionMode="none"
            >
              <TableHeader>
                <TableColumn className="text-left">INVITADO</TableColumn>
                <TableColumn className="text-center">ESTADO</TableColumn>
                <TableColumn className="text-center">ACCIONES</TableColumn>
              </TableHeader>
              <TableBody
                emptyContent={
                  <div className="text-center py-8">
                    <p className="text-default-500">
                      {searchTerm
                        ? "No se encontraron invitaciones que coincidan con la búsqueda"
                        : "No hay invitaciones registradas"}
                    </p>
                  </div>
                }
              >
                {invitations.map((invitation) => (
                  <TableRow
                    key={invitation.id}
                    className="cursor-pointer"
                    onClick={() => handleRowClick(invitation)}
                    onMouseEnter={() => handleRowHover(invitation.id)}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium text-foreground">
                          {invitation.guestName}
                        </div>
                        {invitation.guestNickname ? (
                          <div className="text-sm text-default-500">
                            &ldquo;{invitation.guestNickname}&rdquo;
                          </div>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        {getStatusChip(invitation)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="sm"
                          variant="light"
                          color="primary"
                          isIconOnly
                          onClick={(event) => {
                            event.stopPropagation();
                            handleEditInvitation(invitation);
                          }}
                          className="text-default-400 hover:text-primary"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="light"
                          color="danger"
                          isIconOnly
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteInvitation(invitation);
                          }}
                          className="text-default-400 hover:text-danger"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </div>

      {/* Vista desktop */}
      <div className="hidden md:block">
        <Card className="mb-6">
          <CardBody className="p-0">
            <Table
              aria-label="Tabla de invitaciones"
              classNames={{
                wrapper: "min-h-[400px] max-h-[600px]",
                th: "text-default-500 border-b border-divider bg-default-50",
                td: "border-b border-divider",
                tr: "hover:bg-default-50 transition-colors",
                tbody: "divide-y divide-divider",
              }}
              selectionMode="none"
            >
              <TableHeader>
                <TableColumn className="text-left">INVITADO</TableColumn>
                <TableColumn className="text-left">TELÉFONO</TableColumn>
                <TableColumn className="text-center">ESTADO</TableColumn>
                <TableColumn className="text-center">CONFIRMADOS</TableColumn>
                <TableColumn className="text-center">
                  MÁX. INVITADOS
                </TableColumn>
                <TableColumn className="text-center">
                  FECHA RESPUESTA
                </TableColumn>
                <TableColumn className="text-center">ACCIONES</TableColumn>
              </TableHeader>
              <TableBody
                emptyContent={
                  <div className="text-center py-8">
                    <p className="text-default-500">
                      {searchTerm
                        ? "No se encontraron invitaciones que coincidan con la búsqueda"
                        : "No hay invitaciones registradas"}
                    </p>
                  </div>
                }
              >
                {invitations.map((invitation) => (
                  <TableRow
                    key={invitation.id}
                    className="cursor-pointer"
                    onClick={() => handleRowClick(invitation)}
                    onMouseEnter={() => handleRowHover(invitation.id)}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium text-foreground">
                          {invitation.guestName}
                        </div>
                        {invitation.guestNickname ? (
                          <div className="text-sm text-default-500">
                            &ldquo;{invitation.guestNickname}&rdquo;
                          </div>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-default-600">
                        {invitation.guestPhone || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        {getStatusChip(invitation)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <span className="font-medium text-foreground">
                          {invitation.guestCount || "-"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <span className="font-medium text-foreground">
                          {invitation.maxGuests}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <span className="text-default-600">
                          {formatDate(invitation.respondedAt)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="sm"
                          variant="light"
                          color="primary"
                          isIconOnly
                          onClick={(event) => {
                            event.stopPropagation();
                            handleEditInvitation(invitation);
                          }}
                          className="text-default-400 hover:text-primary"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="light"
                          color="danger"
                          isIconOnly
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteInvitation(invitation);
                          }}
                          className="text-default-400 hover:text-danger"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </div>

      {/* Modales */}
      <EditInvitationModal
        isOpen={isEditOpen}
        onClose={onEditClose}
        onSuccess={handleInvitationUpdated}
        invitation={selectedInvitation}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        onSuccess={handleInvitationDeleted}
        invitation={invitationToDelete}
      />
    </>
  );
}
