import { Spinner } from '@heroui/react'

export default function LoadingSpinner() {
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
        <Spinner />
    </div>
  )
}
