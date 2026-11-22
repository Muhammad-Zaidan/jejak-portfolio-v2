import { Bricolage_Grotesque, Geist, IBM_Plex_Mono, Newsreader, Space_Grotesk } from 'next/font/google'

const grotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-grotesk' })
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-plex-mono' })
const serif = Newsreader({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--font-newsreader' })
// New direction: clean sans for text, a sans with character for the main hierarchy.
const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const bricolage = Bricolage_Grotesque({ subsets: ['latin'], axes: ['opsz', 'wdth'], variable: '--font-bricolage' })

export const fontVars = `${grotesk.variable} ${mono.variable} ${serif.variable} ${geist.variable} ${bricolage.variable}`
