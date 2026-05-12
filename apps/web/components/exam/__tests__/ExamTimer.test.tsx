import '@testing-library/jest-dom/jest-globals';
import { render } from '@testing-library/react';
import ExamTimer from '../ExamTimer';

describe('ExamTimer', () => {
  it('renders MM:SS format for times under 1 hour', () => {
    const { container } = render(<ExamTimer remainingSeconds={901} />);
    expect(container.textContent).toContain('15:01');
  });

  it('renders HH:MM:SS format for times over 1 hour', () => {
    const { container } = render(<ExamTimer remainingSeconds={3661} />);
    expect(container.textContent).toContain('01:01:01');
  });

  it('shows danger styling when remaining seconds < 300', () => {
    const { container } = render(<ExamTimer remainingSeconds={299} />);
    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv.className).toContain('border-red-500');
  });

  it('shows normal styling when remaining seconds >= 300', () => {
    const { container } = render(<ExamTimer remainingSeconds={300} />);
    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv.className).toContain('border-brand-gold');
  });

  it('handles 0 remaining seconds', () => {
    const { container } = render(<ExamTimer remainingSeconds={0} />);
    expect(container.textContent).toMatch(/00.*00/);
  });

  it('renders hours when duration > 1 hour', () => {
    const { container } = render(<ExamTimer remainingSeconds={7500} />);
    expect(container.textContent).toContain('02');
  });
});
