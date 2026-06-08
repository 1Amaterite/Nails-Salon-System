export interface ParsedClientNotes {
  safety: string;
  preferences: string;
  general: string;
}

/**
 * Parses a combined notes string containing structured sections like [Safety],
 * [Preferences], and [General] into separate strings.
 */
export function parseClientNotes(notesStr: string | null | undefined): ParsedClientNotes {
  const result: ParsedClientNotes = {
    safety: '',
    preferences: '',
    general: '',
  };
  if (!notesStr) return result;

  const safetyMatch = notesStr.match(/\[Safety\](.*?)(?=\[|$)/s);
  const prefMatch = notesStr.match(/\[Preferences\](.*?)(?=\[|$)/s);
  const generalMatch = notesStr.match(/\[General\](.*?)(?=\[|$)/s);

  result.safety = safetyMatch ? safetyMatch[1].trim() : '';
  result.preferences = prefMatch ? prefMatch[1].trim() : '';

  if (!safetyMatch && !prefMatch && !generalMatch) {
    result.general = notesStr.trim();
  } else {
    result.general = generalMatch ? generalMatch[1].trim() : '';
  }

  return result;
}
