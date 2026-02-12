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

import { auth } from '@/auth/cadc-auth/credentials'
import { SUBMIT_DOI_URL, MESSAGE, SUCCESS } from '@/actions/constants'
import { createDoiFormData } from '@/actions/utils/doiFormData'
import { IResponseData } from '@/actions/types'

/**
 * Fetches the XML for a specific DOI instance
 */
export const getDOIXml = async (doiSuffix: string): Promise<IResponseData<string>> => {
  try {
    const session = await auth()
    const accessToken = session?.accessToken

    if (!accessToken) {
      console.error('[getDOIXml] No access token available')
      return { [SUCCESS]: false, [MESSAGE]: 'Not authenticated' }
    }

    const url = `${SUBMIT_DOI_URL}/${doiSuffix}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/xml',
        Cookie: `CADC_SSO=${accessToken}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error('[getDOIXml] Error response:', response.status, errorText)
      return {
        [SUCCESS]: false,
        [MESSAGE]: `Request failed with status ${response.status}: ${errorText}`,
      }
    }

    const xmlString = await response.text()

    return { [SUCCESS]: true, data: xmlString }
  } catch (error) {
    console.error('[getDOIXml] Exception:', error)
    return {
      [SUCCESS]: false,
      [MESSAGE]: error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}

/**
 * Updates a DOI instance via POST with multipart form data
 * Backend expects: doiMetaData (DataCite JSON) and/or doiNodeData (node properties JSON)
 *
 * Updatable fields in doiMetaData: creators, titles, publicationYear, language
 * Updatable fields in doiNodeData: journalRef, status, reviewer
 */
export const updateDOIXml = async (
  doiSuffix: string,
  doiMetaData?: object,
  doiNodeData?: { journalRef?: string; status?: string; reviewer?: string },
): Promise<IResponseData<string>> => {
  try {
    const session = await auth()
    const accessToken = session?.accessToken

    if (!accessToken) {
      console.error('[updateDOIXml] No access token available')
      return { [SUCCESS]: false, [MESSAGE]: 'Not authenticated' }
    }

    const url = `${SUBMIT_DOI_URL}/${doiSuffix}`

    // Backend expects multipart form data with JSON blobs
    const formData = createDoiFormData({
      metaData: doiMetaData || undefined,
      nodeData: doiNodeData || undefined,
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Cookie: `CADC_SSO=${accessToken}`,
      },
      body: formData,
      redirect: 'manual', // Backend returns 303 on success
    })

    // 303 redirect means success
    if (response.status === 303) {
      const location = response.headers.get('Location')
      return { [SUCCESS]: true, data: location || 'Updated successfully' }
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error('[updateDOIXml] Error response:', response.status, errorText)
      return {
        [SUCCESS]: false,
        [MESSAGE]: `Request failed with status ${response.status}: ${errorText}`,
      }
    }

    const responseText = await response.text()

    return { [SUCCESS]: true, data: responseText }
  } catch (error) {
    console.error('[updateDOIXml] Exception:', error)
    return {
      [SUCCESS]: false,
      [MESSAGE]: error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}

// Note: modifyDataDirectoryInXml has been moved to @/utilities/xmlParser
// Import it from there: import { modifyDataDirectoryInXml } from '@/utilities/xmlParser'
