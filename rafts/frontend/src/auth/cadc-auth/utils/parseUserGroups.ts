export const parseUserGroups = (responseText: string): string[] => {
  if (!responseText) {
    return []
  }

  // Split the text by newlines to get individual lines
  const lines = responseText.split('\n')

  // Filter out empty lines and any content type metadata
  const groups = lines.filter(
    (line) =>
      line.trim() !== '' && !line.startsWith('content/type') && !line.includes('content/type'),
  )

  // Remove any leading/trailing whitespace from each group name
  return groups.map((group) => group.trim())
}
