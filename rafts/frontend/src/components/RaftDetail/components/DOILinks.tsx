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

import { useState, useCallback } from 'react'
import {
  Button,
  Box,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Divider,
  CircularProgress,
  Chip,
  IconButton,
} from '@mui/material'
import { ExternalLink, Database, FileText, X, Copy, Check } from 'lucide-react'
import { STORAGE_PARTIAL_URL, STORAGE_VAULT_FILE_URL, DOI_XML_PREFIX } from '@/utilities/constants'
import { parseDataCiteXml, formatCitationText, DOICitation } from '@/utilities/dataCiteParser'
import { fetchDoiCitationXml } from '@/actions/fetchDoiCitationXml'

interface DOILinksProps {
  dataDirectory?: string
}

const DOILinks = ({ dataDirectory }: DOILinksProps) => {
  const [open, setOpen] = useState(false)
  const [citation, setCitation] = useState<DOICitation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const raftRootDir = dataDirectory?.replace(/\/data\/?$/, '') || null
  const raftFolderName = raftRootDir?.split('/').pop() || null

  const doiXmlUrl =
    raftRootDir && raftFolderName
      ? `${STORAGE_VAULT_FILE_URL}${raftRootDir.startsWith('/') ? '' : '/'}${raftRootDir}/${DOI_XML_PREFIX}${raftFolderName}.xml`
      : null

  const storageUrl = dataDirectory
    ? `${STORAGE_PARTIAL_URL}${dataDirectory.startsWith('/') ? '' : '/'}${dataDirectory}`
    : null

  const handleOpenCitation = useCallback(async () => {
    if (!dataDirectory) return
    setOpen(true)
    setLoading(true)
    setError(null)

    try {
      const result = await fetchDoiCitationXml(dataDirectory)
      if (!result.success || !result.xml) throw new Error(result.error || 'No XML returned')
      const parsed = parseDataCiteXml(result.xml)
      if (!parsed) throw new Error('Failed to parse citation XML')
      setCitation(parsed)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load citation')
    } finally {
      setLoading(false)
    }
  }, [dataDirectory])

  const handleCopyCitation = useCallback(() => {
    if (!citation) return
    navigator.clipboard.writeText(formatCitationText(citation))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [citation])

  return (
    <>
      <Box sx={{ display: 'flex', gap: 2, my: 1 }}>
        {doiXmlUrl && (
          <Tooltip title="View DOI citation">
            <Button
              variant="outlined"
              size="small"
              endIcon={<FileText size={16} />}
              onClick={handleOpenCitation}
            >
              DOI
            </Button>
          </Tooltip>
        )}

        {storageUrl && (
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
        )}
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="span">
            DOI Citation
          </Typography>
          <IconButton size="small" onClick={() => setOpen(false)}>
            <X size={20} />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Typography color="error" sx={{ py: 2 }}>
              {error}
            </Typography>
          )}

          {citation && !loading && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="overline" color="text.secondary">
                  Title
                </Typography>
                <Typography variant="h6">{citation.title}</Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="overline" color="text.secondary">
                  Identifier
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label={citation.identifierType} size="small" color="primary" />
                  <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                    {citation.identifier}
                  </Typography>
                </Box>
              </Box>

              <Divider />

              <Box>
                <Typography variant="overline" color="text.secondary">
                  {citation.creators.length === 1 ? 'Creator' : 'Creators'}
                </Typography>
                {citation.creators.map((c, i) => (
                  <Box key={i} sx={{ mb: 0.5 }}>
                    <Typography variant="body1">
                      {c.givenName} {c.familyName}
                    </Typography>
                    {c.affiliation && (
                      <Typography variant="body2" color="text.secondary">
                        {c.affiliation}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>

              <Divider />

              <Box sx={{ display: 'flex', gap: 4 }}>
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Publisher
                  </Typography>
                  <Typography variant="body1">{citation.publisher}</Typography>
                </Box>
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Year
                  </Typography>
                  <Typography variant="body1">{citation.publicationYear}</Typography>
                </Box>
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Type
                  </Typography>
                  <Typography variant="body1">{citation.resourceType}</Typography>
                </Box>
              </Box>

              {citation.dates.length > 0 && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Dates
                    </Typography>
                    {citation.dates.map((d, i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Chip label={d.dateType} size="small" variant="outlined" />
                        <Typography variant="body1">{d.date}</Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'space-between', px: 3 }}>
          <Button
            size="small"
            startIcon={copied ? <Check size={16} /> : <Copy size={16} />}
            onClick={handleCopyCitation}
            disabled={!citation}
          >
            {copied ? 'Copied' : 'Copy Citation'}
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {doiXmlUrl && (
              <Button
                size="small"
                startIcon={<ExternalLink size={16} />}
                onClick={() => window.open(doiXmlUrl, '_blank')}
              >
                View XML
              </Button>
            )}
            <Button onClick={() => setOpen(false)}>Close</Button>
          </Box>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default DOILinks
