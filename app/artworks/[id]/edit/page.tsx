import ArtworkForm from '@/components/ArtworkForm'

export default async function ArtworkEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ArtworkForm id={id} />
}
