import React, { useCallback, useEffect, useRef, useState } from 'react';

/* ── Constants ── */

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 5;
const TAP_MOVE_THRESHOLD = 3;
const TAP_MAX_DURATION = 300;

/* ── Utility functions ── */

function getTouchDistance(firstTouch, secondTouch) {
  return Math.hypot(
    firstTouch.clientX - secondTouch.clientX,
    firstTouch.clientY - secondTouch.clientY
  );
}

function clampZoom(value) {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));
}

/* ── Component ── */

/**
 * Displays a row of image or video steps. Clicking opens a lightbox with
 * left / right navigation, zoom, and pan.
 *
 * Props:
 *   layout   – "steps" (default): horizontal row with arrows.
 *              "grid": wrapping grid, N items per row (no arrows).
 *   columns  – Number of columns in grid mode (default: 4).
 *   square   – Force 1:1 aspect ratio on each thumbnail.
 *   ratio    – Force a custom aspect ratio string (e.g. "16 / 9").
 *   arrows   – Show arrows between steps in "steps" mode (default: true).
 */
export default function StepGallery({
  steps = [],
  layout = 'steps',
  columns = 4,
  square = false,
  ratio,
  arrows = true,
  maxWidth,
}) {
  const isGrid = layout === 'grid';

  /* ── Thumbnail state ── */

  const [equalHeight, setEqualHeight] = useState(null);

  const mediaRefs = useRef([]);
  const loadedCount = useRef(0);

  // Auto-equalise heights only in "steps" mode without explicit aspect ratio.
  const useAutoHeight = !isGrid && !square && !ratio && steps.length > 1;

  const handleMediaReady = useCallback(() => {
    if (!useAutoHeight) return;

    loadedCount.current += 1;
    if (loadedCount.current < steps.length) return;

    const heights = mediaRefs.current
      .filter(Boolean)
      .map((element) => element.getBoundingClientRect().height);

    if (heights.length > 1) {
      setEqualHeight(Math.min(...heights));
    }
  }, [steps.length, useAutoHeight]);

  /* ── Lightbox state ── */

  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const isDragging = useRef(false);
  const hasMoved = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });
  const touchStartTime = useRef(0);
  const initialPinchDistance = useRef(0);
  const initialPinchZoom = useRef(1);

  // Derived lightbox values.
  const isLightboxOpen = lightboxIndex !== null;
  const lightboxStep = isLightboxOpen ? steps[lightboxIndex] : null;
  const lightboxSrc = lightboxStep?.img ?? null;
  const lightboxType = lightboxStep?.video ? 'video' : 'image';
  const canGoPrev = isLightboxOpen && lightboxIndex > 0;
  const canGoNext = isLightboxOpen && lightboxIndex < steps.length - 1;
  const showNav = isLightboxOpen && steps.length > 1;

  /* ── Lightbox actions ── */

  const resetViewport = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const openLightbox = (index) => {
    setLightboxIndex(index);
    resetViewport();
  };

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
    resetViewport();
  }, [resetViewport]);

  const navigatePrev = useCallback(() => {
    setLightboxIndex((prev) => {
      if (prev === null || prev <= 0) return prev;
      return prev - 1;
    });
    resetViewport();
  }, [resetViewport]);

  const navigateNext = useCallback(() => {
    setLightboxIndex((prev) => {
      if (prev === null || prev >= steps.length - 1) return prev;
      return prev + 1;
    });
    resetViewport();
  }, [steps.length, resetViewport]);

  /* ── Image lightbox: zoom & pan handlers ── */

  const handleWheel = useCallback((event) => {
    event.preventDefault();
    const factor = event.deltaY > 0 ? 0.9 : 1.1;

    setZoom((currentZoom) => {
      const nextZoom = clampZoom(currentZoom * factor);
      if (nextZoom <= 1) setPan({ x: 0, y: 0 });
      return nextZoom;
    });
  }, []);

  const handleMouseDown = useCallback(
    (event) => {
      event.preventDefault();
      isDragging.current = true;
      hasMoved.current = false;
      dragStart.current = { x: event.clientX, y: event.clientY };
      panStart.current = { ...pan };
    },
    [pan]
  );

  const handleTouchStart = useCallback(
    (event) => {
      hasMoved.current = false;
      touchStartTime.current = Date.now();

      if (event.touches.length === 1) {
        const touch = event.touches[0];
        isDragging.current = true;
        dragStart.current = { x: touch.clientX, y: touch.clientY };
        panStart.current = { ...pan };
        return;
      }

      if (event.touches.length === 2) {
        isDragging.current = false;
        initialPinchDistance.current = getTouchDistance(
          event.touches[0],
          event.touches[1]
        );
        initialPinchZoom.current = zoom;
      }
    },
    [pan, zoom]
  );

  const handleTouchMove = useCallback((event) => {
    event.preventDefault();

    if (event.touches.length === 1 && isDragging.current) {
      const touch = event.touches[0];
      const dx = touch.clientX - dragStart.current.x;
      const dy = touch.clientY - dragStart.current.y;

      if (
        Math.abs(dx) > TAP_MOVE_THRESHOLD ||
        Math.abs(dy) > TAP_MOVE_THRESHOLD
      ) {
        hasMoved.current = true;
      }

      setPan({
        x: panStart.current.x + dx,
        y: panStart.current.y + dy,
      });
      return;
    }

    if (event.touches.length === 2) {
      hasMoved.current = true;
      const distance = getTouchDistance(event.touches[0], event.touches[1]);
      const scale = distance / initialPinchDistance.current;
      const nextZoom = clampZoom(initialPinchZoom.current * scale);

      if (nextZoom <= 1) setPan({ x: 0, y: 0 });
      setZoom(nextZoom);
    }
  }, []);

  const handleTouchEnd = useCallback(
    (event) => {
      const elapsed = Date.now() - touchStartTime.current;
      const wasTap =
        !hasMoved.current &&
        elapsed < TAP_MAX_DURATION &&
        event.touches.length === 0;

      if (wasTap) closeLightbox();
      isDragging.current = false;
    },
    [closeLightbox]
  );

  const zoomIn = (event) => {
    event.stopPropagation();
    setZoom((currentZoom) => clampZoom(currentZoom * 1.25));
  };

  const zoomOut = (event) => {
    event.stopPropagation();
    setZoom((currentZoom) => {
      const nextZoom = clampZoom(currentZoom * 0.8);
      if (nextZoom <= 1) setPan({ x: 0, y: 0 });
      return nextZoom;
    });
  };

  const zoomReset = (event) => {
    event.stopPropagation();
    resetViewport();
  };

  /* ── Lightbox effects ── */

  // Keyboard: Escape / Arrow keys (shared by image & video lightbox).
  useEffect(() => {
    if (!isLightboxOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeLightbox();
      if (event.key === 'ArrowLeft') navigatePrev();
      if (event.key === 'ArrowRight') navigateNext();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, closeLightbox, navigatePrev, navigateNext]);

  // Mouse drag & click-to-close (image lightbox only).
  useEffect(() => {
    if (!isLightboxOpen || lightboxType !== 'image') return undefined;

    const handleMouseMove = (event) => {
      if (!isDragging.current) return;

      const dx = event.clientX - dragStart.current.x;
      const dy = event.clientY - dragStart.current.y;

      if (
        Math.abs(dx) > TAP_MOVE_THRESHOLD ||
        Math.abs(dy) > TAP_MOVE_THRESHOLD
      ) {
        hasMoved.current = true;
      }

      setPan({
        x: panStart.current.x + dx,
        y: panStart.current.y + dy,
      });
    };

    const handleMouseUp = () => {
      if (isDragging.current && !hasMoved.current) closeLightbox();
      isDragging.current = false;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isLightboxOpen, lightboxType, closeLightbox, handleTouchEnd]);

  /* ── Early exit ── */

  if (!steps.length) return null;

  /* ── Thumbnail grid layout ── */

  const showArrows = !isGrid && arrows;

  let gridStyle;
  let containerClass;

  if (isGrid) {
    containerClass = 'step-gallery step-gallery--grid';
    gridStyle = {
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: '16px',
    };
  } else {
    containerClass = 'step-gallery';
    const gridColumns = showArrows
      ? steps
          .map((_, index) =>
            index < steps.length - 1 ? '1fr 24px' : '1fr'
          )
          .join(' ')
      : steps.map(() => '1fr').join(' ');

    gridStyle = {
      gridTemplateColumns: gridColumns,
      gap: showArrows ? '4px' : '16px',
    };
  }

  let mediaStyle;
  if (ratio) mediaStyle = { aspectRatio: ratio };
  else if (square) mediaStyle = { aspectRatio: '1 / 1' };
  else if (!isGrid && equalHeight) mediaStyle = { height: `${equalHeight}px` };

  /* ── Shared lightbox navigation buttons ── */

  const navButtons = showNav && (
    <>
      {canGoPrev && (
        <button
          type="button"
          className="lightbox-nav lightbox-nav--prev"
          title="上一張"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            navigatePrev();
          }}
        >
          ‹
        </button>
      )}
      {canGoNext && (
        <button
          type="button"
          className="lightbox-nav lightbox-nav--next"
          title="下一張"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            navigateNext();
          }}
        >
          ›
        </button>
      )}
    </>
  );

  /* ── Render ── */

  return (
    <>
      {/* Thumbnail grid */}
      <div className={containerClass} style={{ ...gridStyle, maxWidth }}>
        {steps.map((step, index) => (
          <React.Fragment key={`${step.img}-${index}`}>
            <div className="step-gallery-item">
              {step.video ? (
                <div
                  className="step-gallery-media"
                  style={mediaStyle}
                  onClick={() => openLightbox(index)}
                >
                  <video
                    ref={(element) => {
                      mediaRefs.current[index] = element;
                    }}
                    src={step.img}
                    autoPlay
                    loop
                    muted
                    playsInline
                    onLoadedMetadata={handleMediaReady}
                  />
                </div>
              ) : (
                <div
                  className="step-gallery-media"
                  style={mediaStyle}
                  onClick={() => openLightbox(index)}
                >
                  <img
                    ref={(element) => {
                      mediaRefs.current[index] = element;
                    }}
                    src={step.img}
                    alt={step.label || `Step ${index + 1}`}
                    onLoad={handleMediaReady}
                    data-nozoom
                    style={{ pointerEvents: 'none' }}
                  />
                </div>
              )}

              <span className="step-gallery-label">{step.label}</span>
              {step.sub && <span className="step-gallery-sub">{step.sub}</span>}
              {step.date && (
                <span className="step-gallery-date">{step.date}</span>
              )}
            </div>

            {showArrows && index < steps.length - 1 && (
              <div className="step-gallery-arrow" aria-hidden="true">
                →
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Image lightbox */}
      {isLightboxOpen && lightboxType === 'image' && (
        <div
          className="image-lightbox-overlay"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ cursor: zoom > 1 ? 'grab' : 'pointer' }}
        >
          <img
            className="image-lightbox-content"
            src={lightboxSrc}
            alt=""
            draggable={false}
            data-nozoom
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              maxWidth: zoom <= 1 ? '90vw' : 'none',
              maxHeight: zoom <= 1 ? '90vh' : 'none',
            }}
          />

          {navButtons}

          <div
            className="image-lightbox-controls"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button type="button" onClick={zoomOut} title="縮小">
              −
            </button>
            <button
              type="button"
              className="image-lightbox-percent"
              onClick={zoomReset}
              title="重設"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button type="button" onClick={zoomIn} title="放大">
              +
            </button>

            {showNav && (
              <span className="lightbox-counter">
                {lightboxIndex + 1} / {steps.length}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Video lightbox */}
      {isLightboxOpen && lightboxType === 'video' && (
        <div className="video-lightbox-overlay" onClick={closeLightbox}>
          <video
            className="video-lightbox-content"
            src={lightboxSrc}
            autoPlay
            loop
            muted
            playsInline
            onClick={(event) => event.stopPropagation()}
          />

          {navButtons}
        </div>
      )}
    </>
  );
}
