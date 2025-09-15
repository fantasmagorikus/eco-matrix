export const metadata = {
  title: 'Eco Matrix',
  description: 'Eco Matrix – Next.js app',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0 }}>
        {children}
      </body>
    </html>
  )
}

