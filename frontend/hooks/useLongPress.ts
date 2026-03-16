import React, { useState, useCallback, useRef } from 'react';

interface UseLongPressOptions {
  isPreventDefault?: boolean;
  delay?: number;
}

export function useLongPress(
  onLongPress: (e: React.TouchEvent | React.MouseEvent) => void,
  onClick: (e: React.TouchEvent | React.MouseEvent) => void,
  { isPreventDefault = true, delay = 500 }: UseLongPressOptions = {}
) {
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const timeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const target = useRef<EventTarget | undefined>(undefined);

  const start = useCallback(
    (event: React.TouchEvent | React.MouseEvent) => {
      if (isPreventDefault && event.target) {
        event.target.addEventListener('touchend', preventDefault, {
          passive: false
        });
        target.current = event.target;
      }
      timeout.current = setTimeout(() => {
        onLongPress(event);
        setLongPressTriggered(true);
      }, delay);
    },
    [onLongPress, delay, isPreventDefault]
  );

  const clear = useCallback(
    (event: React.TouchEvent | React.MouseEvent, shouldTriggerClick: boolean = true) => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
      if (shouldTriggerClick && !longPressTriggered) {
        onClick(event);
      }
      setLongPressTriggered(false);
      if (isPreventDefault && target.current) {
        target.current.removeEventListener('touchend', preventDefault);
      }
    },
    [onClick, longPressTriggered, isPreventDefault]
  );

  return {
    onMouseDown: (e: React.MouseEvent) => start(e),
    onTouchStart: (e: React.TouchEvent) => start(e),
    onMouseUp: (e: React.MouseEvent) => clear(e),
    onMouseLeave: (e: React.MouseEvent) => clear(e, false),
    onTouchEnd: (e: React.TouchEvent) => clear(e, true)
  };
}

const isTouchEvent = (event: Event): event is TouchEvent => {
  return 'touches' in event;
};

const preventDefault = (event: Event) => {
  if (!isTouchEvent(event)) return;
  if (event.touches.length < 2 && event.preventDefault) {
    event.preventDefault();
  }
};
