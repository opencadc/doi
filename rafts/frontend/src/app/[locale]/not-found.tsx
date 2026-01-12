'use client'

import { useTranslations } from 'next-intl'
import { Box, Typography, Button, Container, Paper } from '@mui/material'
import { Home, SearchOff } from '@mui/icons-material'
import { useRouter } from '@/i18n/routing'

export default function NotFound() {
  const t = useTranslations('not_found')
  const router = useRouter()

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper
        elevation={0}
        sx={{
          p: 6,
          textAlign: 'center',
          borderRadius: 3,
          backgroundColor: 'background.default',
        }}
      >
        <SearchOff
          sx={{
            fontSize: 120,
            color: 'text.secondary',
            mb: 3,
            opacity: 0.6,
          }}
        />

        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: '4rem', md: '6rem' },
            fontWeight: 700,
            color: 'primary.main',
            mb: 2,
          }}
        >
          404
        </Typography>

        <Typography
          variant="h4"
          sx={{
            fontWeight: 500,
            color: 'text.primary',
            mb: 2,
          }}
        >
          {t('title')}
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: 'text.secondary',
            mb: 4,
            maxWidth: 500,
            mx: 'auto',
          }}
        >
          {t('description')}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<Home />}
            onClick={() => router.push('/')}
          >
            {t('go_home')}
          </Button>
          <Button variant="outlined" size="large" onClick={() => router.back()}>
            {t('go_back')}
          </Button>
        </Box>
      </Paper>
    </Container>
  )
}
