import { memo } from 'react'

interface MemoizedFormSectionProps {
  children: React.ReactNode
}

export const MemoizedFormSection = memo(
  ({ children }: MemoizedFormSectionProps) => {
    return <>{children}</>
  },
  (prevProps, nextProps) => {
    // Only re-render if children actually change
    return prevProps.children === nextProps.children
  },
)

MemoizedFormSection.displayName = 'MemoizedFormSection'
