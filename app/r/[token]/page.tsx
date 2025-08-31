import TokenProcessor from './TokenProcessor'

interface TokenPageProps {
  params: Promise<{
    token: string
  }>
}

export default async function TokenPage({ params }: TokenPageProps) {
  const { token } = await params
  return <TokenProcessor token={token} />
}
