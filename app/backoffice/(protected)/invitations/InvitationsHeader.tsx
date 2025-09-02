'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button, Input, Spinner, useDisclosure } from '@heroui/react'
import { Plus, Search } from 'lucide-react'
import { useCallback, useTransition, useState, useEffect } from 'react'
import CreateInvitationModal from '@/components/CreateInvitationModal'

export default function InvitationsHeader() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '')
  const { isOpen: isCreateModalOpen, onOpen: onCreateModalOpen, onClose: onCreateModalClose } = useDisclosure()

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(name, value)
      } else {
        params.delete(name)
      }
      return params.toString()
    },
    [searchParams]
  )

  const handleSearch = (term: string) => {
    startTransition(() => {
      const queryString = createQueryString('search', term)
      router.push(`/backoffice/invitations?${queryString}`)
    })
  }

  // Debounce effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchValue !== searchParams.get('search')) {
        handleSearch(searchValue)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchValue])

  const handleCreateInvitation = () => {
    onCreateModalOpen()
  }

  const handleInvitationCreated = () => {
    // Recargar la página para obtener datos actualizados
    router.refresh()
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="md:text-2xl font-bold">Gestión de Invitaciones</h1>
        <Button
          color="primary"
          className='hidden md:block'
          onPress={handleCreateInvitation}
          startContent={<Plus />}
        >
          Crear Invitación
        </Button>
        <Button
          color="primary"
          size="sm"
          className='md:hidden'
          isIconOnly
          onPress={handleCreateInvitation}
          startContent={<Plus />}
        >
        </Button>
      </div>

      {/* Filtro de búsqueda */}
      <div className="mb-6">
        <Input
          placeholder="Buscar por nombre o apodo..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          startContent={<Search size={18} className="text-default-400" />}
          endContent={isPending && <Spinner size="sm" />}
          variant="bordered"
          className="max-w-xs"
        />
      </div>

      {/* Modal de Creación */}
      <CreateInvitationModal
        isOpen={isCreateModalOpen}
        onClose={onCreateModalClose}
        onSuccess={handleInvitationCreated}
      />
    </>
  )
}
