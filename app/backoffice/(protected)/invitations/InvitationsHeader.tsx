"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Spinner } from "@heroui/spinner";
import { useDisclosure } from "@heroui/use-disclosure";
import { Plus, Search } from "lucide-react";
import { useTransition, useState, useEffect } from "react";
import CreateInvitationModal from "@/components/CreateInvitationModal";

export default function InvitationsHeader() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(
    searchParams.get("search") || "",
  );
  const { isOpen: isCreateModalOpen, onOpen, onClose } = useDisclosure();

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (term) {
      params.set("search", term);
    } else {
      params.delete("search");
    }

    startTransition(() => {
      router.replace(`/backoffice/invitations?${params.toString()}`);
    });
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchValue !== searchParams.get("search")) {
        handleSearch(searchValue);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchValue, searchParams]);

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="md:text-2xl font-bold">Gestión de Invitaciones</h1>
        <Button
          color="primary"
          className="hidden md:flex"
          onPress={onOpen}
          startContent={<Plus />}
        >
          Crear Invitación
        </Button>
        <Button
          color="primary"
          size="sm"
          className="md:hidden"
          isIconOnly
          onPress={onOpen}
          startContent={<Plus />}
        ></Button>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Buscar por nombre o apodo..."
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          startContent={<Search size={18} className="text-default-400" />}
          endContent={isPending ? <Spinner size="sm" /> : null}
          variant="bordered"
          className="max-w-xs bg-white"
        />
      </div>

      <CreateInvitationModal
        isOpen={isCreateModalOpen}
        onClose={onClose}
        onSuccess={() => router.refresh()}
      />
    </>
  );
}
