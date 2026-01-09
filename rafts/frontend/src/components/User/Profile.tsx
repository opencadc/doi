'use client'

import { Paper, Typography, Box, Avatar, Divider, Chip, Grid } from '@mui/material'
import { User, Building, Mail, IdCard, UserCog } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface UserProfileProps {
  user: {
    name?: string
    email?: string
    userId?: string
    role?: string
    affiliation?: string
  }
}

const UserProfile = ({ user }: UserProfileProps) => {
  const t = useTranslations('profile')

  return (
    <Paper elevation={3} className="p-6">
      <Box className="flex flex-col md:flex-row gap-6 items-center mb-6">
        <Avatar
          sx={{
            width: 100,
            height: 100,
            bgcolor: 'primary.main',
            fontSize: '2.5rem',
          }}
        >
          {user.name
            ?.split(' ')
            ?.map((n) => n[0])
            .join('')}
        </Avatar>

        <Box className="flex-1 text-center md:text-left">
          <Typography variant="h4" component="h1" gutterBottom>
            {user.name}
          </Typography>

          <Box className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
            <Chip label={user.role} color="primary" size="small" icon={<UserCog size={16} />} />
          </Box>
        </Box>
      </Box>

      <Divider className="my-4" />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box className="flex items-center gap-2 mb-3">
            <Mail size={20} />
            <Typography variant="subtitle1" fontWeight="medium">
              {t('email')}:
            </Typography>
          </Box>
          <Typography variant="body1">{user.email}</Typography>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Box className="flex items-center gap-2 mb-3">
            <Building size={20} />
            <Typography variant="subtitle1" fontWeight="medium">
              {t('affiliation')}:
            </Typography>
          </Box>
          <Typography variant="body1">{user.affiliation}</Typography>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Box className="flex items-center gap-2 mb-3">
            <IdCard size={20} />
            <Typography variant="subtitle1" fontWeight="medium">
              {t('user_id')}:
            </Typography>
          </Box>
          <Typography variant="body1" className="font-mono text-sm">
            {user.userId}
          </Typography>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Box className="flex items-center gap-2 mb-3">
            <User size={20} />
            <Typography variant="subtitle1" fontWeight="medium">
              {t('role')}:
            </Typography>
          </Box>
          <Typography variant="body1" className="capitalize">
            {user.role}
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  )
}

export default UserProfile
