import dynamic from 'next/dynamic'

const ConfirmarContent = dynamic(() => import('./ConfirmarContent'), { ssr: false })

export default function ConfirmarPage() {
  return <ConfirmarContent />
}
