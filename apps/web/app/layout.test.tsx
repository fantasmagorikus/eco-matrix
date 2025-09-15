import React from 'react'
import RootLayout, { metadata } from './layout'

describe('RootLayout', () => {
  it('returns <html lang="en"> with body children', () => {
    const child = <div data-testid="child">hi</div>
    const element = RootLayout({ children: child }) as any

    expect(metadata.title).toBe('Eco Matrix')
    expect(metadata.description).toMatch(/Next.js app/i)

    expect(element.type).toBe('html')
    expect(element.props.lang).toBe('en')
    const body = element.props.children
    expect(body.type).toBe('body')
    expect(body.props.children).toBe(child)
  })
})
