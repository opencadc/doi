import ResetPassword from '@/components/User/ResetPasswordPage'

const ResetPasswordPage = async (props: { params: Promise<{ token: string }> }) => {
  const params = await props.params
  return <ResetPassword token={params?.token} />
}

export default ResetPasswordPage
