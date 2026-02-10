// ============================================================
// Tests — InventoryPanel Component
// ============================================================
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InventoryPanel from '@/components/game/InventoryPanel';
import { useGameStore } from '@/store/gameStore';

describe('InventoryPanel', () => {
  beforeEach(() => {
    useGameStore.getState().newGame();
  });

  it('should render the header', () => {
    render(<InventoryPanel />);
    expect(screen.getByText('Inventory')).toBeInTheDocument();
  });

  it('should render all resource types', () => {
    render(<InventoryPanel />);
    expect(screen.getByText('fuel')).toBeInTheDocument();
    expect(screen.getByText('water')).toBeInTheDocument();
    expect(screen.getByText('food')).toBeInTheDocument();
    expect(screen.getByText('gold')).toBeInTheDocument();
    expect(screen.getByText('contraband')).toBeInTheDocument();
    expect(screen.getByText('information')).toBeInTheDocument();
  });

  it('should show resource values', () => {
    render(<InventoryPanel />);
    expect(screen.getByText('500')).toBeInTheDocument(); // gold
    expect(screen.getAllByText('100').length).toBe(3); // fuel, water, food
  });

  it('should show low resource warnings', () => {
    useGameStore.getState().addResources({ fuel: -95 }); // fuel = 5
    render(<InventoryPanel />);
    expect(screen.getByText('Low!')).toBeInTheDocument();
  });

  it('should render hire buttons', () => {
    render(<InventoryPanel />);
    expect(screen.getByText('Hire guard')).toBeInTheDocument();
    expect(screen.getByText('Hire negotiator')).toBeInTheDocument();
    expect(screen.getByText('Hire scout')).toBeInTheDocument();
  });

  it('should hire personnel when button clicked', async () => {
    const user = userEvent.setup();
    render(<InventoryPanel />);
    await user.click(screen.getByText('Hire guard'));
    expect(useGameStore.getState().personnel.length).toBe(1);
  });

  it('should show empty personnel message initially', () => {
    render(<InventoryPanel />);
    expect(screen.getByText(/No personnel hired/)).toBeInTheDocument();
  });

  it('should display hired personnel', () => {
    useGameStore.getState().hirePersonnel('guard');
    render(<InventoryPanel />);
    const person = useGameStore.getState().personnel[0];
    expect(screen.getByText(person.name)).toBeInTheDocument();
  });

  it('should show personnel counts', () => {
    render(<InventoryPanel />);
    expect(screen.getByText('Available: 0')).toBeInTheDocument();
    expect(screen.getByText('Assigned: 0')).toBeInTheDocument();
    expect(screen.getByText('Injured: 0')).toBeInTheDocument();
  });

  it('should show personnel status badges', () => {
    useGameStore.getState().hirePersonnel('guard');
    render(<InventoryPanel />);
    expect(screen.getByText('available')).toBeInTheDocument();
  });

  it('should show assigned status badge', () => {
    useGameStore.getState().hirePersonnel('guard');
    const person = useGameStore.getState().personnel[0];
    useGameStore.getState().assignPersonnel(person.id, 'route-1');
    render(<InventoryPanel />);
    expect(screen.getByText('assigned')).toBeInTheDocument();
  });

  it('should not show dead personnel in list', () => {
    useGameStore.getState().hirePersonnel('guard');
    const person = useGameStore.getState().personnel[0];
    // Manually set status to dead
    useGameStore.setState({
      personnel: [{ ...person, status: 'dead' }],
    });
    render(<InventoryPanel />);
    expect(screen.queryByText(person.name)).not.toBeInTheDocument();
  });

  it('should show injured badge for injured personnel', () => {
    useGameStore.getState().hirePersonnel('guard');
    const person = useGameStore.getState().personnel[0];
    useGameStore.setState({
      personnel: [{ ...person, status: 'injured' }],
    });
    render(<InventoryPanel />);
    expect(screen.getByText('injured')).toBeInTheDocument();
  });

  it('should not show low warning for resources above threshold', () => {
    render(<InventoryPanel />);
    expect(screen.queryByText('Low!')).not.toBeInTheDocument();
  });
});
