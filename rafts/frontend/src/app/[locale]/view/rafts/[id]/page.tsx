import { Metadata } from 'next'
import RaftDetail from '@/components/RaftDetail/RaftDetail'
import { notFound } from 'next/navigation'
import { getDOIRaft } from '@/actions/getDOIRAFT'

export async function generateMetadata(props: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const params = await props.params
  const { success, data } = await getDOIRaft(params.id)

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
  const params = await props.params
  const { success, data } = await getDOIRaft(params.id)

  if (!success || !data) {
    notFound()
  }

  return <RaftDetail raftData={data} />
}
