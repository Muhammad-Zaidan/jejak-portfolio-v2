import { permanentRedirect } from 'next/navigation'

// Projects became writing in the 'project' category; old project links land on the article.
export default async function OldProject({ params }: PageProps<'/[lang]/projects/[slug]'>) {
  const { lang, slug } = await params
  permanentRedirect(`/${lang}/writing/${slug}`)
}
