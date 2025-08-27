import { redirect } from 'next/navigation'

export default function BackofficeRedirect() {
  redirect('/backoffice/dashboard')
}
