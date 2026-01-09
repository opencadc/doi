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
