import { TRaftContext } from '@/context/types'
import {
  OPTION_DRAFT,
  OPTION_REVIEW,
  OPTION_UNDER_REVIEW,
  OPTION_APPROVED,
  OPTION_PUBLISHED,
} from '@/shared/constants'

// Status type from constants
type RaftStatus =
  | typeof OPTION_DRAFT
  | typeof OPTION_REVIEW
  | typeof OPTION_UNDER_REVIEW
  | typeof OPTION_APPROVED
  | typeof OPTION_PUBLISHED

/**
 * DataCite Resource structure (simplified)
 * Based on DataCite Metadata Schema
 */
interface DataCiteCreator {
  name?: string
  givenName?: string
  familyName?: string
  affiliation?: string | { name?: string }[]
  nameIdentifiers?: { nameIdentifier?: string; nameIdentifierScheme?: string }[]
}

interface DataCiteTitle {
  value?: string
  lang?: string
}

interface DataCiteResource {
  identifier?: { value?: string; identifierType?: string }
  creators?: DataCiteCreator[]
  titles?: DataCiteTitle[]
  publisher?: { value?: string }
  publicationYear?: { value?: string }
  resourceType?: { resourceTypeGeneral?: string; value?: string }
  language?: string
  dates?: { date?: string; dateType?: string }[]
}

/**
 * Convert DataCite JSON resource to RAFT form context
 * This is used as a fallback when RAFT.json doesn't exist
 */
export function dataCiteToRaft(
  dataCite: DataCiteResource,
  doiStatus?: { title?: string; status?: string },
): TRaftContext {
  // Extract title
  const title = dataCite.titles?.[0]?.value || doiStatus?.title || ''

  // Extract corresponding author from first creator
  const firstCreator = dataCite.creators?.[0]
  const correspondingAuthor = firstCreator
    ? {
        firstName: firstCreator.givenName || firstCreator.name?.split(' ')[0] || '',
        lastName: firstCreator.familyName || firstCreator.name?.split(' ').slice(1).join(' ') || '',
        affiliation: getAffiliation(firstCreator.affiliation),
        authorORCID: getOrcid(firstCreator.nameIdentifiers),
        email: '', // Not available in DataCite
      }
    : {
        firstName: '',
        lastName: '',
        affiliation: '',
        authorORCID: '',
        email: '',
      }

  // Extract contributing authors (rest of creators)
  const contributingAuthors =
    dataCite.creators?.slice(1).map((creator) => ({
      firstName: creator.givenName || creator.name?.split(' ')[0] || '',
      lastName: creator.familyName || creator.name?.split(' ').slice(1).join(' ') || '',
      affiliation: getAffiliation(creator.affiliation),
      authorORCID: getOrcid(creator.nameIdentifiers),
      email: '', // Not available in DataCite
    })) || []

  // Map status
  const status = mapStatus(doiStatus?.status)

  const raftContext: TRaftContext = {
    generalInfo: {
      title,
      postOptOut: false,
      status,
    },
    authorInfo: {
      correspondingAuthor,
      contributingAuthors: contributingAuthors.length > 0 ? contributingAuthors : undefined,
      collaborations: undefined,
    },
    observationInfo: {
      topic: ['other'], // Default, not available in DataCite
      objectName: '', // Not available in DataCite
      abstract: '', // Not available in DataCite
      figure: undefined,
      acknowledgements: undefined,
      relatedPublishedRafts: undefined,
    },
    technical: {
      photometry: undefined,
      spectroscopy: undefined,
      astrometry: undefined,
      ephemeris: undefined,
      orbitalElements: undefined,
      mpcId: undefined,
      alertId: undefined,
      mjd: '',
      telescope: undefined,
    },
    measurementInfo: {
      photometry: undefined,
      spectroscopy: undefined,
      astrometry: undefined,
    },
    miscInfo: {
      misc: undefined,
    },
  }

  return raftContext
}

function getAffiliation(affiliation: string | { name?: string }[] | undefined): string {
  if (!affiliation) return ''
  if (typeof affiliation === 'string') return affiliation
  if (Array.isArray(affiliation) && affiliation.length > 0) {
    return affiliation[0].name || ''
  }
  return ''
}

function getOrcid(
  nameIdentifiers: { nameIdentifier?: string; nameIdentifierScheme?: string }[] | undefined,
): string {
  if (!nameIdentifiers) return ''
  const orcid = nameIdentifiers.find((ni) => ni.nameIdentifierScheme?.toLowerCase() === 'orcid')
  return orcid?.nameIdentifier || ''
}

