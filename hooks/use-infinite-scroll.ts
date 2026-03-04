import { useInViewport } from "ahooks";
import type { RefObject } from "react";
import { useCallback, useEffect, useRef } from "react";

const SCROLLABLE_OVERFLOW = new Set<string>(["auto", "scroll", "overlay"]);

const DEFAULT_ROOT_MARGIN = "0px 0px 400px 0px";

const SCROLL_CONTAINER_SELECTOR = "[data-scroll-container]";

function isScrollable(overflow: string): boolean {
  return SCROLLABLE_OVERFLOW.has(overflow);
}

function findScrollParent(element: Element | null): Element | null {
  const byAttr = element?.closest(SCROLL_CONTAINER_SELECTOR) ?? null;
  if (byAttr) return byAttr;

  let parent = element?.parentElement ?? null;
  while (parent) {
    const { overflowX, overflowY } = getComputedStyle(parent);
    if (isScrollable(overflowX) || isScrollable(overflowY)) return parent;
    parent = parent.parentElement;
  }
  return null;
}

export type UseInfiniteScrollLoadMoreOptions = {
  loadMoreRef: RefObject<HTMLDivElement | null>;
  loadMore: (numItems: number) => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  pageSize: number;
  enabled?: boolean;
  rootMargin?: string;
};

/**
 * Infinite scroll for Convex paginated queries.
 * Uses ahooks useInViewport with scroll container as root.
 *
 * @see https://docs.convex.dev/database/pagination
 * @see https://ahooks.js.org/hooks/use-in-viewport
 */
export function useInfiniteScrollLoadMore({
  loadMoreRef,
  loadMore,
  hasNextPage,
  isFetchingNextPage,
  pageSize,
  enabled = true,
  rootMargin = DEFAULT_ROOT_MARGIN,
}: UseInfiniteScrollLoadMoreOptions): void {
  const getRoot = useCallback(
    () => findScrollParent(loadMoreRef.current) ?? null,
    [loadMoreRef],
  );

  const [inView] = useInViewport(loadMoreRef, {
    root: getRoot,
    rootMargin,
    threshold: 0,
  });

  const wasInViewRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const shouldLoadMore =
      inView === true &&
      !wasInViewRef.current &&
      hasNextPage &&
      !isFetchingNextPage;

    wasInViewRef.current = inView === true;

    if (shouldLoadMore) {
      loadMore(pageSize);
    }
  }, [inView, hasNextPage, isFetchingNextPage, loadMore, pageSize, enabled]);
}
