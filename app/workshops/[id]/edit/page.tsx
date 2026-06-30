import WorkshopForm from '@/components/WorkshopForm'

export default async function WorkshopEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <WorkshopForm id={id} />
}
