import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { createPortal } from "react-dom";

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const GalleryLightbox = ({
  photos,
  activeIndex,
  onClose,
  onPrev,
  onNext,
}) => {
  const photo = photos[activeIndex];
  const dialogRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    if (activeIndex < 0 || !photo) {
      return undefined;
    }

    previouslyFocused.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const dialog = dialogRef.current;
    const focusables = () =>
      dialog ? Array.from(dialog.querySelectorAll(FOCUSABLE)) : [];

    const initial = focusables();
    (initial[0] || dialog)?.focus?.();

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key === "ArrowLeft") {
        onPrev();
        return;
      }
      if (event.key === "ArrowRight") {
        onNext();
        return;
      }
      if (event.key !== "Tab") return;

      const nodes = focusables();
      if (nodes.length === 0) {
        event.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      previouslyFocused.current?.focus?.();
    };
  }, [activeIndex, photo, onClose, onPrev, onNext]);

  if (activeIndex < 0 || !photo) {
    return null;
  }

  const hasPrev = activeIndex > 0;
  const hasNext = activeIndex < photos.length - 1;

  return createPortal(
    <div
      ref={dialogRef}
      className="gallery-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Gallery image viewer"
      tabIndex={-1}
      onClick={onClose}
    >
      <button
        type="button"
        className="gallery-lightbox__close"
        aria-label="Close"
        onClick={onClose}
      >
        ×
      </button>

      <button
        type="button"
        className="gallery-lightbox__nav gallery-lightbox__nav--prev"
        aria-label="Previous image"
        disabled={!hasPrev}
        onClick={(event) => {
          event.stopPropagation();
          onPrev();
        }}
      >
        ‹
      </button>

      <div
        className="gallery-lightbox__image-wrap"
        onClick={(event) => event.stopPropagation()}
      >
        <img
          src={photo.src}
          alt={photo.alt}
          className="gallery-lightbox__image"
        />
      </div>

      <button
        type="button"
        className="gallery-lightbox__nav gallery-lightbox__nav--next"
        aria-label="Next image"
        disabled={!hasNext}
        onClick={(event) => {
          event.stopPropagation();
          onNext();
        }}
      >
        ›
      </button>

      <span className="gallery-lightbox__counter">
        {activeIndex + 1} / {photos.length}
      </span>
    </div>,
    document.body
  );
};

GalleryLightbox.propTypes = {
  photos: PropTypes.arrayOf(
    PropTypes.shape({
      src: PropTypes.string.isRequired,
      alt: PropTypes.string,
      key: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    })
  ).isRequired,
  activeIndex: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired,
  onPrev: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
};

export default GalleryLightbox;
