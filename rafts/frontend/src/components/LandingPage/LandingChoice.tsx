/*
 ************************************************************************
 *******************  CANADIAN ASTRONOMY DATA CENTRE  *******************
 **************  CENTRE CANADIEN DE DONNÉES ASTRONOMIQUES  **************
 *
 *  (c) 2026.                            (c) 2026.
 *  Government of Canada                 Gouvernement du Canada
 *  National Research Council            Conseil national de recherches
 *  Ottawa, Canada, K1A 0R6              Ottawa, Canada, K1A 0R6
 *  All rights reserved                  Tous droits réservés
 *
 *  NRC disclaims any warranties,        Le CNRC dénie toute garantie
 *  expressed, implied, or               énoncée, implicite ou légale,
 *  statutory, of any kind with          de quelque nature que ce
 *  respect to the software,             soit, concernant le logiciel,
 *  including without limitation         y compris sans restriction
 *  any warranty of merchantability      toute garantie de valeur
 *  or fitness for a particular          marchande ou de pertinence
 *  purpose. NRC shall not be            pour un usage particulier.
 *  liable in any event for any          Le CNRC ne pourra en aucun cas
 *  damages, whether direct or           être tenu responsable de tout
 *  indirect, special or general,        dommage, direct ou indirect,
 *  consequential or incidental,         particulier ou général,
 *  arising from the use of the          accessoire ou fortuit, résultant
 *  software.  Neither the name          de l'utilisation du logiciel. Ni
 *  of the National Research             le nom du Conseil National de
 *  Council of Canada nor the            Recherches du Canada ni les noms
 *  names of its contributors may        de ses  participants ne peuvent
 *  be used to endorse or promote        être utilisés pour approuver ou
 *  products derived from this           promouvoir les produits dérivés
 *  software without specific prior      de ce logiciel sans autorisation
 *  written permission.                  préalable et particulière
 *                                       par écrit.
 *
 *  This file is part of the             Ce fichier fait partie du projet
 *  OpenCADC project.                    OpenCADC.
 *
 *  OpenCADC is free software:           OpenCADC est un logiciel libre ;
 *  you can redistribute it and/or       vous pouvez le redistribuer ou le
 *  modify it under the terms of         modifier suivant les termes de
 *  the GNU Affero General Public        la "GNU Affero General Public
 *  License as published by the          License" telle que publiée
 *  Free Software Foundation,            par la Free Software Foundation
 *  either version 3 of the              : soit la version 3 de cette
 *  License, or (at your option)         licence, soit (à votre gré)
 *  any later version.                   toute version ultérieure.
 *
 *  OpenCADC is distributed in the       OpenCADC est distribué
 *  hope that it will be useful,         dans l'espoir qu'il vous
 *  but WITHOUT ANY WARRANTY;            sera utile, mais SANS AUCUNE
 *  without even the implied             GARANTIE : sans même la garantie
 *  warranty of MERCHANTABILITY          implicite de COMMERCIALISABILITÉ
 *  or FITNESS FOR A PARTICULAR          ni d'ADÉQUATION À UN OBJECTIF
 *  PURPOSE.  See the GNU Affero         PARTICULIER. Consultez la Licence
 *  General Public License for           Générale Publique GNU Affero
 *  more details.                        pour plus de détails.
 *
 *  You should have received             Vous devriez avoir reçu une
 *  a copy of the GNU Affero             copie de la Licence Générale
 *  General Public License along         Publique GNU Affero avec
 *  with OpenCADC.  If not, see          OpenCADC ; si ce n'est
 *  <http://www.gnu.org/licenses/>.      pas le cas, consultez :
 *                                       <http://www.gnu.org/licenses/>.
 *
 ************************************************************************
 */

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
  ManageSearch as PublicViewIcon,
  List as ListIcon,
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
      description: t('rapid_publication_desc'),
    },
    {
      icon: <ScienceIcon fontSize="large" sx={{ color: theme.palette.primary.main }} />,
      title: t('solar_system_science'),
      description: t('solar_system_science_desc'),
    },
    {
      icon: <VisibilityIcon fontSize="large" sx={{ color: theme.palette.primary.main }} />,
      title: t('community_access'),
      description: t('community_access_desc'),
    },
  ]

  const actionCards = useMemo(
    () =>
      [
        {
          title: t('create_raft'),
          description: t('create_raft_desc'),
          icon: <CreateIcon sx={{ fontSize: 60, color: theme.palette.primary.main, mb: 2 }} />,
          color: theme.palette.primary.main,
          path: '/form/create',
          roles: ['contributor', 'reviewer', 'admin'],
        },
        {
          title: t('view_rafts'),
          description: t('view_rafts_desc'),
          icon: <ViewIcon sx={{ fontSize: 60, color: theme.palette.secondary.main, mb: 2 }} />,
          color: theme.palette.secondary.main,
          path: '/view/rafts',
          roles: ['contributor', 'reviewer'],
        },
        {
          title: t('browse_published'),
          description: t('browse_published_desc'),
          icon: (
            <PublicViewIcon sx={{ fontSize: 60, color: theme.palette.secondary.main, mb: 2 }} />
          ),
          color: theme.palette.secondary.main,
          path: '/public-view/rafts',
          roles: [],
        },
        {
          title: t('review_rafts'),
          description: t('review_rafts_desc'),
          icon: <ListIcon sx={{ fontSize: 60, color: theme.palette.secondary.main, mb: 2 }} />,
          color: theme.palette.secondary.main,
          path: '/review/rafts',
          roles: ['reviewer', 'admin'],
        },
      ].filter((c) => {
        return (
          (userRole && (c?.roles.includes(userRole) || c?.roles.length === 0)) ||
          (!userRole && c?.roles.length === 0)
        )
      }),
    [userRole, theme.palette.primary.main, theme.palette.secondary.main, t],
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
              {t('hero_title')}
            </Typography>
            <Typography variant="h6" color="text.secondary" component={'p'}>
              {t('hero_subtitle')}
            </Typography>
            <Typography component={'p'} variant="body1" color="text.secondary" sx={{ mt: 2 }}>
              {t('hero_description')}
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
        {t('what_to_do')}
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

      <Box sx={{ mt: 6, mb: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {t('published_info')}
        </Typography>
      </Box>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {t('footer_text')}
        </Typography>
      </Box>
    </Container>
  )
}

export default LandingChoice
