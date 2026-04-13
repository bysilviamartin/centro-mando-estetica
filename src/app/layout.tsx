import type { Metadata } from 'next'
import { Playfair_Display, Montserrat } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair',
})

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
})

export const metadata: Metadata = {
  title: 'Silvia Martín | Dashboard Financiero',
  description: 'Control financiero para centro de estética',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${playfair.variable} ${montserrat.variable}`}>
        <div className="app-container">
          <Sidebar />
          <div className="main-content">
            <Topbar />
            <main className="page-wrapper animate-fade-in">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}
