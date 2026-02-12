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

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RaftReview } from '@/types/reviews'
import { submitReviewComment } from '@/actions/submitReviewComment'
import {
  Paper,
  Box,
  Typography,
  TextField,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  IconButton,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material'
import { Send } from 'lucide-react'
import { formatDate, formatUserName, getUserInitials } from '@/utilities/formatter'

interface CommentSectionProps {
  review?: RaftReview
  onNotify: (type: 'success' | 'error', text: string) => void
}

export default function CommentSection({ review, onNotify }: CommentSectionProps) {
  const router = useRouter()
  const [newComment, setNewComment] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  if (!review) {
    return null
  }
  // Handle comment submission
  const handleSubmitComment = async () => {
    if (!newComment.trim()) return

    setActionLoading(true)
    try {
      const result = await submitReviewComment(review._id, {
        content: newComment,
      })

      if (result.success) {
        setNewComment('')
        // Show success message
        onNotify('success', 'Comment added successfully')
        // Refresh the page to get updated review data
        router.refresh()
      } else {
        onNotify('error', result.error || 'Failed to add comment')
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      onNotify('error', 'An unexpected error occurred while adding your comment')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        Review Comments
      </Typography>

      {review.comments.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          No comments have been added yet.
        </Alert>
      ) : (
        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
          {review.comments.map((comment) => (
            <ListItem key={comment._id} alignItems="flex-start" sx={{ py: 2 }}>
              <ListItemAvatar>
                <Avatar>{getUserInitials(comment.createdBy)}</Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography component="span" variant="subtitle2">
                    {formatUserName(comment.createdBy)} - {formatDate(comment.createdAt)}
                  </Typography>
                }
                secondary={
                  <Box sx={{ mt: 1 }}>
                    <Typography
                      sx={{ display: 'inline', wordBreak: 'break-word' }}
                      component="span"
                      variant="body2"
                      color="text.primary"
                    >
                      {comment.content}
                    </Typography>
                    {comment.isResolved && (
                      <Chip size="small" label="Resolved" color="success" sx={{ ml: 1, mt: 1 }} />
                    )}
                    {comment.location && (
                      <Chip
                        size="small"
                        label={`Location: ${comment.location}`}
                        color="info"
                        variant="outlined"
                        sx={{ ml: 1, mt: 1 }}
                      />
                    )}
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      )}

      <Divider sx={{ my: 2 }} />

      {/* New comment form */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <Avatar sx={{ bgcolor: 'primary.main' }}>
          {/* Use the current user's initials - can be customized based on your auth */}U
        </Avatar>
        <TextField
          fullWidth
          multiline
          rows={3}
          placeholder="Add your review comments here..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          variant="outlined"
        />
        <IconButton
          color="primary"
          sx={{ mt: 1 }}
          onClick={handleSubmitComment}
          disabled={!newComment.trim() || actionLoading}
        >
          {actionLoading ? <CircularProgress size={24} /> : <Send />}
        </IconButton>
      </Box>
    </Paper>
  )
}
