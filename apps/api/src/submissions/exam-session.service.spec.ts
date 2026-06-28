import { ExamSessionService } from './exam-session.service';
import { GraderService } from './grader.service';
import { RandomizerService } from './randomizer.service';

describe('ExamSessionService', () => {
  let service: ExamSessionService;
  let graderService: GraderService;

  beforeEach(async () => {
    graderService = new GraderService();
    const randomizerService = new RandomizerService();

    service = new ExamSessionService(
      null as any,
      null as any,
      null as any,
      null as any,
      randomizerService,
      graderService,
      null as any,
      null as any,
    );
  });

  describe('getRemainingSeconds', () => {
    it('returns full duration when just started', () => {
      const submission = { startedAt: new Date() } as any;
      const exam = { durationMinutes: 60 } as any;
      const remaining = service.getRemainingSeconds(submission, exam);
      expect(remaining).toBeGreaterThan(3595);
      expect(remaining).toBeLessThanOrEqual(3600);
    });

    it('returns 0 for expired exam', () => {
      const submission = { startedAt: new Date(Date.now() - 120 * 60 * 1000) } as any;
      const exam = { durationMinutes: 60 } as any;
      expect(service.getRemainingSeconds(submission, exam)).toBe(0);
    });

    it('returns ~30 minutes for half-expired exam', () => {
      const startedAt = new Date(Date.now() - 30 * 60 * 1000);
      const submission = { startedAt } as any;
      const exam = { durationMinutes: 60 } as any;
      const remaining = service.getRemainingSeconds(submission, exam);
      expect(remaining).toBeGreaterThan(1790);
      expect(remaining).toBeLessThanOrEqual(1800);
    });

    it('never returns negative values', () => {
      const submission = { startedAt: new Date(Date.now() - 9999 * 60 * 1000) } as any;
      const exam = { durationMinutes: 60 } as any;
      expect(service.getRemainingSeconds(submission, exam)).toBe(0);
    });
  });
});
