import PersonaForm from '@/components/PersonaForm'

export default async function PersonaEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <PersonaForm id={id} />
}
