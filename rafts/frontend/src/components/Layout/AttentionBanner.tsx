import { Box, Typography, useTheme } from '@mui/material'

interface AttentionBannerProps {
  messages: string[] // now supports multiple paragraphs
  onClose?: () => void
  color?: 'info' | 'warning' | 'success' | 'error'
}

export const AttentionBanner: React.FC<AttentionBannerProps> = ({ messages, color = 'info' }) => {
  const theme = useTheme()

  if (messages.length === 0) return null

  const backgroundMap = {
    info: theme.palette.info.dark,
    warning: theme.palette.warning.light,
    success: theme.palette.success.light,
    error: theme.palette.error.light,
  }

  const textMap = {
    info: theme.palette.info.contrastText,
    warning: theme.palette.warning.contrastText,
    success: theme.palette.success.contrastText,
    error: theme.palette.error.contrastText,
  }

  return (
    <Box
      sx={{
        position: 'relative',
        backgroundColor: backgroundMap[color] || 'var(--input-background)',
        color: textMap[color] || 'var(--input-text)',
        borderRadius: 2,
        px: 3,
        py: 2.5,
        mb: 3,
      }}
    >
      {/* Messages */}
      <Box sx={{ pr: 4 }}>
        {messages.map((msg, idx) => (
          <Typography
            key={idx}
            variant="body1"
            sx={{ fontWeight: 400, mb: idx < messages.length - 1 ? 1 : 0 }}
          >
            {msg}
          </Typography>
        ))}
      </Box>
    </Box>
  )
}
