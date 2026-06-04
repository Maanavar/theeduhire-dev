import { useEffect, useRef, useState } from "react";

/**
 * Returns a ref to attach to the tab container and a style object
 * for an absolutely-positioned sliding indicator bar.
 * Usage:
 *   const { containerRef, indicatorStyle } = useTabIndicator(activeIndex);
 *   <div ref={containerRef} className="relative flex border-b ...">
 *     <div style={indicatorStyle} className="eh-tabs-indicator" />
 *     {tabs.map(...)}
 *   </div>
 */
export function useTabIndicator(activeIndex: number) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({ left: 0, width: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const buttons = container.querySelectorAll<HTMLButtonElement>("button[data-tab]");
    const target = buttons[activeIndex];
    if (!target) return;

    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();

    setIndicatorStyle({
      left: targetRect.left - containerRect.left,
      width: targetRect.width,
    });
  }, [activeIndex]);

  return { containerRef, indicatorStyle };
}
