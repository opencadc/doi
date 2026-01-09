'use client'

import { useState, useEffect } from 'react'
import { CallBackProps, STATUS } from 'react-joyride'

interface UseSectionTutorialProps {
  sectionName: string
  autoStart?: boolean
}

export const useSectionTutorial = ({ sectionName, autoStart = false }: UseSectionTutorialProps) => {
  const [run, setRun] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)

  const TUTORIAL_KEY = `raft-${sectionName}-tutorial-completed`

  // Check if tutorial has been completed before
  useEffect(() => {
    if (autoStart) {
      const hasCompletedTutorial = localStorage.getItem(TUTORIAL_KEY)
      if (!hasCompletedTutorial) {
        // Start tutorial after a short delay for better UX
        setTimeout(() => setRun(true), 1500)
      }
    }
  }, [autoStart, TUTORIAL_KEY])

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, index } = data
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED]

    if (finishedStatuses.includes(status)) {
      // Mark tutorial as completed
      localStorage.setItem(TUTORIAL_KEY, 'true')
      setRun(false)
    } else if (type === 'step:after') {
      // Move to next step
      setStepIndex(index + 1)
    }
  }

  const startTutorial = () => {
    setStepIndex(0)
    setRun(true)
  }

  const resetTutorial = () => {
    localStorage.removeItem(TUTORIAL_KEY)
    setStepIndex(0)
    setRun(true)
  }

  const hasCompletedTutorial = () => {
    return localStorage.getItem(TUTORIAL_KEY) === 'true'
  }

  return {
    run,
    stepIndex,
    handleJoyrideCallback,
    startTutorial,
    resetTutorial,
    hasCompletedTutorial,
  }
}
