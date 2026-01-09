'use server'

/**
 * Create DOI for Draft
 *
 * Creates a minimal DOI entry in DataCite to get a DOI identifier.
 * This allows attachment uploads before the form is fully completed.
 * The DOI is created in "draft" state and can be updated later.
 */

import { auth } from '@/auth/cadc-auth/credentials'
import { SUBMIT_DOI_URL, SUCCESS, MESSAGE } from '@/actions/constants'
import { IResponseData } from '@/actions/types'
import { ensureContainerNodeExists } from '@/services/vospaceTransfer'
import { getCurrentPath } from '@/services/utils'

const ATTACHMENTS_FOLDER = 'attachments'

export interface CreateDOIResult {
  doiIdentifier: string
  doiUrl: string
}

/**
 * Build minimal DataCite metadata for draft DOI creation
 */
function buildMinimalDataCiteMetadata(title: string, creatorName: string): Record<string, unknown> {
  const publicationYear = new Date().getFullYear()
  const nameParts = creatorName.split(' ')
  const givenName = nameParts[0] || 'Unknown'
  const familyName = nameParts.slice(1).join(' ') || 'Unknown'

  return {
    resource: {
      '@xmlns': 'http://datacite.org/schema/kernel-4',
      identifier: {
        '@identifierType': 'DOI',
        $: '10.5072/draft', // Placeholder, will be assigned by service
      },
      creators: {
        $: [
          {
            creator: {
              creatorName: {
                '@nameType': 'Personal',
                $: `${familyName}, ${givenName}`,
              },
              givenName: { $: givenName },
              familyName: { $: familyName },
              affiliation: { $: 'Not specified' },
            },
          },
        ],
      },
      titles: {
        $: [{ title: { $: title || 'Untitled RAFT Draft' } }],
      },
      publisher: { $: 'NRC CADC' },
      publicationYear: { $: publicationYear },
      resourceType: {
        '@resourceTypeGeneral': 'Dataset',
        $: 'RAFT Announcement',
      },
    },
  }
}

/**
 * Create a minimal DOI for draft purposes
 *
 * This creates a DOI entry so that attachments can be uploaded
 * before the form is fully completed. The DOI metadata will be
 * updated when the form is submitted.
 *
 * @param title - The RAFT title (can be provisional)
 * @returns DOI identifier and URL on success
 */
export async function createDOIForDraft(
  title: string = 'Untitled RAFT Draft',
): Promise<IResponseData<CreateDOIResult>> {
  const session = await auth()
  const accessToken = session?.accessToken
  const user = session?.user

  if (!accessToken || !user) {
    return { [SUCCESS]: false, [MESSAGE]: 'Not authenticated' }
  }

  try {
    // Build minimal metadata
    const creatorName = user.name || user.id || 'Unknown'
    const metadata = buildMinimalDataCiteMetadata(title, creatorName)

    // Create multipart form data (same format as submitDOI)
    const multipartFormData = new FormData()
    const jsonBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' })
    multipartFormData.append('doiMetaData', jsonBlob)

    console.log('[createDOIForDraft] Creating draft DOI for:', title)

    // Submit to DOI service
    const response = await fetch(SUBMIT_DOI_URL, {
      method: 'POST',
      headers: {
        Cookie: `CADC_SSO=${accessToken}`,
      },
      body: multipartFormData,
      redirect: 'manual',
    })

    console.log('[createDOIForDraft] Response status:', response.status)

    // 303 redirect means success - Location header contains the new DOI URL
    if (response.status === 303) {
      const location = response.headers.get('Location')
      console.log('[createDOIForDraft] Location header:', location)

      if (location) {
        const doiIdentifier = location.split('/').pop()

        if (doiIdentifier) {
          console.log('[createDOIForDraft] DOI identifier:', doiIdentifier)

          // Create the data folder and attachments subfolder in VOSpace
          try {
            const basePath = getCurrentPath(doiIdentifier)
            console.log('[createDOIForDraft] Creating VOSpace folder:', basePath)

            await ensureContainerNodeExists(basePath, accessToken)
            await ensureContainerNodeExists(`${basePath}/${ATTACHMENTS_FOLDER}`, accessToken)

            console.log('[createDOIForDraft] VOSpace folders created')
          } catch (folderError) {
            console.warn('[createDOIForDraft] Failed to create VOSpace folders:', folderError)
            // Continue anyway - folders will be created on first upload
          }

          return {
            [SUCCESS]: true,
            data: {
              doiIdentifier,
              doiUrl: location,
            },
          }
        }
      }
    }

    // Handle error responses
    const errorText = await response.text().catch(() => '')
    console.error('[createDOIForDraft] Error:', response.status, errorText)

    return {
      [SUCCESS]: false,
      [MESSAGE]: `Failed to create DOI: ${response.status} ${errorText}`,
    }
  } catch (error) {
    console.error('[createDOIForDraft] Exception:', error)
    return {
      [SUCCESS]: false,
      [MESSAGE]: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
