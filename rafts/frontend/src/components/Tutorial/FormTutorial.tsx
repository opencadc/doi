'use client'

import React, { useState, useEffect } from 'react'
import Joyride, { CallBackProps, Step, Styles } from 'react-joyride'
import { useTheme } from '@mui/material/styles'
import { useTranslations } from 'next-intl'

interface FormTutorialProps {
  run: boolean
  stepIndex: number
  onCallback: (data: CallBackProps) => void
}

const FormTutorial: React.FC<FormTutorialProps> = ({ run, stepIndex, onCallback }) => {
  const theme = useTheme()
  const t = useTranslations('tutorial')

  // Only render Joyride on client to avoid hydration mismatch
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Define steps for the tutorial
  const steps: Step[] = [
    {
      target: '.form-navigation-title',
      content: t('step_title'),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '.form-navigation-steps',
      content: t('step_navigation'),
      placement: 'bottom',
    },
    {
      target: '.step-0',
      content: t('step_author_info'),
      placement: 'bottom',
    },
    {
      target: '.step-1',
      content: t('step_announcement'),
      placement: 'bottom',
    },
    {
      target: '.step-2',
      content: t('step_observation'),
      placement: 'bottom',
    },
    {
      target: '.step-3',
      content: t('step_miscellaneous'),
      placement: 'bottom',
    },
    {
      target: '.step-4',
      content: t('step_review'),
      placement: 'bottom',
    },
    {
      target: '.form-navigation-progress',
      content: t('step_progress'),
      placement: 'top',
    },
    {
      target: '.save-as-draft-button',
      content: t('step_save_as_draft'),
      placement: 'left',
    },
    {
      target: '.submit-button',
      content: t('step_submit'),
      placement: 'left',
    },
  ]

  // Custom styles to match Material UI theme
  const joyrideStyles: Partial<Styles> = {
    options: {
      primaryColor: theme.palette.primary.main,
      backgroundColor: theme.palette.background.paper,
      textColor: theme.palette.text.primary,
      arrowColor: theme.palette.background.paper,
      overlayColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.5)',
      zIndex: 10000,
    },
    spotlight: {
      backgroundColor: 'transparent',
      border: `2px solid ${theme.palette.primary.main}`,
      borderRadius: theme.shape.borderRadius,
    },
    tooltip: {
      backgroundColor: theme.palette.background.paper,
      borderRadius: theme.shape.borderRadius,
      color: theme.palette.text.primary,
      fontSize: theme.typography.body1.fontSize,
      padding: theme.spacing(2),
      boxShadow: theme.shadows[4],
    },
    tooltipContainer: {
      textAlign: 'left',
    },
    tooltipContent: {
      padding: `${theme.spacing(1)} 0`,
    },
    buttonNext: {
      backgroundColor: theme.palette.primary.main,
      borderRadius: theme.shape.borderRadius,
      color: theme.palette.primary.contrastText,
      fontSize: theme.typography.button.fontSize,
      padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
    },
    buttonBack: {
      color: theme.palette.text.secondary,
      fontSize: theme.typography.button.fontSize,
      marginRight: theme.spacing(1),
      padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
    },
    buttonSkip: {
      color: theme.palette.text.secondary,
      fontSize: theme.typography.button.fontSize,
      padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
    },
    buttonClose: {
      color: theme.palette.text.secondary,
      padding: theme.spacing(0.5),
      position: 'absolute',
      right: theme.spacing(1),
      top: theme.spacing(1),
    },
  }

  // Don't render on server to avoid hydration mismatch
  if (!mounted) {
    return null
  }

  return (
    <Joyride
      run={run}
      stepIndex={stepIndex}
      steps={steps}
      callback={onCallback}
      continuous
      showProgress
      showSkipButton
      disableCloseOnEsc={false}
      disableOverlayClose={false}
      spotlightClicks
      styles={joyrideStyles}
      locale={{
        back: t('button_back'),
        close: t('button_close'),
        last: t('button_last'),
        next: t('button_next'),
        skip: t('button_skip'),
      }}
    />
  )
}

export default FormTutorial
