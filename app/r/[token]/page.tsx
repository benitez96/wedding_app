import TokenProcessor from './TokenProcessor'

interface TokenPageProps {
  params: {
    token: string
  }
}

export default async function TokenPage({ params }: TokenPageProps) {
  const { token } = await params
  return <TokenProcessor token={token} />
}
