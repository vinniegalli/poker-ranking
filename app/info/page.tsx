import dynamic from 'next/dynamic'

const InfoContent = dynamic(() => import('./InfoContent'), { ssr: false })

export default function InfoPage() {
  return <InfoContent />
}
