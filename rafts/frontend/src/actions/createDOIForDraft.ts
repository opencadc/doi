/*
 ************************************************************************
 *******************  CANADIAN ASTRONOMY DATA CENTRE  *******************
 **************  CENTRE CANADIEN DE DONNÉES ASTRONOMIQUES  **************
 *
 *  (c) 2026.                            (c) 2026.
 *  Government of Canada                 Gouvernement du Canada
 *  National Research Council            Conseil national de recherches
 *  Ottawa, Canada, K1A 0R6              Ottawa, Canada, K1A 0R6
 *  All rights reserved                  Tous droits réservés
 *
 *  NRC disclaims any warranties,        Le CNRC dénie toute garantie
 *  expressed, implied, or               énoncée, implicite ou légale,
 *  statutory, of any kind with          de quelque nature que ce
 *  respect to the software,             soit, concernant le logiciel,
 *  including without limitation         y compris sans restriction
 *  any warranty of merchantability      toute garantie de valeur
 *  or fitness for a particular          marchande ou de pertinence
 *  purpose. NRC shall not be            pour un usage particulier.
 *  liable in any event for any          Le CNRC ne pourra en aucun cas
 *  damages, whether direct or           être tenu responsable de tout
 *  indirect, special or general,        dommage, direct ou indirect,
 *  consequential or incidental,         particulier ou général,
 *  arising from the use of the          accessoire ou fortuit, résultant
 *  software.  Neither the name          de l'utilisation du logiciel. Ni
 *  of the National Research             le nom du Conseil National de
 *  Council of Canada nor the            Recherches du Canada ni les noms
 *  names of its contributors may        de ses  participants ne peuvent
 *  be used to endorse or promote        être utilisés pour approuver ou
 *  products derived from this           promouvoir les produits dérivés
 *  software without specific prior      de ce logiciel sans autorisation
 *  written permission.                  préalable et particulière
 *                                       par écrit.
 *
 *  This file is part of the             Ce fichier fait partie du projet
 *  OpenCADC project.                    OpenCADC.
 *
 *  OpenCADC is free software:           OpenCADC est un logiciel libre ;
 *  you can redistribute it and/or       vous pouvez le redistribuer ou le
 *  modify it under the terms of         modifier suivant les termes de
 *  the GNU Affero General Public        la "GNU Affero General Public
 *  License as published by the          License" telle que publiée
 *  Free Software Foundation,            par la Free Software Foundation
 *  either version 3 of the              : soit la version 3 de cette
 *  License, or (at your option)         licence, soit (à votre gré)
 *  any later version.                   toute version ultérieure.
 *
 *  OpenCADC is distributed in the       OpenCADC est distribué
 *  hope that it will be useful,         dans l'espoir qu'il vous
 *  but WITHOUT ANY WARRANTY;            sera utile, mais SANS AUCUNE
 *  without even the implied             GARANTIE : sans même la garantie
 *  warranty of MERCHANTABILITY          implicite de COMMERCIALISABILITÉ
 *  or FITNESS FOR A PARTICULAR          ni d'ADÉQUATION À UN OBJECTIF
 *  PURPOSE.  See the GNU Affero         PARTICULIER. Consultez la Licence
 *  General Public License for           Générale Publique GNU Affero
 *  more details.                        pour plus de détails.
 *
 *  You should have received             Vous devriez avoir reçu une
 *  a copy of the GNU Affero             copie de la Licence Générale
 *  General Public License along         Publique GNU Affero avec
 *  with OpenCADC.  If not, see          OpenCADC ; si ce n'est
 *  <http://www.gnu.org/licenses/>.      pas le cas, consultez :
 *                                       <http://www.gnu.org/licenses/>.
 *
 ************************************************************************
 */

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
import { createDoiFormData } from '@/actions/utils/doiFormData'
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
        $: [{ title: { $: title || 'Untitled RAFTS Draft' } }],
      },
      publisher: { $: 'NRC CADC' },
      publicationYear: { $: publicationYear },
      resourceType: {
        '@resourceTypeGeneral': 'Dataset',
        $: 'RAFTS Announcement',
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
  title: string = 'Untitled RAFTS Draft',
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
    const multipartFormData = createDoiFormData({ metaData: metadata })

    // Submit to DOI service
    const response = await fetch(SUBMIT_DOI_URL, {
      method: 'POST',
      headers: {
        Cookie: `CADC_SSO=${accessToken}`,
      },
      body: multipartFormData,
      redirect: 'manual',
    })

    // 303 redirect means success - Location header contains the new DOI URL
    if (response.status === 303) {
      const location = response.headers.get('Location')

      if (location) {
        const doiIdentifier = location.split('/').pop()

        if (doiIdentifier) {
          // Create the data folder and attachments subfolder in VOSpace
          try {
            const basePath = getCurrentPath(doiIdentifier)

            await ensureContainerNodeExists(basePath, accessToken)
            await ensureContainerNodeExists(`${basePath}/${ATTACHMENTS_FOLDER}`, accessToken)
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
