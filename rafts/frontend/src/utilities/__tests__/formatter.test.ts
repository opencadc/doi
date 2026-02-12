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

import { describe, it, expect } from 'vitest'
import { formatDate, formatUserName, getUserInitials } from '../formatter'

describe('formatDate', () => {
  it('formats a valid date string correctly', () => {
    const result = formatDate('2025-07-15T10:30:00Z')
    // The exact output depends on timezone, but it should contain expected parts
    expect(result).toMatch(/Jul/)
    expect(result).toMatch(/15/)
    expect(result).toMatch(/2025/)
  })

  it('handles ISO date strings', () => {
    // Use a mid-day time to avoid timezone edge cases
    const result = formatDate('2024-06-15T12:00:00.000Z')
    expect(result).toMatch(/Jun/)
    expect(result).toMatch(/15/)
    expect(result).toMatch(/2024/)
  })
})

describe('formatUserName', () => {
  it('returns full name when user has firstName and lastName', () => {
    const user = {
      firstName: 'John',
      lastName: 'Doe',
      id: '1',
      email: 'john@example.com',
    }
    expect(formatUserName(user)).toBe('John Doe')
  })

  it('returns "Unknown User" when user is undefined', () => {
    expect(formatUserName(undefined)).toBe('Unknown User')
  })

  it('handles empty strings in name', () => {
    const user = {
      firstName: '',
      lastName: 'Doe',
      id: '1',
      email: 'test@example.com',
    }
    expect(formatUserName(user)).toBe(' Doe')
  })
})

describe('getUserInitials', () => {
  it('returns uppercase initials for valid user', () => {
    const user = {
      firstName: 'John',
      lastName: 'Doe',
      id: '1',
      email: 'john@example.com',
    }
    expect(getUserInitials(user)).toBe('JD')
  })

  it('returns "U" when user is undefined', () => {
    expect(getUserInitials(undefined)).toBe('U')
  })

  it('handles lowercase names', () => {
    const user = {
      firstName: 'jane',
      lastName: 'smith',
      id: '1',
      email: 'jane@example.com',
    }
    expect(getUserInitials(user)).toBe('JS')
  })

  it('handles single character names', () => {
    const user = {
      firstName: 'A',
      lastName: 'B',
      id: '1',
      email: 'ab@example.com',
    }
    expect(getUserInitials(user)).toBe('AB')
  })
})
