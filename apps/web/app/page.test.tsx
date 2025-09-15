import { render, screen } from '@testing-library/react'
import HomePage from './page'

describe('HomePage', () => {
  it('renders Eco Matrix heading', () => {
    render(<HomePage />)
    expect(
      screen.getByRole('heading', { name: /eco matrix/i })
    ).toBeInTheDocument()
  })
})

