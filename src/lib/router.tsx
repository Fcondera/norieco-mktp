import { useSyncExternalStore, type AnchorHTMLAttributes } from "react";
import {publicStoreSlug} from './store-path.mjs';
export const MARKETPLACE = "/marketplace";
export function marketplacePath(path: string) {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  if (publicStoreSlug(path.split('?')[0])) return path;
  if (path === MARKETPLACE || path.startsWith(MARKETPLACE + "/") || path.startsWith(MARKETPLACE + "?")) return path;
  return MARKETPLACE + (path === "/" ? "" : path);
}
export function navigate(path: string) {
  history.pushState({}, "", marketplacePath(path));
  dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo(0, 0);
}
export function useLocation() {
  return useSyncExternalStore(
    (cb) => {
      addEventListener("popstate", cb);
      return () => removeEventListener("popstate", cb);
    },
    () => location.pathname + location.search,
  );
}
export function usePath() {
  const path = useLocation();
  return path === MARKETPLACE ? "/" : path.startsWith(MARKETPLACE + "/") ? path.slice(MARKETPLACE.length) : path.startsWith(MARKETPLACE + "?") ? "/" + path.slice(MARKETPLACE.length) : path;
}
export function Link({
  href = "/",
  onClick,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      {...props}
      href={marketplacePath(href)}
      onClick={(e) => {
        onClick?.(e);
        if (
          !e.defaultPrevented &&
          !e.metaKey &&
          !e.ctrlKey &&
          !e.shiftKey &&
          !e.altKey &&
          e.button === 0 &&
          href.startsWith("/") &&
          !href.startsWith("//")
        ) {
          e.preventDefault();
          navigate(href);
        }
      }}
    />
  );
}
