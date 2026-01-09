import { DATA, MESSAGE, SUCCESS } from '@/actions/constants'

export interface IResponse {
  [SUCCESS]: boolean
  [MESSAGE]?: string
}

export interface IResponseData<T> extends IResponse {
  [DATA]?: T
}
