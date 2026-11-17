export const metadata: Metadata = {
  title: 'JPO — Journée portes ouvertes | École RAHMAH',
  description: 'Confirmez votre présence à la JPO de l’école RAHMAH, indiquez le nombre de participants et votre heure d’arrivée entre 9 h et 17 h.',
  applicationName: 'RAHMAH ALUMNI',
}
export const viewport: Viewport = { colorScheme:'light', themeColor:'#f8f6f1', width:'device-width', initialScale:1 }
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="fr"><body className="antialiased">{children}</body></html>
}
