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

import { VALIDATION_SCHEMAS } from '@/context/constants'
import { ZodError } from 'zod'

/**
 * Validates an object against a Zod schema
 *
 * @param schema - The Zod schema to validate against
 * @param data - The object to validate
 * @returns True if valid, false otherwise
 */
export const validateWithSchema = <T extends keyof typeof VALIDATION_SCHEMAS>(
  schema: (typeof VALIDATION_SCHEMAS)[T],
  data: unknown,
): boolean => {
  try {
    // Attempt to parse the data with the schema
    schema.parse(data)
    return true
  } catch {
    // If Zod throws an error, the validation failed
    return false
  }
}

/**
 * Validates an object against a Zod schema and returns formatted errors
 *
 * @param schema - The Zod schema to validate against
 * @param data - The object to validate
 * @returns Object with field errors or undefined if valid
 */
interface ValidationErrorObject {
  [key: string]: string | ValidationErrorObject
}

type ValidationError = string | ValidationErrorObject

export const getValidationErrors = <T extends keyof typeof VALIDATION_SCHEMAS>(
  schema: (typeof VALIDATION_SCHEMAS)[T],
  data: unknown,
): Record<string, ValidationError> | undefined => {
  try {
    schema.parse(data)
    return undefined
  } catch (error) {
    if (error instanceof ZodError) {
      // Convert ZodError to a nested object structure matching the data structure
      const formattedErrors: Record<string, ValidationError> = {}

      error.issues.forEach((err) => {
        let current = formattedErrors
        const path = [...err.path]
        const lastKey = path.pop()

        // Navigate to the correct nested level
        path.forEach((key) => {
          const keyStr = String(key)
          if (!current[keyStr]) {
            current[keyStr] = {}
          }
          current = current[keyStr] as Record<string, ValidationError>
        })

        // Set the error message at the final key
        if (lastKey !== undefined) {
          current[String(lastKey)] = err.message
        }
      })

      return formattedErrors
    }
    return undefined
  }
}
