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
