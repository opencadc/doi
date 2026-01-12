'use client'

import Link from 'next/link'
import { Box, Typography, Breadcrumbs } from '@mui/material'
import { Home, FileText } from 'lucide-react'

interface RaftBreadcrumbsProps {
  title?: string
  basePath?: string
}

export default function RaftBreadcrumbs({ title, basePath }: RaftBreadcrumbsProps) {
  return (
    <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
      <Link href="/" passHref>
        <Box component="span" sx={{ display: 'flex', alignItems: 'center', color: 'text.primary' }}>
          <Home size={16} />
          <Box component="span" sx={{ ml: 0.5 }}>
            Home
          </Box>
        </Box>
      </Link>
      <Link href={basePath || '/view/rafts'} passHref>
        <Box component="span" sx={{ display: 'flex', alignItems: 'center', color: 'text.primary' }}>
          <FileText size={16} />
          <Box component="span" sx={{ ml: 0.5 }}>
            RAFTs
          </Box>
        </Box>
      </Link>
      <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
        <Box component="span" sx={{ ml: 0.5 }}>
          {title || 'RAFT Details'}
        </Box>
      </Typography>
    </Breadcrumbs>
  )
}
