export interface DOICitation {
  identifier: string
  identifierType: string
  creators: { name: string; givenName: string; familyName: string; affiliation: string }[]
  title: string
  publisher: string
  publicationYear: string
  resourceType: string
  dates: { date: string; dateType: string; info: string }[]
}

export function parseDataCiteXml(xmlString: string): DOICitation | null {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlString, 'text/xml')

  const parseError = doc.querySelector('parsererror')
  if (parseError) return null

  const getText = (parent: Element | Document, tag: string) =>
    parent.getElementsByTagName(tag)[0]?.textContent?.trim() || ''

  const identifierEl = doc.getElementsByTagName('identifier')[0]
  const creators = Array.from(doc.getElementsByTagName('creator')).map((c) => ({
    name: getText(c, 'creatorName'),
    givenName: getText(c, 'givenName'),
    familyName: getText(c, 'familyName'),
    affiliation: getText(c, 'affiliation'),
  }))

  const dates = Array.from(doc.getElementsByTagName('date')).map((d) => ({
    date: d.textContent?.trim() || '',
    dateType: d.getAttribute('dateType') || '',
    info: d.getAttribute('dateInformation') || '',
  }))

  return {
    identifier: identifierEl?.textContent?.trim() || '',
    identifierType: identifierEl?.getAttribute('identifierType') || '',
    creators,
    title: getText(doc, 'title'),
    publisher: getText(doc, 'publisher'),
    publicationYear: getText(doc, 'publicationYear'),
    resourceType: getText(doc, 'resourceType'),
    dates,
  }
}

export function formatCitationText(citation: DOICitation): string {
  const authors = citation.creators.map((c) => `${c.familyName}, ${c.givenName}`).join('; ')
  return `${authors} (${citation.publicationYear}). ${citation.title}. ${citation.publisher}. ${citation.identifierType}: ${citation.identifier}`
}
