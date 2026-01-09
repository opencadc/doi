import { Metadata } from 'next'

import { notFound } from 'next/navigation'
import FormLayoutWithContext from '@/components/Form/FormLayoutWithContext'
import { RaftFormProvider } from '@/context/RaftFormContext'
import { getDOIRaft } from '@/actions/getDOIRAFT'

export async function generateMetadata(props: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  // Fetch RAFT data for metadata
  const params = await props.params
  const { success, data } = await getDOIRaft(params?.id)

  if (!success || !data) {
    return {
      title: 'RAFT Not Found',
    }
  }

  return {
    title: `RAFT - ${data?.generalInfo?.title || 'View RAFT'}`,
    description:
      data.observationInfo?.abstract?.substring(0, 160) ||
      'Research Announcement For The Solar System',
  }
}

export default async function RaftPage(props: { params: Promise<{ id: string }> }) {
  // Fetch the RAFT data
  const params = await props.params

  const { success, data } = await getDOIRaft(params.id)

  // Handle not found
  if (!success || !data) {
    notFound()
  }

  return (
    <RaftFormProvider initialRaftData={{ ...data, id: params.id }}>
      <FormLayoutWithContext />
    </RaftFormProvider>
  )
}
