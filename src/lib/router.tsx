import { useSyncExternalStore, type AnchorHTMLAttributes } from "react";
export function navigate(path: string) {
  history.pushState({}, "", path);
  dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo(0, 0);
}
export function usePath() {
  return useSyncExternalStore(
    (cb) => {
      addEventListener("popstate", cb);
      return () => removeEventListener("popstate", cb);
    },
    () => location.pathname + location.search,
  );
}
export function Link({
  href = "/",
  onClick,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      {...props}
      href={href}
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
