import { RaftData } from '@/types/doi'

interface DataCiteJSON {
  resource: {
    '@xmlns': string
    identifier: {
      '@identifierType': string
      $: string
    }
    creators: {
      $: Array<{
        creator: {
          creatorName: {
            '@nameType': string
            $: string
          }
          givenName: { $: string }
          familyName: { $: string }
          affiliation: { $: string }
        }
      }>
    }
    titles: {
      $: Array<{
        title: { $: string }
      }>
    }
    publisher: { $: string }
    publicationYear: { $: number }
    resourceType: {
      '@resourceTypeGeneral': string
      $: string
    }
    contributors?: {
      $: Array<{
        contributor: {
          '@contributorType': string
          contributorName: { $: string }
          givenName: { $: string }
          familyName: { $: string }
          affiliation: { $: string }
        }
      }>
    }
  }
}

const convertToDataCite = (input: Partial<RaftData>): DataCiteJSON => {
  const publicationYear = new Date().getFullYear()
  const identifier = '10.5072/example-full' // Example DOI

  // Create the main DataCite structure
  const dataCite: DataCiteJSON = {
    resource: {
      '@xmlns': 'http://datacite.org/schema/kernel-4',
      identifier: {
        '@identifierType': 'DOI',
        $: identifier,
      },
      creators: {
        $: [
          {
            creator: {
              creatorName: {
                '@nameType': 'Personal',
                $: `${input.authorInfo?.correspondingAuthor?.lastName || 'Unknown'}, ${input.authorInfo?.correspondingAuthor?.firstName || 'Unknown'}`,
              },
              givenName: { $: input.authorInfo?.correspondingAuthor?.firstName || 'Unknown' },
              familyName: { $: input.authorInfo?.correspondingAuthor?.lastName || 'Unknown' },
              affiliation: {
                $: input.authorInfo?.correspondingAuthor?.affiliation || 'Not specified',
              },
            },
          },
        ],
      },
      titles: {
        $: [{ title: { $: input.generalInfo?.title || '' } }],
      },
      publisher: { $: 'NRC CADC' },
      publicationYear: { $: publicationYear },
      resourceType: {
        '@resourceTypeGeneral': 'Dataset',
        $: 'Dataset',
      },
    },
  }

  // Only add contributors if the array exists and has at least one entry
  if (input.authorInfo?.contributingAuthors && input.authorInfo.contributingAuthors.length > 0) {
    dataCite.resource.contributors = {
      $: input.authorInfo.contributingAuthors.map((author) => ({
        contributor: {
          '@contributorType': 'Researcher',
          contributorName: {
            $: `${author.lastName || 'Unknown'}, ${author.firstName || 'Unknown'}`,
          },
          givenName: { $: author.firstName || 'Unknown' },
          familyName: { $: author.lastName || 'Unknown' },
          affiliation: { $: author.affiliation || 'Not specified' },
        },
      })),
    }
  }

  return dataCite
}

export default convertToDataCite
