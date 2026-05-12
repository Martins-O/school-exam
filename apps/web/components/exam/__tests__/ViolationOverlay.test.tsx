import '@testing-library/jest-dom/jest-globals';
import { render, screen, fireEvent } from '@testing-library/react';
import ViolationOverlay from '../ViolationOverlay';

describe('ViolationOverlay', () => {
  it('displays the violation count', () => {
    render(<ViolationOverlay violations={2} maxViolations={3} onDismiss={jest.fn()} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('displays the max violations', () => {
    render(<ViolationOverlay violations={1} maxViolations={5} onDismiss={jest.fn()} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('shows auto-disqualification warning with correct max', () => {
    render(<ViolationOverlay violations={2} maxViolations={4} onDismiss={jest.fn()} />);
    expect(screen.getByText(/REACHING 4 CAUSES AUTOMATIC DISQUALIFICATION/)).toBeInTheDocument();
  });

  it('calls onDismiss when acknowledgment button is clicked', () => {
    const onDismiss = jest.fn();
    render(<ViolationOverlay violations={1} maxViolations={3} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByText('Confirm Acknowledgment'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
