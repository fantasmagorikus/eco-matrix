import { render, screen } from '@testing-library/react'
import RootLayout from './layout'

describe('RootLayout', () => {
  it('wraps children content', () => {
    render(
      <RootLayout>
        <div data-testid="child">content</div>
      </RootLayout>
    )
    // children rendered
    expect(screen.getByTestId('child')).toHaveTextContent('content')
  })
})
