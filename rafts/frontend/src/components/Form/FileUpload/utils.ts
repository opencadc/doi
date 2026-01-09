import { TRaftContext } from '@/context/types'

/**
 * Convert a JSON object to a downloadable file
 * @param data The JSON data to convert
 * @param filename The name of the file to download
 */
export const downloadJsonAsFile = (
  data: TRaftContext,
  filename: string = 'raft-data.json',
): void => {
  try {
    const jsonString = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()

    // Clean up
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error downloading JSON file:', error)
    throw new Error('Failed to download JSON file')
  }
}
