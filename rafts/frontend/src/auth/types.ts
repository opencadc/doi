import { ERROR, SUCCESS } from '@/auth/constants'

export type AuthState = {
  [SUCCESS]: boolean
  [ERROR]: string | null
}
