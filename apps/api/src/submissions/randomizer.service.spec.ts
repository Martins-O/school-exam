import { RandomizerService } from './randomizer.service';

describe('RandomizerService', () => {
  let service: RandomizerService;

  beforeEach(() => {
    service = new RandomizerService();
  });

  describe('shuffle', () => {
    it('returns all original elements', () => {
      const input = ['a', 'b', 'c', 'd', 'e'];
      const result = service.shuffle(input);
      expect(result.sort()).toEqual(input.sort());
    });

    it('preserves input length', () => {
      const input = ['a', 'b', 'c'];
      const result = service.shuffle(input);
      expect(result).toHaveLength(3);
    });

    it('does not mutate the input array', () => {
      const input = ['a', 'b', 'c'];
      const copy = [...input];
      service.shuffle(input);
      expect(input).toEqual(copy);
    });

    it('returns a new array (not the same reference)', () => {
      const input = ['a', 'b', 'c'];
      const result = service.shuffle(input);
      expect(result).not.toBe(input);
    });

    it('handles empty array', () => {
      expect(service.shuffle([])).toEqual([]);
    });

    it('handles single-element array', () => {
      expect(service.shuffle(['x'])).toEqual(['x']);
    });

    it('produces a permutation of the input (statistical)', () => {
      const input = Array.from({ length: 10 }, (_, i) => `q${i}`);
      const result = service.shuffle(input);
      expect(result.sort()).toEqual(input.sort());
    });
  });

  describe('shuffleQuestions', () => {
    it('extracts IDs and shuffles them', () => {
      const questions = [
        { id: 'q1' } as any,
        { id: 'q2' } as any,
        { id: 'q3' } as any,
      ];
      const result = service.shuffleQuestions(questions);
      expect(result.sort()).toEqual(['q1', 'q2', 'q3']);
      expect(result).toHaveLength(3);
    });
  });
});
