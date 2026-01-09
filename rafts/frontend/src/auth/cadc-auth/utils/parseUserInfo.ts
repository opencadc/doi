import {
  PROP_AUTHOR_FIRST_NAME,
  PROP_AUTHOR_LAST_NAME,
  PROP_AUTHOR_AFFILIATION,
  PROP_AUTHOR_EMAIL,
  PROP_AUTHOR_ORCID,
} from '@/shared/constants'
import { TPerson } from '@/shared/model'

// Define types for the CADC user response structure
interface CADCIdentity {
  '@type': string
  $: string | number
}

interface CADCIdentityWrapper {
  identity: CADCIdentity
}

interface CADCPersonalDetails {
  firstName?: { $: string }
  lastName?: { $: string }
  email?: { $: string }
  institute?: { $: string }
}

interface CADCPosixDetails {
  username?: { $: string }
  uid?: { $: number }
  gid?: { $: number }
  homeDirectory?: { $: string }
}

interface CADCInternalID {
  uri?: { $: string }
}

interface CADCUser {
  internalID?: CADCInternalID
  identities?: {
    $: CADCIdentityWrapper[]
  }
  personalDetails?: CADCPersonalDetails
  posixDetails?: CADCPosixDetails
}

interface CADCUserResponse {
  user?: CADCUser
}

/**
 * Creates a default empty TPerson object
 * @returns An empty TPerson object with default values
 */
const createEmptyPerson = (): TPerson => ({
  [PROP_AUTHOR_FIRST_NAME]: '',
  [PROP_AUTHOR_LAST_NAME]: '',
  [PROP_AUTHOR_AFFILIATION]: '',
  [PROP_AUTHOR_EMAIL]: '',
  [PROP_AUTHOR_ORCID]: '',
})

/**
 * Safely extracts a property from a nested object with $ notation
 * @param obj - The object to extract from
 * @param defaultValue - Default value if property doesn't exist
 * @returns The extracted value or default
 */
const extractNestedProperty = <T>(obj: { $?: T } | undefined, defaultValue: T): T => {
  return obj && obj.$ !== undefined ? obj.$ : defaultValue
}

/**
 * Parses the CADC user info response into a valid Person object
 * @param responseData - The JSON response from CADC users endpoint
 * @returns A valid Person object conforming to the TPerson schema
 */
export const parseUserInfo = (responseData: CADCUserResponse | null): TPerson => {
  // Default empty object if no response
  if (!responseData || !responseData.user) {
    return createEmptyPerson()
  }

  try {
    const user = responseData.user

    // Extract personal details
    const personalDetails = user.personalDetails || {}

    // Extract identities to look for ORCID
    const identities = user.identities?.$ || []

    // Find ORCID identity if present
    const orcidIdentity = identities.find(
      (item: CADCIdentityWrapper) => item.identity && item.identity['@type'] === 'ORCID',
    )?.identity

    // Build the person object
    return {
      [PROP_AUTHOR_FIRST_NAME]: extractNestedProperty(personalDetails.firstName, ''),
      [PROP_AUTHOR_LAST_NAME]: extractNestedProperty(personalDetails.lastName, ''),
      [PROP_AUTHOR_AFFILIATION]: extractNestedProperty(personalDetails.institute, ''),
      [PROP_AUTHOR_EMAIL]: extractNestedProperty(personalDetails.email, ''),
      [PROP_AUTHOR_ORCID]: orcidIdentity ? String(orcidIdentity.$) : '',
    }
  } catch (error) {
    console.error('Error parsing user info:', error)

    // Return empty object in case of parsing error
    return createEmptyPerson()
  }
}
