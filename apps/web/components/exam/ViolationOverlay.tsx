interface ViolationOverlayProps {
  violations: number;
  maxViolations: number;
}

export default function ViolationOverlay({ violations, maxViolations }: ViolationOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="text-red-600 text-5xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold mb-4">Warning: Cheating Detected</h2>
        <p className="text-gray-700 mb-4">
          Leaving the exam window is not allowed.
        </p>
        <div className="bg-red-50 border border-red-200 p-4 rounded-md">
          <p className="font-semibold">
            Violation {violations} of {maxViolations}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Further violations will auto-submit your exam.
          </p>
        </div>
      </div>
    </div>
  );
}
