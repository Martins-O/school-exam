interface ViolationOverlayProps {
  violations: number;
  maxViolations: number;
  onDismiss: () => void;
}

export default function ViolationOverlay({ violations, maxViolations, onDismiss }: ViolationOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="text-red-600 text-5xl mb-4 text-center">⚠️</div>
        <h2 className="text-2xl font-bold mb-4 text-center">Warning: Cheating Detected</h2>
        <p className="text-gray-700 mb-6 text-center">
          Leaving the exam window or exiting fullscreen is strictly prohibited.
        </p>
        <div className="bg-red-50 border border-red-200 p-4 rounded-md mb-6">
          <p className="font-semibold text-center">
            Violation {violations} of {maxViolations}
          </p>
          <p className="text-sm text-gray-600 mt-2 text-center">
            Reaching {maxViolations} violations will result in automatic submission.
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="w-full bg-red-600 text-white py-3 rounded-md font-bold hover:bg-red-700 transition-colors shadow-md"
        >
          I UNDERSTAND
        </button>
      </div>
    </div>
  );
}
