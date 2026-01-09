import { RaftFormProvider } from '@/context/RaftFormContext'
import FormLayoutWithContext from '@/components/Form/FormLayoutWithContext'
import { auth } from '@/auth/cadc-auth/credentials'
import { redirect } from 'next/navigation'
import { PROP_GENERAL_INFO, PROP_POST_OPT_OUT, PROP_STATUS, PROP_TITLE } from '@/shared'

const CreateRAFT = async () => {
  const session = await auth()
  if (!session) {
    redirect('/login')
  }

  return (
    <RaftFormProvider
      initialRaftData={{
        [PROP_GENERAL_INFO]: {
          [PROP_TITLE]: '',
          [PROP_STATUS]: 'draft',
          [PROP_POST_OPT_OUT]: false,
        },
      }}
    >
      <FormLayoutWithContext />
    </RaftFormProvider>
  )
}

export default CreateRAFT
