import type { ZodSchema, ZodError } from 'zod';

/**
 * Creates an item validator function from a Zod schema.
 * 
 * @param schema Zod schema for a single item
 * @param options Configuration options
 * @returns Validator function compatible with useRepeatable
 */
export function createZodItemValidator<TItem>(
  schema: ZodSchema<TItem>,
  options?: {
    mapError?: (error: ZodError) => string;
  }
) {
  return (item: TItem): string | null => {
    const result = schema.safeParse(item);
    
    if (result.success) {
      return null;
    }

    if (options?.mapError) {
      return options.mapError(result.error);
    }

    // Default error mapping: return the first error message
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (result.error as any).errors?.[0]?.message || (result.error as any).issues?.[0]?.message || 'Invalid item';
  };
}

/**
 * Creates an array validator function from a Zod array schema.
 * Useful for validating uniqueness or collection-wide constraints.
 * 
 * @param schema Zod schema for the array of items
 * @param options Configuration options
 * @returns Validator function compatible with useRepeatable
 */
export function createZodArrayValidator<TItem>(
  schema: ZodSchema<TItem[]>,
  options?: {
    mapErrors?: (error: ZodError) => string[];
  }
) {
  return (items: TItem[]): (string | null)[] | null => {
    const result = schema.safeParse(items);
    
    if (result.success) {
      return null;
    }

    if (options?.mapErrors) {
      const customErrors = options.mapErrors(result.error);
      const mappedErrors = new Array(items.length).fill(null);
      customErrors.forEach((err, i) => {
        if (i < mappedErrors.length) mappedErrors[i] = err;
      });
      return mappedErrors;
    }

    const errors: (string | null)[] = new Array(items.length).fill(null);
    let hasMappedError = false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const issues = (result.error as any).errors || (result.error as any).issues || [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    issues.forEach((issue: any) => {
      const index = issue.path[0];
      
      if (typeof index === 'number' && index >= 0 && index < items.length) {
        if (!errors[index]) {
          errors[index] = issue.message;
        } else {
          errors[index] += `, ${issue.message}`;
        }
        hasMappedError = true;
      } else {
        if (items.length > 0) {
           const existing = errors[0];
           errors[0] = existing ? `${existing} (${issue.message})` : issue.message;
           hasMappedError = true;
        }
      }
    });

    return hasMappedError ? errors : null;
  };
}
