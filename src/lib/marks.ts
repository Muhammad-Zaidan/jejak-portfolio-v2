/** Splits a sentence into words, flagging those inside *asterisk* marks (which may span several words). */
export function splitMarks(text: string) {
  let inside = false
  return text.split(' ').map((raw) => {
    const opens = raw.startsWith('*')
    const closes = raw.replace(/[.,!?;:]+$/, '').endsWith('*')
    const accent = inside || opens
    if (opens) inside = true
    if (closes) inside = false
    return { word: raw.replace(/\*/g, ''), accent }
  })
}
