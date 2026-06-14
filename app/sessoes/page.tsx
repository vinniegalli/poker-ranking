import nextDynamic from 'next/dynamic'

export const dynamic = 'force-dynamic'

const SessoesContent = nextDynamic(() => import('./SessoesContent'), { ssr: false })

export default function Page() {
  return <SessoesContent />
}
