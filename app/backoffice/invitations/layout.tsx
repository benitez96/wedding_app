import { ReactNode } from 'react'

interface InvitationsLayoutProps {
  children: ReactNode
  modal: ReactNode
}

export default function InvitationsLayout({ children, modal }: InvitationsLayoutProps) {
  return (
    <>
      {children}
      {modal}
    </>
  )
}
