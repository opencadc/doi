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
import { SUBMIT_DOI_URL } from '@/actions/constants'
import { parseXmlToJson } from '@/utilities/xmlParser'
import { RaftData } from '@/types/doi'
import { downloadRaftFilePublic } from '@/services/canfarStorage'
import { TRaftContext } from '@/context/types'

export const getPublishedRaftById = async (id: string) => {
  try {
    // Try authenticated fetch to get DOI list, fall back to unauthenticated
    const session = await auth().catch(() => null)
    const accessToken = session?.accessToken

    const headers: Record<string, string> = {
      Accept: 'application/xml',
    }
    if (accessToken) {
      headers.Cookie = `CADC_SSO=${accessToken}`
    }

    const response = await fetch(SUBMIT_DOI_URL, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      console.error(`[getPublishedRaftById] DOI list fetch failed: ${response.status}`)
      return {
        success: false,
        error: `Request failed with status ${response.status}`,
      }
    }

    const xmlString = await response.text()
    const doiDataList = await parseXmlToJson(xmlString)

    // Find the matching DOI by identifier suffix
    const matchingDoi = doiDataList.find((doi) => doi.identifier.endsWith(`/${id}`))

    if (!matchingDoi) {
      console.error(`[getPublishedRaftById] No DOI found matching id: ${id}`)
      return { success: false, error: 'RAFTS not found' }
    }

    // Download RAFT.json from public VOSpace (minted data directory is public)
    const raftResponse = await downloadRaftFilePublic(matchingDoi.dataDirectory)

    let data: RaftData

    if (raftResponse.success && raftResponse.data) {
      const raftData = raftResponse.data as TRaftContext

      if (raftData.generalInfo && matchingDoi.status) {
        raftData.generalInfo.status = matchingDoi.status as typeof raftData.generalInfo.status
      }

      data = {
        _id: id,
        id: id,
        ...raftData,
        relatedRafts: [],
        generateForumPost: false,
        createdBy:
          ((raftData as Record<string, unknown>).createdBy as string) ||
          raftData.authorInfo?.correspondingAuthor?.email ||
          '',
        createdAt: ((raftData as Record<string, unknown>).createdAt as string) || '',
        updatedAt: ((raftData as Record<string, unknown>).updatedAt as string) || '',
        doi: matchingDoi.identifier,
        dataDirectory: matchingDoi.dataDirectory,
      } as RaftData
    } else {
      // No RAFT.json — build RaftData from DOI XML metadata
      console.warn(`[getPublishedRaftById] No RAFT.json for ${id}, using DOI metadata`)
      data = {
        _id: id,
        id: id,
        generalInfo: {
          title: matchingDoi.title || id,
          status: (matchingDoi.status || 'minted') as 'minted',
        },
        relatedRafts: [],
        generateForumPost: false,
        createdBy: '',
        createdAt: '',
        updatedAt: '',
        doi: matchingDoi.identifier,
        dataDirectory: matchingDoi.dataDirectory,
      } as unknown as RaftData
    }

    return { success: true, data }
  } catch (error) {
    console.error(`[getPublishedRaftById] Error fetching RAFT with ID ${id}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}
