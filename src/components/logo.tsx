import Image from 'next/image'

/**
 * The JEJAK logo. The wordmark is drawn in the current text colour (white artwork would vanish on the light theme),
 * the disc keeps its own red. Numbers are the disc's place in public/brand/jejak.png.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span role="img" aria-label="Jejak" className={`relative inline-block aspect-[5833/1621] ${className ?? ''}`}>
      <span className="logo-word absolute inset-0" aria-hidden />
      <Image src="/brand/jejak-mark.png" alt="" width={256} height={256} className="absolute top-0 right-0 h-[47.8%] w-auto" />
    </span>
  )
}

/** Just the disc, for small spots. */
export function LogoMark({ className }: { className?: string }) {
  return <Image src="/brand/jejak-mark.png" alt="" aria-hidden width={256} height={256} className={className} />
}
