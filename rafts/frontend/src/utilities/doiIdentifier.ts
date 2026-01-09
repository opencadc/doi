import { CITATION_PARTIAL_URL } from '@/utilities/constants'
import { DOIData } from '@/types/doi'

export const extractDOI = (xmlString: string): string | null => {
  try {
    // Look for the identifier tag with identifierType="DOI"
    const identifierRegex = /<identifier\s+identifierType="DOI">([^<]+)<\/identifier>/
    const match = xmlString.match(identifierRegex)

    // Return the captured value if found
    if (match && match[1]) {
      return match[1].trim()
    }

    // Try a more forgiving approach if the above doesn't work
    const fallbackRegex = /<identifier[^>]*>([^<]+)<\/identifier>/
    const fallbackMatch = xmlString.match(fallbackRegex)

    if (fallbackMatch && fallbackMatch[1]) {
      return fallbackMatch[1].trim()
    }

    return null
  } catch (error) {
    console.error('Error extracting DOI:', error)
    return null
  }
}

export const sortByIdentifierNumber = (records: DOIData[]) => {
  return [...records].sort((a, b) => {
    // Extract the part after the slash for both identifiers
    const numA = a.identifier.split('/')[1]
    const numB = b.identifier.split('/')[1]

    // Compare as numbers rather than strings for proper numerical sorting
    return parseFloat(numB) - parseFloat(numA)
  })
}

export const getCitationLink = (doiIdentifier: string) => `${CITATION_PARTIAL_URL}${doiIdentifier}`
