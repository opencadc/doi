// Types
export interface CANFARUploadResponse {
  code: number
}

export interface StorageError {
  status: number
  message: string
}

export interface StorageResponse<T> {
  data?: T
  error?: StorageError
}
