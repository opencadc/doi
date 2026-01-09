import { CITE_ULR } from '@/services/constants'

export const getCurrentPath = (doiIdentifier: string) => {
  return `${CITE_ULR}/${doiIdentifier}/data`
}

export const jsonToFile = (jsonData: object, fileName: string): File => {
  const jsonString = JSON.stringify(jsonData, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  return new File([blob], fileName, { type: 'application/json' })
}
