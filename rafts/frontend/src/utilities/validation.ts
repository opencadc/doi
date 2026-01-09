import { VALIDATION_SCHEMAS } from '@/context/constants'
import { ZodError } from 'zod'

/**
 * Validates an object against a Zod schema
 *
 * @param schema - The Zod schema to validate against
 * @param data - The object to validate
 * @returns True if valid, false otherwise
 */
export const validateWithSchema = <T extends keyof typeof VALIDATION_SCHEMAS>(
  schema: (typeof VALIDATION_SCHEMAS)[T],
  data: unknown,
): boolean => {
  try {
    // Attempt to parse the data with the schema
    schema.parse(data)
    //console.log('schema.parse(data)', schema.parse(data))
    return true
  } catch {
    // If Zod throws an error, the validation failed
    return false
  }
}

/**
 * Validates an object against a Zod schema and returns formatted errors
 *
 * @param schema - The Zod schema to validate against
 * @param data - The object to validate
 * @returns Object with field errors or undefined if valid
 */
interface ValidationErrorObject {
  [key: string]: string | ValidationErrorObject
}

type ValidationError = string | ValidationErrorObject

export const getValidationErrors = <T extends keyof typeof VALIDATION_SCHEMAS>(
  schema: (typeof VALIDATION_SCHEMAS)[T],
  data: unknown,
): Record<string, ValidationError> | undefined => {
  try {
    schema.parse(data)
    return undefined
  } catch (error) {
    if (error instanceof ZodError) {
      // Convert ZodError to a nested object structure matching the data structure
      const formattedErrors: Record<string, ValidationError> = {}

      error.issues.forEach((err) => {
        let current = formattedErrors
        const path = [...err.path]
        const lastKey = path.pop()

        // Navigate to the correct nested level
        path.forEach((key) => {
          const keyStr = String(key)
          if (!current[keyStr]) {
            current[keyStr] = {}
          }
          current = current[keyStr] as Record<string, ValidationError>
        })

        // Set the error message at the final key
        if (lastKey !== undefined) {
          current[String(lastKey)] = err.message
        }
      })

      return formattedErrors
    }
    return undefined
  }
}
