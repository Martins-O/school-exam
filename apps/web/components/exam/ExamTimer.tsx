interface ExamTimerProps {
  remainingSeconds: number;
}

export default function ExamTimer({ remainingSeconds }: ExamTimerProps) {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const mm = minutes.toString().padStart(2, '0');
  const ss = seconds.toString().padStart(2, '0');
  const isLow = remainingSeconds < 300;
  const isCritical = remainingSeconds < 60;

  return (
    <div
      className={`text-2xl font-mono font-bold ${
        isCritical ? 'text-red-600 animate-pulse' : isLow ? 'text-red-500' : 'text-gray-800'
      }`}
    >
      {mm}:{ss}
    </div>
  );
}
