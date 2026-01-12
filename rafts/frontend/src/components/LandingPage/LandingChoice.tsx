'use client'
import { useRouter } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import {
  Container,
  Typography,
  Paper,
  Grid,
  Box,
  Card,
  CardContent,
  Divider,
  useTheme,
} from '@mui/material'
import {
  PostAdd as CreateIcon,
  EditNote as ViewIcon,
  /*ManageSearch as PublicViewIcon,*/
  List as ListIcon,
  /*Group as GroupIcon,*/
  Announcement as AnnouncementIcon,
  Science as ScienceIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material'

import solar from '@/assets/systeme-solaire-og.jpg'
import { useMemo } from 'react'
import { Session } from 'next-auth'

const LandingChoice = ({ session }: { session: Session | null }) => {
  const router = useRouter()
  const userRole = session?.user?.role
  const t = useTranslations('landing_page')
  const theme = useTheme()
  const features = [
    {
      icon: <AnnouncementIcon fontSize="large" sx={{ color: theme.palette.primary.main }} />,
      title: t('rapidPublications'),
      description:
        'Quickly issue short announcements with a transparent review process, nominally published within 1 day',
    },
    {
      icon: <ScienceIcon fontSize="large" sx={{ color: theme.palette.primary.main }} />,
      title: 'Solar System Science',
      description:
        'Focused on solar system discoveries including comets, asteroids, unusual objects, and time-sensitive observations',
    },
    {
      icon: <VisibilityIcon fontSize="large" sx={{ color: theme.palette.primary.main }} />,
      title: 'Community Access',
      description:
        'Freely accessible to all users with citable DOIs and community discussion threads',
    },
  ]

  const actionCards = useMemo(
    () =>
      [
        {
          title: 'Create a RAFT',
          description: 'Submit a new research announcement',
          icon: <CreateIcon sx={{ fontSize: 60, color: theme.palette.primary.main, mb: 2 }} />,
          color: theme.palette.primary.main,
          path: '/form/create',
          roles: ['contributor', 'reviewer', 'admin'],
        },
        {
          title: 'View Your RAFTs',
          description: 'Browse published announcements',
          icon: <ViewIcon sx={{ fontSize: 60, color: theme.palette.secondary.main, mb: 2 }} />,
          color: theme.palette.secondary.main,
          path: '/view/rafts',
          roles: ['contributor', 'reviewer'],
        } /*,
        {
          title: 'View Published RAFTs',
          description: 'Browse published announcements',
          icon: (
            <PublicViewIcon sx={{ fontSize: 60, color: theme.palette.secondary.main, mb: 2 }} />
          ),
          color: theme.palette.secondary.main,
          path: '/public-view/rafts',
          roles: [],
        }*/,
        {
          title: 'Review RAFTs',
          description: 'Review submitted rafts',
          icon: <ListIcon sx={{ fontSize: 60, color: theme.palette.secondary.main, mb: 2 }} />,
          color: theme.palette.secondary.main,
          path: '/review/rafts',
          roles: ['reviewer', 'admin'],
        } /*
        {
          title: 'Manage Users',
          description: 'Update user roles and status',
          icon: <GroupIcon sx={{ fontSize: 60, color: theme.palette.secondary.main, mb: 2 }} />,
          color: theme.palette.secondary.main,
          path: '/admin',
          roles: ['admin'],
        },*/,
      ].filter((c) => {
        return (
          (userRole && (c?.roles.includes(userRole) || c?.roles.length === 0)) ||
          (!userRole && c?.roles.length === 0)
        )
      }),
    [userRole, theme.palette.primary.main, theme.palette.secondary.main],
  )
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 2,
          background: `linear-gradient(to right, ${theme.palette.background.paper}, ${theme.palette.background.default})`,
          mb: 6,
        }}
      >
        <Grid container spacing={4} alignItems="center">
          <Grid size={{ xs: 12, md: 7 }}>
            <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
              Research Announcements For The Solar System
            </Typography>
            <Typography variant="h6" color="text.secondary" component={'p'}>
              A publication system for short solar system science announcements in the era of large
              surveys like Rubin Observatory&apos;s LSST
            </Typography>
            <Typography component={'p'} variant="body1" color="text.secondary" sx={{ mt: 2 }}>
              RAFTs provide a means for publishing preliminary but meaningful analyses of solar
              system science discoveries, facilitating community follow-up observations and
              collaboration.
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <Box
              component="img"
              src={solar.src}
              alt="Solar System Research"
              sx={{
                width: '100%',
                height: 'auto',
                borderRadius: 2,
                boxShadow: 3,
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3} sx={{ mb: 6 }}>
        {features.map((feature, index) => (
          <Grid size={{ xs: 12, md: 4 }} key={index}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>{feature.icon}</Box>
                <Typography variant="h5" component="h2" align="center" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body1" color="text.secondary" align="center">
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ mb: 6 }} />

      <Typography variant="h4" component="h2" align="center" gutterBottom>
        What would you like to do?
      </Typography>

      <Grid container spacing={4} justifyContent="center" sx={{ mt: 2 }}>
        {actionCards.map((card, index) => (
          <Grid
            size={{ xs: 12, sm: 6, md: 3 }}
            key={index}
            sx={{ display: 'flex', justifyContent: 'center' }}
          >
            <Card
              onClick={() => (card?.path ? router.push(card.path) : null)}
              sx={{
                width: { xs: '100%', sm: 240 },
                maxWidth: 280,
                height: 220,
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: 2,
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: 6,
                  bgcolor: `${card?.color}10`, // 10% opacity of the card color
                },
              }}
            >
              {card?.icon}
              <Typography variant="h6" component="div" gutterBottom>
                {card?.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {card?.description}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          RAFTs is a collaborative project supported by CADC and the solar system science community
        </Typography>
      </Box>
    </Container>
  )
}

export default LandingChoice
