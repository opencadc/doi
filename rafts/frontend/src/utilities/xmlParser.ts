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

import { DOIData } from '@/types/doi'

/**
 * Parse DOI status XML string into a JSON array
 * Works in both client and server environments for Next.js
 *
 * @param {string} xmlString - XML string to parse
 * @returns {Promise<DOIData[]>} Promise resolving to an array of DOI status objects
 */
export const parseXmlToJson = async (xmlString: string): Promise<DOIData[]> => {
  // Check if we're running on the client or server
  const isClient = typeof window !== 'undefined'

  return isClient ? parseWithDOMParser(xmlString) : await parseWithServerMethod(xmlString)
}

/**
 * Client-side parser using browser's DOMParser
 */
const parseWithDOMParser = (xmlString: string): DOIData[] => {
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml')

  // Check for parser errors
  const parserError = xmlDoc.querySelector('parsererror')
  if (parserError) {
    console.error('XML parsing error:', parserError.textContent)
    throw new Error('Invalid XML format')
  }

  return extractDoiStatus(xmlDoc)
}

interface DoiItemAttribute {
  identifierType?: string
  'xml:lang'?: string
}

interface DoiItemValue {
  _?: string
  attr?: DoiItemAttribute
}

interface DoiStatusItem {
  identifier?: string | DoiItemValue
  title?: string | DoiItemValue
  status?: string | DoiItemValue
  dataDirectory?: string | DoiItemValue
  journalRef?: string | DoiItemValue
  reviewer?: string | DoiItemValue
}

interface DoiStatusesResult {
  doiStatuses?: {
    doistatus?: DoiStatusItem | DoiStatusItem[]
  }
}

/**
 * Server-side parser using dynamic import of xml2js
 * This avoids including xml2js in client bundles
 */
const parseWithServerMethod = async (xmlString: string): Promise<DOIData[]> => {
  // Dynamically import xml2js (only on server)
  const { parseStringPromise } = await import('xml2js')

  try {
    const result: DoiStatusesResult = await parseStringPromise(xmlString, {
      explicitArray: false,
      attrkey: 'attr',
    })

    if (!result.doiStatuses || !result.doiStatuses.doistatus) {
      return []
    }

    // Ensure doistatus is always treated as an array
    const doiStatuses: DoiStatusItem[] = Array.isArray(result.doiStatuses.doistatus)
      ? result.doiStatuses.doistatus
      : [result.doiStatuses.doistatus]

    return doiStatuses.map((item: DoiStatusItem): DOIData => {
      // Handle identifier
      const identifier: string =
        typeof item.identifier === 'object'
          ? item.identifier?._?.toString() || ''
          : item.identifier?.toString() || ''

      const identifierType: string | null =
        typeof item.identifier === 'object' ? item.identifier?.attr?.identifierType || '' : ''

      // Handle title
      const title: string =
        typeof item.title === 'object'
          ? item.title?._?.toString() || ''
          : item.title?.toString() || ''

      const titleLang: string | null =
        typeof item.title === 'object' ? item.title?.attr?.['xml:lang'] || null : null

      // Handle other elements
      const status: string =
        typeof item.status === 'object'
          ? item.status?._?.toString() || ''
          : item.status?.toString() || ''

      const dataDirectory: string =
        typeof item.dataDirectory === 'object'
          ? item.dataDirectory?._?.toString() || ''
          : item.dataDirectory?.toString() || ''

      const journalRef: string | null =
        typeof item.journalRef === 'object'
          ? item.journalRef?._?.toString() || null
          : item.journalRef?.toString() || null

      const reviewer: string | null =
        typeof item.reviewer === 'object'
          ? item.reviewer?._?.toString() || null
          : item.reviewer?.toString() || null

      return {
        identifier,
        identifierType,
        title,
        titleLang,
        status,
        dataDirectory,
        journalRef: journalRef ? journalRef.trim() : null,
        reviewer: reviewer ? reviewer.trim() : null,
      }
    })
  } catch (error) {
    console.error('Error parsing XML:', error)
    throw new Error('Failed to parse DOI status XML')
  }
}

/**
 * Extract DOI status data from DOM document
 */
const extractDoiStatus = (xmlDoc: Document): DOIData[] => {
  const doiStatusElements = xmlDoc.getElementsByTagName('doistatus')
  const results: DOIData[] = []

  for (let i = 0; i < doiStatusElements.length; i++) {
    const item = doiStatusElements[i]

    // Extract the identifier
    const identifierElement = item.getElementsByTagName('identifier')[0]
    const identifier = identifierElement?.textContent || ''
    const identifierType = identifierElement?.getAttribute('identifierType') || ''

    // Extract the title
    const titleElement = item.getElementsByTagName('title')[0]
    const title = titleElement?.textContent || ''
    const titleLang = titleElement?.getAttribute('xml:lang') || ''

    // Extract other elements
    const status = getElementText(item, 'status')
    const dataDirectory = getElementText(item, 'dataDirectory')
    const journalRef = getElementText(item, 'journalRef')
    const reviewer = getElementText(item, 'reviewer')

    // Create result object
    results.push({
      identifier,
      identifierType,
      title,
      titleLang,
      status,
      dataDirectory,
      journalRef: journalRef.trim() || null,
      reviewer: reviewer.trim() || null,
    })
  }

  return results
}

/**
 * Helper function to get text content from an element
 */
const getElementText = (parentElement: Element, tagName: string): string => {
  const element = parentElement.getElementsByTagName(tagName)[0]
  return element ? element.textContent || '' : ''
}

/**
 * Helper to modify dataDirectory in XML
 */
export const modifyDataDirectoryInXml = (xml: string, newDataDirectory: string): string => {
  // Replace the dataDirectory element content
  return xml.replace(
    /<dataDirectory>([^<]*)<\/dataDirectory>/,
    `<dataDirectory>${newDataDirectory}</dataDirectory>`,
  )
}
