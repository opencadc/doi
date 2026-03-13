import { describe, it, expect } from 'vitest'
import { parseDataCiteXml, formatCitationText, DOICitation } from '../dataCiteParser'

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<resource xmlns="http://datacite.org/schema/kernel-4">
  <identifier identifierType="DOI">10.80791/RAFTS-1u7s1-50b76.test</identifier>
  <creators>
    <creator>
      <creatorName nameType="Personal">Zautkin, Serhii</creatorName>
      <givenName>Serhii</givenName>
      <familyName>Zautkin</familyName>
      <affiliation>NRC</affiliation>
    </creator>
  </creators>
  <titles>
    <title>RAFTS PUB 14</title>
  </titles>
  <publisher>NRC CADC</publisher>
  <publicationYear>2026</publicationYear>
  <resourceType resourceTypeGeneral="Dataset">Dataset</resourceType>
  <dates>
    <date dateType="Created" dateInformation="The date the DOI was created">2026-03-12</date>
  </dates>
</resource>`

const MULTI_CREATOR_XML = `<?xml version="1.0" encoding="UTF-8"?>
<resource xmlns="http://datacite.org/schema/kernel-4">
  <identifier identifierType="DOI">10.80791/RAFTS-test</identifier>
  <creators>
    <creator>
      <creatorName nameType="Personal">Smith, Jane</creatorName>
      <givenName>Jane</givenName>
      <familyName>Smith</familyName>
      <affiliation>MIT</affiliation>
    </creator>
    <creator>
      <creatorName nameType="Personal">Doe, John</creatorName>
      <givenName>John</givenName>
      <familyName>Doe</familyName>
      <affiliation>NASA</affiliation>
    </creator>
  </creators>
  <titles>
    <title>Multi Author Dataset</title>
  </titles>
  <publisher>Publisher</publisher>
  <publicationYear>2025</publicationYear>
  <resourceType resourceTypeGeneral="Dataset">Dataset</resourceType>
  <dates>
    <date dateType="Created" dateInformation="Created date">2025-01-01</date>
    <date dateType="Updated" dateInformation="Last update">2025-06-15</date>
  </dates>
</resource>`

describe('parseDataCiteXml', () => {
  it('parses a valid DataCite XML', () => {
    const result = parseDataCiteXml(SAMPLE_XML)
    expect(result).not.toBeNull()
    expect(result!.identifier).toBe('10.80791/RAFTS-1u7s1-50b76.test')
    expect(result!.identifierType).toBe('DOI')
    expect(result!.title).toBe('RAFTS PUB 14')
    expect(result!.publisher).toBe('NRC CADC')
    expect(result!.publicationYear).toBe('2026')
    expect(result!.resourceType).toBe('Dataset')
  })

  it('parses creators correctly', () => {
    const result = parseDataCiteXml(SAMPLE_XML)!
    expect(result.creators).toHaveLength(1)
    expect(result.creators[0]).toEqual({
      name: 'Zautkin, Serhii',
      givenName: 'Serhii',
      familyName: 'Zautkin',
      affiliation: 'NRC',
    })
  })

  it('parses dates correctly', () => {
    const result = parseDataCiteXml(SAMPLE_XML)!
    expect(result.dates).toHaveLength(1)
    expect(result.dates[0]).toEqual({
      date: '2026-03-12',
      dateType: 'Created',
      info: 'The date the DOI was created',
    })
  })

  it('parses multiple creators', () => {
    const result = parseDataCiteXml(MULTI_CREATOR_XML)!
    expect(result.creators).toHaveLength(2)
    expect(result.creators[0].familyName).toBe('Smith')
    expect(result.creators[1].familyName).toBe('Doe')
  })

  it('parses multiple dates', () => {
    const result = parseDataCiteXml(MULTI_CREATOR_XML)!
    expect(result.dates).toHaveLength(2)
    expect(result.dates[0].dateType).toBe('Created')
    expect(result.dates[1].dateType).toBe('Updated')
  })

  it('returns null for invalid XML', () => {
    const result = parseDataCiteXml('<not valid xml<<<')
    expect(result).toBeNull()
  })

  it('returns empty strings for missing fields', () => {
    const minimalXml = `<?xml version="1.0" encoding="UTF-8"?>
<resource xmlns="http://datacite.org/schema/kernel-4">
  <identifier identifierType="DOI">10.80791/test</identifier>
  <titles><title>Test</title></titles>
</resource>`
    const result = parseDataCiteXml(minimalXml)!
    expect(result.identifier).toBe('10.80791/test')
    expect(result.title).toBe('Test')
    expect(result.publisher).toBe('')
    expect(result.publicationYear).toBe('')
    expect(result.creators).toHaveLength(0)
    expect(result.dates).toHaveLength(0)
  })
})

describe('formatCitationText', () => {
  it('formats a single-author citation', () => {
    const citation: DOICitation = {
      identifier: '10.80791/RAFTS-test',
      identifierType: 'DOI',
      creators: [{ name: 'Zautkin, Serhii', givenName: 'Serhii', familyName: 'Zautkin', affiliation: 'NRC' }],
      title: 'Test Dataset',
      publisher: 'NRC CADC',
      publicationYear: '2026',
      resourceType: 'Dataset',
      dates: [],
    }
    const text = formatCitationText(citation)
    expect(text).toBe('Zautkin, Serhii (2026). Test Dataset. NRC CADC. DOI: 10.80791/RAFTS-test')
  })

  it('formats a multi-author citation with semicolons', () => {
    const citation: DOICitation = {
      identifier: '10.80791/RAFTS-multi',
      identifierType: 'DOI',
      creators: [
        { name: 'Smith, Jane', givenName: 'Jane', familyName: 'Smith', affiliation: 'MIT' },
        { name: 'Doe, John', givenName: 'John', familyName: 'Doe', affiliation: 'NASA' },
      ],
      title: 'Joint Research',
      publisher: 'Publisher',
      publicationYear: '2025',
      resourceType: 'Dataset',
      dates: [],
    }
    const text = formatCitationText(citation)
    expect(text).toBe('Smith, Jane; Doe, John (2025). Joint Research. Publisher. DOI: 10.80791/RAFTS-multi')
  })
})
