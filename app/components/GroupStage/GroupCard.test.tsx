import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { GroupCard } from './GroupCard'
import { bracketStore } from '../../store/bracketStore'
import { groupScoreStore } from '../../store/groupScoreStore'
import { EMPTY_STATE } from '../../lib/encoding'

beforeEach(() => {
  bracketStore.getState().loadState(EMPTY_STATE)
  groupScoreStore.setState({ scores: {}, overrides: {} })
})

describe('GroupCard', () => {
  it('renders group label and teams', () => {
    render(<GroupCard groupKey="D" />)
    expect(screen.getByText('Group D')).toBeInTheDocument()
    expect(screen.getByText('United States')).toBeInTheDocument()
    expect(screen.getByText('Paraguay')).toBeInTheDocument()
    expect(screen.getByText('Australia')).toBeInTheDocument()
    expect(screen.getByText('UEFA PO-C')).toBeInTheDocument()
  })

  it('clicking a team sets first pick', () => {
    render(<GroupCard groupKey="D" />)
    fireEvent.click(screen.getByText('United States'))
    expect(bracketStore.getState().groups.D.first).toBe('USA')
  })

  it('clicking same team twice deselects it', () => {
    render(<GroupCard groupKey="D" />)
    fireEvent.click(screen.getByText('United States'))
    fireEvent.click(screen.getByText('United States'))
    expect(bracketStore.getState().groups.D.first).toBeNull()
  })

  it('clicking two teams sets first and second picks', () => {
    render(<GroupCard groupKey="D" />)
    fireEvent.click(screen.getByText('United States'))
    fireEvent.click(screen.getByText('Paraguay'))
    expect(bracketStore.getState().groups.D.first).toBe('USA')
    expect(bracketStore.getState().groups.D.second).toBe('PAR')
  })
})
