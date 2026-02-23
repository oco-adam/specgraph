export function toolSuccess(structuredContent: unknown): {
  content: Array<{ type: 'text'; text: string }>;
  structuredContent: Record<string, unknown>;
} {
  const safeStructuredContent = toStructuredContent(structuredContent);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(structuredContent, null, 2)
      }
    ],
    structuredContent: safeStructuredContent
  };
}

export function toolError(error: unknown): {
  isError: true;
  content: Array<{ type: 'text'; text: string }>;
} {
  return {
    isError: true,
    content: [
      {
        type: 'text',
        text: error instanceof Error ? error.message : String(error)
      }
    ]
  };
}

function toStructuredContent(value: unknown): Record<string, unknown> {
  if (isRecord(value)) {
    return value;
  }

  return {
    result: value
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
