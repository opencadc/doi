import LandingChoice from '@/components/LandingPage/LandingChoice'
import { auth } from '@/auth/cadc-auth/credentials'

const HomePage = async () => {
  const session = await auth()

  return <LandingChoice session={session} />
}

export default HomePage
