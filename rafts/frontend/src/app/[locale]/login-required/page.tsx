'use client'

import { useSearchParams } from 'next/navigation'
import { useRouter } from '@/i18n/routing'
import { Box, Container, Paper, Typography, Button, Divider } from '@mui/material'
import { LogIn, Home, Eye, FileText } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function LoginRequiredPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const t = useTranslations('auth')
  const returnUrl = searchParams.get('returnUrl') || '/'

  const handleLogin = () => {
    router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`)
  }

  const handleHome = () => {
    router.push('/')
  }

  const handlePublicRafts = () => {
    router.push('/public-view/rafts')
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
        <Box sx={{ mb: 3 }}>
          <LogIn size={64} strokeWidth={1.5} color="#1976d2" />
        </Box>

        <Typography variant="h4" gutterBottom>
          {t('login_required_title')}
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {t('login_required_message')}
        </Typography>

        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<LogIn size={20} />}
          onClick={handleLogin}
          fullWidth
          sx={{ mb: 2 }}
        >
          {t('sign_in')}
        </Button>

        <Divider sx={{ my: 3 }}>
          <Typography variant="body2" color="text.secondary">
            {t('or_browse')}
          </Typography>
        </Divider>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('explore_without_login')}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
          <Button variant="outlined" startIcon={<Home size={18} />} onClick={handleHome} fullWidth>
            {t('go_home')}
          </Button>

          <Button
            variant="outlined"
            startIcon={<Eye size={18} />}
            onClick={handlePublicRafts}
            fullWidth
          >
            {t('browse_public_rafts')}
          </Button>
        </Box>

        <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            <FileText size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            {t('requested_page')}: <code>{returnUrl}</code>
          </Typography>
        </Box>
      </Paper>
    </Container>
  )
}
