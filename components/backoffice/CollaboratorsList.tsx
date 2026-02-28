"use client";

import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Avatar } from "@heroui/avatar";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { useDisclosure } from "@heroui/use-disclosure";
import { Spinner } from "@heroui/spinner";
import { UserPlus, Pencil, Trash2 } from "lucide-react";
import InviteCollaboratorModal from "./InviteCollaboratorModal";
import EditPermissionsModal from "./EditPermissionsModal";
import {
  getEventCollaborators,
  removeCollaborator,
} from "@/app/actions/collaborators";
import { PERMISSION_PRESETS } from "@/lib/permissions";
import { logError } from "@/lib/logger";

interface Collaborator {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userImage: string | null;
  permissions: string;
  invitedAt: string;
  invitedBy: string;
}

// TODO i18n: preset labels ("Cliente")
function getPresetLabel(permissions: bigint): string | null {
  if (permissions === PERMISSION_PRESETS.ADMIN) return "Admin";
  if (permissions === PERMISSION_PRESETS.EDITOR) return "Editor";
  if (permissions === PERMISSION_PRESETS.VIEWER) return "Viewer";
  if (permissions === PERMISSION_PRESETS.CLIENT) return "Cliente";
  return null;
}

export default function CollaboratorsList() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingMember, setEditingMember] = useState<Collaborator | null>(null);

  const inviteModal = useDisclosure();
  const editModal = useDisclosure();

  const loadCollaborators = async () => {
    setIsLoading(true);
    try {
      const result = await getEventCollaborators();
      if (result.success && result.data) {
        setCollaborators(result.data);
      }
    } catch (error) {
      logError("Error loading collaborators", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCollaborators();
  }, []);

  const handleRemove = async (memberId: string) => {
    // TODO i18n: confirm message
    if (!confirm("¿Estás seguro de revocar el acceso a este colaborador?")) {
      return;
    }

    try {
      const result = await removeCollaborator(memberId);
      if (result.success) {
        loadCollaborators();
      }
    } catch (error) {
      logError("Error removing collaborator", error);
    }
  };

  const handleEdit = (member: Collaborator) => {
    setEditingMember(member);
    editModal.onOpen();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        {/* TODO i18n: "Colaboradores" */}
        <h2 className="text-lg font-semibold">Colaboradores</h2>
        <Button
          color="primary"
          startContent={<UserPlus className="w-4 h-4" />}
          onPress={inviteModal.onOpen}
          size="sm"
        >
          {/* TODO i18n: "Invitar" */}
          Invitar
        </Button>
      </div>

      {collaborators.length === 0 ? (
        <div className="text-center py-8 text-default-400">
          {/* TODO i18n: empty state messages */}
          <p>No hay colaboradores en este evento.</p>
          <p className="text-sm mt-1">
            Invita a otros usuarios para que colaboren contigo.
          </p>
        </div>
      ) : (
        // TODO i18n: aria-label
        <Table aria-label="Lista de colaboradores">
          <TableHeader>
            {/* TODO i18n: column headers */}
            <TableColumn>Usuario</TableColumn>
            <TableColumn>Rol</TableColumn>
            <TableColumn>Invitado</TableColumn>
            <TableColumn>Acciones</TableColumn>
          </TableHeader>
          <TableBody>
            {collaborators.map((member) => {
              const permBigInt = BigInt(member.permissions);
              const presetLabel = getPresetLabel(permBigInt);

              return (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={member.userImage ?? undefined}
                        name={member.userName}
                        size="sm"
                      />
                      <div>
                        <p className="text-sm font-medium">{member.userName}</p>
                        <p className="text-xs text-default-400">
                          {member.userEmail}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {presetLabel ? (
                      <Chip size="sm" variant="flat" color="primary">
                        {presetLabel}
                      </Chip>
                    ) : (
                      <Chip size="sm" variant="flat">
                        {/* TODO i18n: "Personalizado" */}
                        Personalizado
                      </Chip>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-default-400">
                      {new Date(member.invitedAt).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handleEdit(member)}
                        // TODO i18n: aria-label
                        aria-label="Editar permisos"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="danger"
                        onPress={() => handleRemove(member.id)}
                        // TODO i18n: aria-label
                        aria-label="Revocar acceso"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <InviteCollaboratorModal
        isOpen={inviteModal.isOpen}
        onClose={inviteModal.onClose}
        onSuccess={loadCollaborators}
      />

      {editingMember && (
        <EditPermissionsModal
          isOpen={editModal.isOpen}
          onClose={() => {
            editModal.onClose();
            setEditingMember(null);
          }}
          onSuccess={loadCollaborators}
          memberId={editingMember.id}
          memberName={editingMember.userName}
          currentPermissions={editingMember.permissions}
        />
      )}
    </div>
  );
}