function mapStatus(status: string | undefined): RaftStatus {
  if (!status) return OPTION_DRAFT
  const lowerStatus = status.toLowerCase()
  if (lowerStatus.includes('progress') || lowerStatus.includes('draft')) return OPTION_DRAFT
  if (lowerStatus.includes('review') && lowerStatus.includes('under')) return OPTION_UNDER_REVIEW
  if (lowerStatus.includes('review')) return OPTION_REVIEW
  if (lowerStatus.includes('approved')) return OPTION_APPROVED
  if (
    lowerStatus.includes('minted') ||
    lowerStatus.includes('published') ||
    lowerStatus.includes('completed')
  )
    return OPTION_PUBLISHED
  return OPTION_DRAFT
}

/**
 * Parse DataCite XML to JSON
 */
export async function parseDataCiteXml(xmlString: string): Promise<DataCiteResource> {
  const { parseStringPromise } = await import('xml2js')

  try {
    const result = await parseStringPromise(xmlString, {
      explicitArray: false,
      attrkey: 'attr',
      charkey: '_',
    })

    // DataCite XML has 'resource' as root
    const resource = result.resource || result

    return {
      identifier: parseIdentifier(resource.identifier),
      creators: parseCreators(resource.creators),
      titles: parseTitles(resource.titles),
      publisher: parsePublisher(resource.publisher),
      publicationYear: parsePublicationYear(resource.publicationYear),
      resourceType: parseResourceType(resource.resourceType),
      language: resource.language,
    }
  } catch (error) {
    console.error('[parseDataCiteXml] Error parsing XML:', error)
    throw new Error('Failed to parse DataCite XML')
  }
}

function parseIdentifier(
  identifier: unknown,
): { value?: string; identifierType?: string } | undefined {
  if (!identifier) return undefined
  if (typeof identifier === 'string') return { value: identifier }
  if (typeof identifier === 'object') {
    const obj = identifier as { _?: string; attr?: { identifierType?: string } }
    return { value: obj._ || '', identifierType: obj.attr?.identifierType }
  }
  return undefined
}

function parseCreators(creators: unknown): DataCiteCreator[] {
  if (!creators) return []
  const creatorList = (creators as { creator?: unknown }).creator
  if (!creatorList) return []
  const arr = Array.isArray(creatorList) ? creatorList : [creatorList]

  return arr.map((c: unknown) => {
    const creator = c as {
      creatorName?: string | { _?: string }
      givenName?: string
      familyName?: string
      affiliation?: string | { _?: string }[]
      nameIdentifier?: { _?: string; attr?: { nameIdentifierScheme?: string } }[]
    }

    return {
      name: typeof creator.creatorName === 'string' ? creator.creatorName : creator.creatorName?._,
      givenName: creator.givenName,
      familyName: creator.familyName,
      affiliation: parseAffiliation(creator.affiliation),
      nameIdentifiers: parseNameIdentifiers(creator.nameIdentifier),
    }
  })
}

function parseAffiliation(affiliation: unknown): string | { name?: string }[] {
  if (!affiliation) return ''
  if (typeof affiliation === 'string') return affiliation
  if (Array.isArray(affiliation)) {
    return affiliation.map((a) => ({
      name: typeof a === 'string' ? a : a._,
    }))
  }
  return ''
}

function parseNameIdentifiers(
  nameIdentifiers: unknown,
): { nameIdentifier?: string; nameIdentifierScheme?: string }[] {
  if (!nameIdentifiers) return []
  const arr = Array.isArray(nameIdentifiers) ? nameIdentifiers : [nameIdentifiers]
  return arr.map((ni: unknown) => {
    const id = ni as { _?: string; attr?: { nameIdentifierScheme?: string } }
    return {
      nameIdentifier: id._,
      nameIdentifierScheme: id.attr?.nameIdentifierScheme,
    }
  })
}

function parseTitles(titles: unknown): DataCiteTitle[] {
  if (!titles) return []
  const titleList = (titles as { title?: unknown }).title
  if (!titleList) return []
  const arr = Array.isArray(titleList) ? titleList : [titleList]

  return arr.map((t: unknown) => {
    if (typeof t === 'string') return { value: t }
    const title = t as { _?: string; attr?: { 'xml:lang'?: string } }
    return { value: title._, lang: title.attr?.['xml:lang'] }
  })
}

function parsePublisher(publisher: unknown): { value?: string } | undefined {
  if (!publisher) return undefined
  if (typeof publisher === 'string') return { value: publisher }
  return { value: (publisher as { _?: string })._ }
}

function parsePublicationYear(year: unknown): { value?: string } | undefined {
  if (!year) return undefined
  if (typeof year === 'string') return { value: year }
  return { value: (year as { _?: string })._ }
}

function parseResourceType(
  resourceType: unknown,
): { resourceTypeGeneral?: string; value?: string } | undefined {
  if (!resourceType) return undefined
  const rt = resourceType as { _?: string; attr?: { resourceTypeGeneral?: string } }
  return { value: rt._, resourceTypeGeneral: rt.attr?.resourceTypeGeneral }
}
