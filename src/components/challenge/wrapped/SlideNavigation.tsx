"use client";

interface SlideNavigationProps {
  currentSlide: number;
  totalSlides: number;
  onPrev: () => void;
  onNext: () => void;
  onGoToSlide: (index: number) => void;
}

export function SlideNavigation({
  currentSlide,
  totalSlides,
  onPrev,
  onNext,
  onGoToSlide,
}: SlideNavigationProps) {
  const isFirst = currentSlide === 0;
  const isLast = currentSlide === totalSlides - 1;

  return (
    <div className="flex items-center justify-between w-full mt-6">
      {/* Previous Button */}
      <button
        onClick={onPrev}
        disabled={isFirst}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-[#232323] transition-all ${
          isFirst
            ? "opacity-30 cursor-not-allowed bg-[#EEF0F2]"
            : "bg-white hover:bg-[#EEF0F2] hover:translate-y-0.5 shadow-[0px_2px_0px_0px_#232323] hover:shadow-[0px_1px_0px_0px_#232323]"
        }`}
        aria-label="Previous slide"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        <span className="font-medium hidden sm:inline">Prev</span>
      </button>

      {/* Progress Dots */}
      <div className="flex items-center gap-2">
        {Array.from({ length: totalSlides }).map((_, index) => (
          <button
            key={index}
            onClick={() => onGoToSlide(index)}
            className={`w-3 h-3 rounded-full border border-[#232323] transition-all ${
              index === currentSlide
                ? "bg-[#FEA6CC] scale-110"
                : "bg-white hover:bg-[#EEF0F2]"
            }`}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === currentSlide ? "step" : undefined}
          />
        ))}
      </div>

      {/* Next Button */}
      <button
        onClick={onNext}
        disabled={isLast}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-[#232323] transition-all ${
          isLast
            ? "opacity-30 cursor-not-allowed bg-[#EEF0F2]"
            : "bg-[#AAE7C0] hover:translate-y-0.5 shadow-[0px_2px_0px_0px_#232323] hover:shadow-[0px_1px_0px_0px_#232323]"
        }`}
        aria-label="Next slide"
      >
        <span className="font-medium hidden sm:inline">Next</span>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  );
}

// Compact progress indicator for inside the slide
export function SlideProgress({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-[#232323]/50">
      <span className="font-bold text-[#232323]">{current + 1}</span>
      <span>/</span>
      <span>{total}</span>
    </div>
  );
}
