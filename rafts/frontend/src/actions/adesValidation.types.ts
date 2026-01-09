export type ADESFileKind = 'xml' | 'psv' | 'mpc'

export interface ADESValidationResult {
  filename: string
  validation_type: string
  results: Array<{
    type: string
    valid: boolean
    message: string
  }>
  xml_info?: {
    root_element: string
    version: string
    attributes?: Record<string, string>
  }
}
