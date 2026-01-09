import VerifyEmail from '@/components/User/VerifyEmailPage'

const VerifyEmailPage = async (props: { params: Promise<{ token: string }> }) => {
  const params = await props.params
  return <VerifyEmail token={params?.token} />
}

export default VerifyEmailPage
