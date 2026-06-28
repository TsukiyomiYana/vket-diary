import React, { useCallback, useEffect, useRef, useState } from 'react';

/* ── Utility ── */

function clampPosition(value) {
  return Math.max(0, Math.min(100, value));
}

/* ── Component ── */

/** Drag or use the arrow keys to compare two images. */
export default function ImageCompareSlider({
  before,
  after,
  beforeLabel,
  afterLabel,
  startAt = 50,
}) {
  const [position, setPosition] = useState(() => clampPosition(startAt));
  const containerRef = useRef(null);
  const isDragging = useRef(false);

  /* ── Position update ── */

  const updatePosition = useCallback((clientX) => {
    const container = containerRef.current;
    if (!container) return;

    const bounds = container.getBoundingClientRect();
    if (!bounds.width) return;

    const nextPosition = ((clientX - bounds.left) / bounds.width) * 100;
    setPosition(clampPosition(nextPosition));
  }, []);

  /* ── Pointer handlers ── */

  const handleMouseDown = useCallback(
    (event) => {
      isDragging.current = true;
      updatePosition(event.clientX);
    },
    [updatePosition]
  );

  const handleTouchStart = useCallback(
    (event) => {
      isDragging.current = true;
      updatePosition(event.touches[0].clientX);
    },
    [updatePosition]
  );

  const handleTouchMove = useCallback(
    (event) => {
      if (!isDragging.current) return;
      event.preventDefault();
      updatePosition(event.touches[0].clientX);
    },
    [updatePosition]
  );

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setPosition((current) => clampPosition(current - 2));
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      setPosition((current) => clampPosition(current + 2));
    }
  };

  /* ── Global drag tracking ── */

  // Keep the drag active when the pointer leaves the slider.
  useEffect(() => {
    const handleMouseMove = (event) => {
      if (isDragging.current) updatePosition(event.clientX);
    };

    const stopDragging = () => {
      isDragging.current = false;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopDragging);
    document.addEventListener('touchend', stopDragging);
    document.addEventListener('touchcancel', stopDragging);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', stopDragging);
      document.removeEventListener('touchend', stopDragging);
      document.removeEventListener('touchcancel', stopDragging);
    };
  }, [updatePosition]);

  /* ── Render ── */

  const beforeImageWidth = containerRef.current
    ? `${containerRef.current.offsetWidth}px`
    : '100%';

  return (
    <div
      ref={containerRef}
      className="img-compare"
      role="slider"
      aria-label="Image comparison slider"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(position)}
      tabIndex={0}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onKeyDown={handleKeyDown}
    >
      <img
        className="img-compare-after"
        src={after}
        alt={afterLabel || 'After'}
        draggable={false}
        data-nozoom
      />

      <div className="img-compare-before" style={{ width: `${position}%` }}>
        <img
          src={before}
          alt={beforeLabel || 'Before'}
          draggable={false}
          data-nozoom
          style={{
            width: beforeImageWidth,
            maxWidth: 'none',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>

      <div
        className="img-compare-divider"
        style={{
          left: `${position}%`,
          transform: 'translateX(-50%)',
        }}
      >
        <div className="img-compare-handle" />
      </div>

      {beforeLabel && (
        <span className="img-compare-label img-compare-label-left">
          {beforeLabel}
        </span>
      )}
      {afterLabel && (
        <span className="img-compare-label img-compare-label-right">
          {afterLabel}
        </span>
      )}
    </div>
  );
}
