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
import { RaftData } from '@/types/doi'

export interface UserRaftsResponse {
  success: boolean
  data?: RaftData[]
  error?: string
  meta?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

/**
 * Fetches all RAFTs associated with a specific user
 *
 * @param userId - Optional user ID to fetch RAFTs for (defaults to current authenticated user)
 * @param options - Optional pagination and filtering options
 * @returns Response containing RAFTs data or error information
 */
export const getUserRafts = async (
  userId?: string,
  options: { page?: number; limit?: number; status?: string } = {},
): Promise<UserRaftsResponse> => {
  try {
    // Get the session with the access token
    const session = await auth()
    const accessToken = session?.accessToken

    if (!accessToken) {
      return { success: false, error: 'Not authenticated' }
    }

    // Determine user ID - either provided or current user
    const targetUserId = userId || session.user?.id || 'current'

    // Build query parameters for pagination/filtering
    const queryParams = new URLSearchParams()
    if (options.page) queryParams.append('page', options.page.toString())
    if (options.limit) queryParams.append('limit', options.limit.toString())
    if (options.status) queryParams.append('status', options.status)

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : ''

    // Make the API call with the access token as a Bearer token
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/rafts/user/${targetUserId}${queryString}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error(`Failed to fetch user RAFTs:`, errorData)
      return {
        success: false,
        error: errorData.message || `Request failed with status ${response.status}`,
      }
    }

    const responseData = await response.json()

    return {
      success: true,
      data: responseData.data,
      meta: responseData.meta,
    }
  } catch (error) {
    console.error(`Error fetching user RAFTs:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}
