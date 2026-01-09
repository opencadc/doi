'use client'
import { ReactNode, FC } from 'react'
import { CheckCircle, Circle, HelpCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Paper, IconButton, Tooltip } from '@mui/material'
import FormTutorial from '@/components/Tutorial/FormTutorial'
import { useFormTutorial } from '@/hooks/useFormTutorial'

interface Step {
  title: string
}

interface FormNavigationProps {
  currentStep: number // 0-based index
  onStepChange: (step: number) => void // Callback function for step change
  completedSteps?: boolean[] // Array indicating which steps are completed
  title: ReactNode
}

const FormNavigation: FC<FormNavigationProps> = ({
  currentStep,
  onStepChange,
  completedSteps = [],
  title,
}) => {
  const t = useTranslations('submission_form')
  const { run, stepIndex, handleJoyrideCallback, startTutorial } = useFormTutorial()

  const steps: Step[] = [
    { title: t('author_info_step') },
    { title: t('announcement_step') },
    { title: t('observation_step') },
    { title: t('miscellaneous_step') },
    { title: t('review_step') },
  ]

  return (
    <>
      <FormTutorial run={run} stepIndex={stepIndex} onCallback={handleJoyrideCallback} />
      <Paper className="relative">
        {/* Tutorial Help Button */}
        <div className="absolute top-2 right-2 z-10">
          <Tooltip title={t('help_tutorial')} arrow>
            <IconButton
              size="small"
              onClick={startTutorial}
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  color: 'primary.main',
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <HelpCircle size={20} />
            </IconButton>
          </Tooltip>
        </div>

        {/* Form Title */}
        <div className="form-navigation-title w-full flex flex-col items-center justify-between mt-4 px-4">
          {title}
        </div>

        {/* Navigation Steps */}
        <div className="form-navigation-steps w-full flex flex-col md:flex-row items-center justify-between mt-1 px-4 py-3 rounded-lg gap-2">
          {steps.map((step, index) => {
            const isCompleted = completedSteps[index] === true
            const isActive = index === currentStep

            return (
              <div
                key={index}
                className={`step-${index} flex flex-col items-center justify-center shrink-0 cursor-pointer group
                          ${index < steps.length - 1 ? 'md:flex-1' : ''}`}
                onClick={() => onStepChange(index)}
              >
                <div className="relative flex items-center justify-center w-10 h-10">
                  {isCompleted ? (
                    <CheckCircle className="text-green-500 w-8 h-8 group-hover:text-green-600 transition" />
                  ) : (
                    <Circle
                      className={`w-8 h-8 transition ${
                        isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-600'
                      }`}
                    />
                  )}
                  {index < steps.length - 1 && (
                    <div className="form-navigation-progress hidden md:block absolute h-0.5 bg-gray-300 w-full left-10 top-1/2 transform -translate-y-1/2 z-0">
                      <div
                        className={`h-full bg-green-500 transition-all duration-300`}
                        style={{ width: isCompleted ? '100%' : '0%' }}
                      />
                    </div>
                  )}
                </div>
                <span
                  className={`text-sm mt-1 transition ${
                    isActive ? 'font-bold text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
                  }`}
                >
                  {step.title}
                </span>
              </div>
            )
          })}
        </div>
      </Paper>
    </>
  )
}

export default FormNavigation
