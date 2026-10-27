import Image from 'next/image'
import { connection } from 'next/server'
import { Storefront } from '@/components/pikstore/storefront'

export default async function Page() {
  await connection()
  const dateLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date())

  return (
    <>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
        <Image src="/wallpaper.png" alt="" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-background/35" />
      </div>
      <Storefront dateLabel={dateLabel} />
    </>
  )
}
