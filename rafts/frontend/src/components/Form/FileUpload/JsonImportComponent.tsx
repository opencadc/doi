import React, { useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
  Typography,
  Alert,
  AlertTitle,
  Divider,
  IconButton,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel,
  Paper,
} from '@mui/material'
import { FileJson, Download, Upload, X, AlertTriangle, Check } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRaftForm } from '@/context/RaftFormContext'
import { TRaftContext } from '@/context/types'
import FileUpload from './FileUpload'
import { downloadJsonAsFile } from './utils'

/**
 * Component that provides JSON import/export functionality for the RAFT form
 * Shows a button that opens a dialog for importing/exporting JSON data
 */
const JsonImportComponent: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [importStep, setImportStep] = useState(0)
  const [tempFormData, setTempFormData] = useState<TRaftContext | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)

  const t = useTranslations('exim_form')
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'))

  // Access the RAFT form context to get current form data
  const { setFormFromFile, raftData } = useRaftForm()

  // Open the main dialog
  const handleOpenDialog = () => {
    setDialogOpen(true)
    // Reset states when opening dialog
    setImportStep(0)
    setImportSuccess(false)
    setTempFormData(null)
  }

  // Close the main dialog
  const handleCloseDialog = () => {
    setDialogOpen(false)
  }

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  // Handle when a file is loaded by the FileUpload component
  const handleFileLoaded = (data: TRaftContext) => {
    setTempFormData(data)
    setImportStep(1) // Move to confirmation step
  }

  // Handle confirmation of import
  const confirmImport = () => {
    if (tempFormData) {
      setFormFromFile(tempFormData)
      setImportStep(2) // Move to success step
      setImportSuccess(true)
    }
  }

  // Reset the import process
  const resetImport = () => {
    setImportStep(0)
    setTempFormData(null)
    setImportSuccess(false)
  }

  // Handle export of current form data
  const handleExport = () => {
    if (raftData) {
      const filename = `raft-${new Date().toISOString().split('T')[0]}.json`
      downloadJsonAsFile(raftData, filename)
    }
  }

  // Import process steps
  const importSteps = [
    { label: t('select_file_step') || 'Select File', icon: <Upload size={16} /> },
    { label: t('confirm_step') || 'Confirm', icon: <AlertTriangle size={16} /> },
    { label: t('complete_step') || 'Complete', icon: <Check size={16} /> },
  ]

  // Render import content based on current step
  const renderImportContent = () => {
    switch (importStep) {
      case 0: // File selection
        return (
          <Box sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              {t('select_file_to_import') || 'Select a RAFT JSON file to import'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t('import_json_description') ||
                'The file should be a valid RAFT JSON export. Importing will replace your current form data.'}
            </Typography>
            <Box
              sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <FileUpload
                onFileLoaded={handleFileLoaded}
                label={t('select_file') || 'Select JSON File'}
                hint={t('drag_drop_hint') || 'Drag and drop a file here or click to browse'}
                showPreview={true}
              />
            </Box>
          </Box>
        )

      case 1: // Confirmation
        return (
          <Box sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <Alert severity="warning" sx={{ mb: 3 }}>
              <AlertTitle>{t('confirm_import') || 'Confirm Data Import'}</AlertTitle>
              <Typography variant="body2">
                {t('confirm_import_message') ||
                  'Importing will replace any existing data in your form. This action cannot be undone.'}
              </Typography>
            </Alert>

            <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {t('file_preview') || 'File Preview'}:
              </Typography>
              <Typography
                variant="body2"
                component="pre"
                sx={{
                  maxHeight: '200px',
                  overflow: 'auto',
                  p: 2,
                  bgcolor: 'action.hover',
                  borderRadius: 1,
                  fontSize: '0.75rem',
                }}
              >
                {JSON.stringify(tempFormData, null, 2)}
              </Typography>
            </Paper>

            <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={resetImport} color="inherit">
                {t('back') || 'Back'}
              </Button>
              <Button
                onClick={confirmImport}
                color="primary"
                variant="contained"
                startIcon={<Upload size={16} />}
              >
                {t('confirm_import_button') || 'Import Data'}
              </Button>
            </Box>
          </Box>
        )

      case 2: // Success
        return (
          <Box
            sx={{
              p: 3,
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'success.light',
                color: 'success.contrastText',
                borderRadius: '50%',
                p: 2,
                mb: 3,
              }}
            >
              <Check size={48} />
            </Box>

            <Typography variant="h6" align="center" gutterBottom>
              {t('import_success') || 'Import Successful!'}
            </Typography>

            <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
              {t('import_success_message') ||
                'Your RAFT data has been successfully imported and applied to the form.'}
            </Typography>

            <Button onClick={handleCloseDialog} color="primary" variant="contained">
              {t('continue') || 'Continue'}
            </Button>
          </Box>
        )

      default:
        return null
    }
  }

  // Render export section
  const renderExportContent = () => {
    return (
      <Box sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" gutterBottom>
          {t('export_raft_data') || 'Export Your RAFT Data'}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          {t('export_json_description') ||
            'Download your current form data as a JSON file. You can use this file later to import and restore your form.'}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flexGrow: 1,
            p: 4,
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: 'action.hover',
          }}
        >
          {!raftData || Object.keys(raftData).length === 0 ? (
            <>
              <AlertTriangle
                size={40}
                color={theme.palette.warning.main}
                style={{ marginBottom: 2 }}
              />
              <Typography variant="body1" color="text.secondary" align="center">
                {t('no_data_to_export') || 'No form data available to export'}
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                {t('fill_form_first') || 'Please fill in some form data before exporting'}
              </Typography>
            </>
          ) : (
            <>
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<Download />}
                onClick={handleExport}
                sx={{ mb: 2 }}
              >
                {t('download_json_file') || 'Download JSON File'}
              </Button>
              <Typography variant="body2" color="text.secondary" align="center">
                {t('click_to_download') || 'Click to download your form data as a JSON file'}
              </Typography>
            </>
          )}
        </Box>
      </Box>
    )
  }

  return (
    <>
      {/* Main button to open the dialog */}
      <Button
        variant="contained"
        startIcon={<FileJson size={18} />}
        onClick={handleOpenDialog}
        size="large"
        sx={{ ml: 2 }}
      >
        {t('import_export_json') || 'Import/Export RAFT Data'}
      </Button>

      {/* Main Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={
          importSuccess ? handleCloseDialog : importStep === 0 ? handleCloseDialog : resetImport
        }
        fullScreen={fullScreen}
        maxWidth="md"
        PaperProps={{
          sx: {
            height: fullScreen ? '100%' : '80vh',
            width: '100%',
            maxWidth: fullScreen ? '100%' : '800px',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <DialogTitle
          sx={{
            px: 3,
            py: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FileJson size={24} />
            <Typography variant="h6">
              {t('json_import_export') || 'Import/Export RAFT Data'}
            </Typography>
          </Box>
          <IconButton
            edge="end"
            color="inherit"
            onClick={
              importSuccess ? handleCloseDialog : importStep === 0 ? handleCloseDialog : resetImport
            }
            aria-label="close"
          >
            <X size={20} />
          </IconButton>
        </DialogTitle>

        <Divider />

        {/* Only show tabs if we're not in the midst of an import flow or it's the first step */}
        {(importStep === 0 || activeTab === 1) && (
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              aria-label="import export tabs"
              sx={{ px: 3 }}
            >
              <Tab
                icon={<Upload size={16} />}
                iconPosition="start"
                label={t('import') || 'Import'}
                id="import-tab"
                aria-controls="import-panel"
                onClick={() => {
                  if (importStep > 0) resetImport()
                }}
              />
              <Tab
                icon={<Download size={16} />}
                iconPosition="start"
                label={t('export') || 'Export'}
                id="export-tab"
                aria-controls="export-panel"
              />
            </Tabs>
          </Box>
        )}

        {/* Show stepper when in import flow and not on first step */}
        {activeTab === 0 && importStep > 0 && (
          <Box sx={{ px: 3, pt: 2 }}>
            <Stepper activeStep={importStep} alternativeLabel>
              {importSteps.map((step, index) => (
                <Step key={index} completed={importStep > index}>
                  <StepLabel
                    StepIconProps={{
                      icon: step.icon,
                    }}
                  >
                    {step.label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
        )}

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, p: 0 }}>
          {activeTab === 0 && renderImportContent()}
          {activeTab === 1 && renderExportContent()}
        </DialogContent>

        {/* Only show actions if not in import flow or at start */}
        {(activeTab === 1 || (activeTab === 0 && importStep === 0)) && (
          <>
            <Divider />
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={handleCloseDialog} color="primary">
                {t('close') || 'Close'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  )
}

export default JsonImportComponent
