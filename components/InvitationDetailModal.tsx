"use client";

import { useRouter } from "next/navigation";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/modal";
import { Button } from "@heroui/button";
import { useDisclosure } from "@heroui/use-disclosure";
import { Edit } from "lucide-react";
import InvitationInfoCard from "./InvitationDetailModal/InvitationInfoCard";
import RSVPResponseCard from "./InvitationDetailModal/RSVPResponseCard";
import TokensTable from "./InvitationDetailModal/TokensTable";
import EditInvitationModal from "./EditInvitationModal";
import type { InvitationWithTokens } from "@/app/backoffice/(protected)/invitations/types";

interface InvitationDetailModalProps {
  invitation: InvitationWithTokens;
}

export default function InvitationDetailModal({
  invitation,
}: InvitationDetailModalProps) {
  const router = useRouter();

  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();

  const handleClose = () => {
    router.back();
  };

  const handleInvitationUpdated = () => {
    router.refresh();
    onEditClose();
  };

  return (
    <>
      <Modal
        isOpen={true}
        onClose={handleClose}
        size="full"
        placement="center"
        scrollBehavior="inside"
        backdrop="blur"
        classNames={{
          backdrop: "bg-black/50 backdrop-blur-sm",
          base: "border-1 border-default-200 bg-background",
          header: "border-b-1 border-default-200",
          body: "py-6",
          footer: "border-t-1 border-default-200",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center justify-between w-full pr-8">
              <h2 className="text-xl font-bold">Detalles de la Invitación</h2>
              <Button
                size="sm"
                variant="flat"
                color="primary"
                startContent={<Edit size={16} />}
                onPress={onEditOpen}
              >
                Editar
              </Button>
            </div>
          </ModalHeader>

          <ModalBody className="gap-6 overflow-y-auto">
            <InvitationInfoCard invitation={invitation} />
            <RSVPResponseCard invitation={invitation} />
            <TokensTable
              invitationId={invitation.id}
              tokens={invitation.tokens}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      <EditInvitationModal
        isOpen={isEditOpen}
        onClose={onEditClose}
        onSuccess={handleInvitationUpdated}
        invitation={invitation}
      />
    </>
  );
}
