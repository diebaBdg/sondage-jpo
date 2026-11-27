import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RAHMAH – 25 ans | Sondage JPO',
  description: 'La famille RAHMAH se retrouve ! À l’occasion de nos 25 ans, aidez-nous à mieux organiser votre accueil pour la Journée Portes Ouvertes en répondant à ce court sondage.',
  applicationName: 'Rahmah',
}
export const viewport: Viewport = { colorScheme:'light', themeColor:'#f8f6f1', width:'device-width', initialScale:1 }
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="fr"><body className="antialiased">{children}</body></html>
}
