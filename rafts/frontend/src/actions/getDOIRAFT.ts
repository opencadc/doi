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
    console.log('[getDOIRaft] Fetching from:', SUBMIT_DOI_URL)
    console.log('[getDOIRaft] Raw XML response:', xmlString)
    const doiDataList: DOIData[] = await parseXmlToJson(xmlString)
    console.log('[getDOIRaft] Parsed DOIs:', JSON.stringify(doiDataList, null, 2))

    // Find the DOI entry matching the dataIdentifier (identifier ends with the dataIdentifier)
    console.log('[getDOIRaft] Looking for identifier ending with:', `/${dataIdentifier}`)
    const matchingDoi = doiDataList.find((doi) => doi.identifier.endsWith(`/${dataIdentifier}`))

    if (!matchingDoi) {
      console.error('[getDOIRaft] No matching DOI found for:', dataIdentifier)
      return { success: false, message: `No matching DOI found for: ${dataIdentifier}` }
    }

    console.log(
      '[getDOIRaft] Found matching DOI:',
      matchingDoi.identifier,
      'dataDirectory:',
      matchingDoi.dataDirectory,
    )

    // Try to download RAFT.json first
    const response = await downloadRaftFile(matchingDoi.dataDirectory, accessToken)

    if (response.success && response.data) {
      console.log('[getDOIRaft] Successfully downloaded RAFT.json')
      // Override status from DOI list (RAFT.json may have stale status)
      const raftData = response.data
      if (raftData.generalInfo && matchingDoi.status) {
        raftData.generalInfo.status = matchingDoi.status as typeof raftData.generalInfo.status
        console.log('[getDOIRaft] Status overridden from DOI list:', matchingDoi.status)
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
    console.log('[getDOIRaft] RAFT.json not found, falling back to DataCite XML')

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
      console.log('[getDOIRaft] DataCite XML:', dataCiteXml)

      // Parse DataCite XML and convert to RAFT form structure
      const dataCiteResource = await parseDataCiteXml(dataCiteXml)
      console.log(
        '[getDOIRaft] Parsed DataCite resource:',
        JSON.stringify(dataCiteResource, null, 2),
      )

      const raftData = dataCiteToRaft(dataCiteResource, {
        title: matchingDoi.title,
        status: matchingDoi.status,
      })

      // Set the id, dataDirectory, and reviewer fields
      raftData.id = dataIdentifier
      raftData.dataDirectory = matchingDoi.dataDirectory
      raftData.reviewer = matchingDoi.reviewer

      console.log('[getDOIRaft] Constructed RAFT data from XML:', JSON.stringify(raftData, null, 2))

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
