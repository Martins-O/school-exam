import '@testing-library/jest-dom/jest-globals';
import { render, screen, fireEvent } from '@testing-library/react';
import QuestionNavigator from '../QuestionNavigator';

const mockIds = ['q1', 'q2', 'q3', 'q4', 'q5'];

describe('QuestionNavigator', () => {
  it('renders correct number of question buttons', () => {
    render(
      <QuestionNavigator
        total={5}
        currentIndex={0}
        answers={{}}
        flagged={[]}
        questionIds={mockIds}
        onJump={jest.fn()}
      />
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);
  });

  it('renders each button with its 1-based index', () => {
    render(
      <QuestionNavigator
        total={5}
        currentIndex={0}
        answers={{}}
        flagged={[]}
        questionIds={mockIds}
        onJump={jest.fn()}
      />
    );
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('highlights the current question with blue styling', () => {
    const { container } = render(
      <QuestionNavigator
        total={5}
        currentIndex={2}
        answers={{ q2: 'A' }}
        flagged={[]}
        questionIds={mockIds}
        onJump={jest.fn()}
      />
    );
    const buttons = container.querySelectorAll('button');
    expect(buttons[2].className).toContain('border-blue-600');
  });

  it('shows answered questions with brand-green styling', () => {
    const { container } = render(
      <QuestionNavigator
        total={3}
        currentIndex={1}
        answers={{ q1: 'A' }}
        flagged={[]}
        questionIds={['q1', 'q2', 'q3']}
        onJump={jest.fn()}
      />
    );
    const buttons = container.querySelectorAll('button');
    expect(buttons[0].className).toContain('bg-brand-green');
  });

  it('shows flagged questions with amber styling', () => {
    const { container } = render(
      <QuestionNavigator
        total={3}
        currentIndex={0}
        answers={{}}
        flagged={['q2']}
        questionIds={['q1', 'q2', 'q3']}
        onJump={jest.fn()}
      />
    );
    const buttons = container.querySelectorAll('button');
    expect(buttons[1].className).toContain('bg-amber-500');
  });

  it('calls onJump with correct index when a button is clicked', () => {
    const onJump = jest.fn();
    render(
      <QuestionNavigator
        total={3}
        currentIndex={0}
        answers={{}}
        flagged={[]}
        questionIds={['q1', 'q2', 'q3']}
        onJump={onJump}
      />
    );
    fireEvent.click(screen.getByText('3'));
    expect(onJump).toHaveBeenCalledWith(2);
  });
});
