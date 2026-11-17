import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Journée portes ouvertes | École Rahmah',
  description: 'Confirmez votre présence à la journée portes ouvertes de l’école Rahmah et indiquez le nombre de personnes qui vous accompagneront.',
  applicationName: 'Rahmah',
}
export const viewport: Viewport = { colorScheme:'light', themeColor:'#f8f6f1', width:'device-width', initialScale:1 }
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="fr"><body className="antialiased">{children}</body></html>
}
