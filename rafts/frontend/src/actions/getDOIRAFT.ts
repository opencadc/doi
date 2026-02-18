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
import { downloadRaftFile } from '@/services/canfarStorage'
import { TRaftContext } from '@/context/types'
import { IResponseData } from '@/actions/types'
import { SUBMIT_DOI_URL } from '@/actions/constants'
import { parseXmlToJson } from '@/utilities/xmlParser'
import { DOIData } from '@/types/doi'
import { dataCiteToRaft, parseDataCiteXml } from '@/utilities/dataCiteToRaft'

export const getDOIRaft = async (dataIdentifier: string): Promise<IResponseData<TRaftContext>> => {
  try {
    // Get the session with the access token
    const session = await auth()
    const accessToken = session?.accessToken

    if (!accessToken) {
      return { success: false, message: 'Not authenticated' }
    }

    // Fetch DOI data to get the correct dataDirectory for this identifier
    const doiResponse = await fetch(`${SUBMIT_DOI_URL}`, {
      method: 'GET',
      headers: {
        Accept: 'application/xml',
        Cookie: `CADC_SSO=${accessToken}`,
      },
    })

    if (!doiResponse.ok) {
      console.error('[getDOIRaft] Failed to fetch DOI list:', doiResponse.status)
      return { success: false, message: `Failed to fetch DOI list: ${doiResponse.status}` }
    }

    const xmlString = await doiResponse.text()
    const doiDataList: DOIData[] = await parseXmlToJson(xmlString)

    // Find the DOI entry matching the dataIdentifier (identifier ends with the dataIdentifier)
    const matchingDoi = doiDataList.find((doi) => doi.identifier.endsWith(`/${dataIdentifier}`))

    if (!matchingDoi) {
      console.error('[getDOIRaft] No matching DOI found for:', dataIdentifier)
      return { success: false, message: `No matching DOI found for: ${dataIdentifier}` }
    }

    // Try to download RAFT.json first
    const response = await downloadRaftFile(matchingDoi.dataDirectory, accessToken)

    if (response.success && response.data) {
      // Override status from DOI list (RAFT.json may have stale status)
      const raftData = response.data
      if (raftData.generalInfo && matchingDoi.status) {
        raftData.generalInfo.status = matchingDoi.status as typeof raftData.generalInfo.status
      }
      // Create a new object with all fields to ensure proper serialization
      const finalData: TRaftContext = {
        ...raftData,
        id: dataIdentifier,
        dataDirectory: matchingDoi.dataDirectory,
        reviewer: matchingDoi.reviewer,
      }
      return { success: true, data: finalData }
    }

    // FALLBACK: If RAFT.json doesn't exist, construct from DataCite XML

    try {
      // Fetch the full DataCite XML for this specific DOI
      const dataCiteResponse = await fetch(`${SUBMIT_DOI_URL}/${dataIdentifier}`, {
        method: 'GET',
        headers: {
          Accept: 'application/xml',
          Cookie: `CADC_SSO=${accessToken}`,
        },
      })

      if (!dataCiteResponse.ok) {
        console.error('[getDOIRaft] Failed to fetch DataCite XML:', dataCiteResponse.status)
        return {
          success: false,
          message: `RAFT.json not found and failed to fetch DataCite XML: ${dataCiteResponse.status}`,
        }
      }

      const dataCiteXml = await dataCiteResponse.text()

      // Parse DataCite XML and convert to RAFT form structure
      const dataCiteResource = await parseDataCiteXml(dataCiteXml)

      const raftData = dataCiteToRaft(dataCiteResource, {
        title: matchingDoi.title,
        status: matchingDoi.status,
      })

      // Set the id, dataDirectory, and reviewer fields
      raftData.id = dataIdentifier
      raftData.dataDirectory = matchingDoi.dataDirectory
      raftData.reviewer = matchingDoi.reviewer

      return {
        success: true,
        data: raftData,
        message: 'Constructed from DataCite XML (RAFT.json not found)',
      }
    } catch (fallbackError) {
      console.error('[getDOIRaft] Fallback failed:', fallbackError)
      return {
        success: false,
        message: response?.message || 'RAFT.json not found and fallback to XML failed',
      }
    }
  } catch (error) {
    console.error('DOI data retrieval error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}
