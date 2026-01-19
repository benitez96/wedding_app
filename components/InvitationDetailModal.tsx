"use client";

import { useRouter } from "next/navigation";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/react";
import type { InvitationWithTokens } from "@/app/backoffice/(protected)/invitations/types";
import InvitationInfoCard from "./InvitationDetailModal/InvitationInfoCard";
import TokensTable from "./InvitationDetailModal/TokensTable";

interface InvitationDetailModalProps {
  invitation: InvitationWithTokens;
}

export default function InvitationDetailModal({
  invitation,
}: InvitationDetailModalProps) {
  const router = useRouter();

  const handleClose = () => {
    router.back();
  };

  return (
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
          <div className="flex items-center justify-between w-full">
            <h2 className="text-xl font-bold">Detalles de la Invitación</h2>
          </div>
        </ModalHeader>

        <ModalBody className="gap-6">
          <InvitationInfoCard invitation={invitation} />
          <TokensTable
            invitationId={invitation.id}
            tokens={invitation.tokens}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
