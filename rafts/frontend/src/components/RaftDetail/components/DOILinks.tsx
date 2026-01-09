'use client'

import { Button, Box, Tooltip } from '@mui/material'
import { ExternalLink, Database } from 'lucide-react'
import { CITATION_PARTIAL_URL, STORAGE_PARTIAL_URL } from '@/utilities/constants'
import { CITE_ULR } from '@/services/constants'

interface DOILinksProps {
  doi: string
}

const DOILinks = ({ doi }: DOILinksProps) => {
  // Extract the DOI identifier part (e.g., "25.0042" from "10.11570/25.0042")
  const doiIdentifier = doi.split('/').pop() || doi

  // Construct the URLs
  const landingPageUrl = `${CITATION_PARTIAL_URL}${doiIdentifier}`
  const storageUrl = `${STORAGE_PARTIAL_URL}/${CITE_ULR}/${doiIdentifier}/data`

  return (
    <Box sx={{ display: 'flex', gap: 2, my: 1 }}>
      <Tooltip title={`View DOI landing page: ${landingPageUrl}`}>
        <Button
          variant="outlined"
          size="small"
          endIcon={<ExternalLink size={16} />}
          onClick={() => window.open(landingPageUrl, '_blank')}
        >
          DOI
        </Button>
      </Tooltip>

      <Tooltip title={`View storage data: ${storageUrl}`}>
        <Button
          variant="outlined"
          size="small"
          endIcon={<Database size={16} />}
          onClick={() => window.open(storageUrl, '_blank')}
        >
          DOI Storage
        </Button>
      </Tooltip>
    </Box>
  )
}

export default DOILinks
