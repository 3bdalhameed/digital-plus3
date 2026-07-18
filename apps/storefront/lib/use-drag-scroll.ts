import { useEffect, useRef, RefObject } from "react";

/**
 * Adds "click and drag" horizontal scrolling to a scrollable element.
 *
 * Attach the returned ref to the outer scroll container (the one with
 * `overflow-x: auto`). While the user holds the mouse down and moves
 * horizontally, we translate the delta into scrollLeft. This is the
 * pattern Facebook and news feeds use for their card rails so mouse
 * users get a native-feeling swipe instead of having to fumble with
 * arrow buttons or wheel-shift.
 *
 * Two behaviours worth knowing about:
 *
 *   1. Click swallowing. If the pointer actually moved (past a small
 *      threshold) while the button was down, we swallow the trailing
 *      `click` event on children -- otherwise a drag that starts on a
 *      <Link> card would treat the release as a click and navigate
 *      the user away from the page they were trying to scroll.
 *
 *   2. Direction-aware axis. Pages here run RTL by default (Arabic),
 *      but the scroll container might be `direction: ltr` locally.
 *      Native `scrollLeft` semantics differ across browsers when the
 *      writing direction is RTL, but since the carousels we use this
 *      on have an inline `direction: ltr` on the outer wrapper (see
 *      SectionRenderer + RelatedProducts), a plain scrollLeft delta
 *      works consistently.
 *
 * Touch scrolling is left to the browser -- it already handles that
 * natively on overflow-x containers.
 */
export function useDragScroll<T extends HTMLElement>(): RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let isDown = false;
    let startX = 0;
    let startScrollLeft = 0;
    let moved = false;
    // Distance in px past which a mouseup counts as a drag rather than
    // a click. Anything under this and we let the click through to
    // whatever card the pointer was on so tapping a product still opens
    // it.
    const DRAG_THRESHOLD = 6;

    const onMouseDown = (e: MouseEvent) => {
      // Ignore secondary/middle buttons -- they belong to the browser
      // (context menu / autoscroll) and hijacking them surprises users.
      if (e.button !== 0) return;
      isDown = true;
      moved = false;
      startX = e.pageX;
      startScrollLeft = el.scrollLeft;
      el.classList.add("is-drag-scrolling");
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      const dx = e.pageX - startX;
      if (Math.abs(dx) > DRAG_THRESHOLD) moved = true;
      // Subtract because dragging left should scroll content right,
      // matching the muscle memory of pulling a physical rail.
      el.scrollLeft = startScrollLeft - dx;
      // Suppress text selection + native drag-image once we've moved.
      if (moved) e.preventDefault();
    };

    const endDrag = () => {
      isDown = false;
      el.classList.remove("is-drag-scrolling");
    };

    // Swallow the click that fires after a real drag. Runs in the
    // capture phase so it intercepts the event before any child
    // <Link> / <button> handler sees it.
    const onClickCapture = (e: MouseEvent) => {
      if (!moved) return;
      e.preventDefault();
      e.stopPropagation();
      moved = false;
    };

    el.addEventListener("mousedown", onMouseDown);
    el.addEventListener("mousemove", onMouseMove);
    el.addEventListener("mouseup", endDrag);
    el.addEventListener("mouseleave", endDrag);
    el.addEventListener("click", onClickCapture, true);

    return () => {
      el.removeEventListener("mousedown", onMouseDown);
      el.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("mouseup", endDrag);
      el.removeEventListener("mouseleave", endDrag);
      el.removeEventListener("click", onClickCapture, true);
    };
  }, []);

  return ref;
}
