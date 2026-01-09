'use client'

import { useState, useEffect } from 'react'
import { CallBackProps, STATUS } from 'react-joyride'

const TUTORIAL_KEY = 'raft-form-tutorial-completed'

export const useFormTutorial = () => {
  const [run, setRun] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)

  // Check if tutorial has been completed before
  useEffect(() => {
    const hasCompletedTutorial = localStorage.getItem(TUTORIAL_KEY)
    if (!hasCompletedTutorial) {
      // Start tutorial after a short delay for better UX
      setTimeout(() => setRun(true), 1000)
    }
  }, [])

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

  return {
    run,
    stepIndex,
    handleJoyrideCallback,
    startTutorial,
    resetTutorial,
  }
}
