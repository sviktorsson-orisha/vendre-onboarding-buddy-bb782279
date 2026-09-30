import { useEffect, useRef } from "react";

/**
 * Hover/focus intent: runs `action(arg)` after a short pause on a link, or
 * immediately on touch, so quick passes over menus don't trigger store calls.
 * Returns a function producing the event props for one link.
 */
export function useIntent<T>(action: (arg: T) => void, delay = 120) {
  const timer = useRef<number | null>(null);
  const cancel = () => {
    if (timer.current != null) window.clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => cancel, []);
  return (arg: T) => ({
    onMouseEnter: () => {
      cancel();
      timer.current = window.setTimeout(() => action(arg), delay);
    },
    onMouseLeave: cancel,
    onFocus: () => {
      cancel();
      timer.current = window.setTimeout(() => action(arg), delay);
    },
    onTouchStart: () => action(arg),
  });
}
