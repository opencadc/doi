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
import { extractDOI, sortByIdentifierNumber, getCitationLink } from '../doiIdentifier'

describe('extractDOI', () => {
  it('extracts DOI from valid XML with identifierType attribute', () => {
    const xml = '<identifier identifierType="DOI">10.5281/zenodo.1234567</identifier>'
    expect(extractDOI(xml)).toBe('10.5281/zenodo.1234567')
  })

  it('extracts DOI from XML with whitespace', () => {
    const xml = '<identifier identifierType="DOI">  25.0047  </identifier>'
    expect(extractDOI(xml)).toBe('25.0047')
  })

  it('extracts DOI using fallback regex when identifierType is missing', () => {
    const xml = '<identifier>10.1234/test</identifier>'
    expect(extractDOI(xml)).toBe('10.1234/test')
  })

  it('returns null for invalid XML', () => {
    const xml = '<notIdentifier>test</notIdentifier>'
    expect(extractDOI(xml)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(extractDOI('')).toBeNull()
  })

  it('handles complex XML document', () => {
    const xml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <resource>
        <identifier identifierType="DOI">10.5281/example</identifier>
        <title>Test Document</title>
      </resource>
    `
    expect(extractDOI(xml)).toBe('10.5281/example')
  })
})

describe('sortByIdentifierNumber', () => {
  it('sorts DOI records by identifier number in descending order', () => {
    const records = [
      { identifier: '10.5281/1', title: 'First', status: 'draft' },
      { identifier: '10.5281/3', title: 'Third', status: 'draft' },
      { identifier: '10.5281/2', title: 'Second', status: 'draft' },
    ]

    const sorted = sortByIdentifierNumber(records as never)
    expect(sorted[0].identifier).toBe('10.5281/3')
    expect(sorted[1].identifier).toBe('10.5281/2')
    expect(sorted[2].identifier).toBe('10.5281/1')
  })

  it('does not modify the original array', () => {
    const records = [
      { identifier: '10.5281/2', title: 'Second', status: 'draft' },
      { identifier: '10.5281/1', title: 'First', status: 'draft' },
    ]

    sortByIdentifierNumber(records as never)
    expect(records[0].identifier).toBe('10.5281/2')
  })

  it('handles decimal identifiers', () => {
    const records = [
      { identifier: '10.5281/1.5', title: 'A', status: 'draft' },
      { identifier: '10.5281/2.5', title: 'B', status: 'draft' },
      { identifier: '10.5281/1.1', title: 'C', status: 'draft' },
    ]

    const sorted = sortByIdentifierNumber(records as never)
    expect(sorted[0].identifier).toBe('10.5281/2.5')
    expect(sorted[1].identifier).toBe('10.5281/1.5')
    expect(sorted[2].identifier).toBe('10.5281/1.1')
  })

  it('returns empty array for empty input', () => {
    expect(sortByIdentifierNumber([])).toEqual([])
  })
})

describe('getCitationLink', () => {
  it('generates correct citation link', () => {
    const result = getCitationLink('10.5281/zenodo.1234567')
    expect(result).toBe('https://www.canfar.net/citation/landing?doi=10.5281/zenodo.1234567')
  })

  it('handles simple DOI identifier', () => {
    const result = getCitationLink('25.0047')
    expect(result).toBe('https://www.canfar.net/citation/landing?doi=25.0047')
  })
})
