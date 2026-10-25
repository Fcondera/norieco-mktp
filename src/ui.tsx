import {
  type ReactNode,
  useEffect,
  useState,
  useId,
  cloneElement,
  isValidElement,
} from "react";
import { Link } from "./lib/router";
import { safeImage, distanceLabel } from "./lib/core.mjs";
import type { Business } from "./lib/types";
export function Icon({ name, size = 22 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),
    pin: (
      <>
        <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    home: (
      <>
        <path d="m3 10 9-7 9 7v11H3Z" />
        <path d="M9 21v-8h6v8" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="7" r="4" />
        <path d="M4 21v-3a8 8 0 0 1 16 0v3" />
      </>
    ),
    bag: (
      <>
        <path d="M4 7h16l1 14H3Z" />
        <path d="M8 8V6a4 4 0 0 1 8 0v2" />
      </>
    ),
    heart: <path d="M12 21 3 12C-3 4 7-1 12 6 17-1 27 4 21 12Z" />,
    check: (
      <>
        <path d="m4 12 5 5L20 6" />
      </>
    ),
    food: (
      <>
        <path d="M4 3v7h6V3M7 3v18M20 21V3c-7 3-7 10 0 10" />
      </>
    ),
    burger: <><path d="M3 10c0-9 18-9 18 0ZM3 14h18M4 18h16l-1 3H5Z"/><path d="m3 13 4 2 5-2 5 2 4-2M8 6h.01M12 5h.01M16 6h.01"/></>,
    shirt: <path d="m8 3-6 4 3 5 3-2v11h8V10l3 2 3-5-6-4c0 5-8 5-8 0Z"/>,
    basket: <><path d="M3 9h18l-2 12H5ZM7 9l4-6m2 0 4 6M9 13v4m6-4v4"/></>,
    pharmacy: <><path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6Z"/></>,
    beach: <><path d="M3 20c2-2 4 2 6 0s4 2 6 0 4 2 6 0M13 18l-3-9M3 10c-1-8 13-12 17-4l-8 2Z"/><path d="M10 3c-2 1-3 3-2 6m2-6c3 0 5 2 6 4"/></>,
    gamepad: <><path d="M7 7h10c4 0 7 13 3 14-2 0-4-4-5-4H9c-1 0-3 4-5 4C0 20 3 7 7 7ZM7 10v5m-2-2h4M16 11h.01M19 14h.01M12 7V3"/></>,
    sunset: <><path d="M3 16h18M5 20h14M7 16a5 5 0 0 1 10 0M12 2v3M3 7l3 2m15-2-3 2M2 12h2m16 0h2"/></>,
    compass: <><circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6Z"/></>,
    scissors: <><circle cx="5" cy="6" r="3"/><circle cx="5" cy="18" r="3"/><path d="m8 7 13 14M8 17 21 3M12 12h.01"/></>,
    fish: <><path d="M3 12c4-9 12-9 17 0-5 9-13 9-17 0Zm0 0L1 7v10ZM11 5l3-3 2 4M12 19l3 3 1-4"/><circle cx="16" cy="10" r=".5"/></>,
    bottle: <><path d="M9 2h6v5l3 5v9H6v-9l3-5ZM9 5h6M6 13h12M6 18h12"/></>,
    drink: (
      <>
        <path d="M5 7h14l-2 14H7ZM12 7V3h6" />
      </>
    ),
    shop: (
      <>
        <path d="M3 9 5 3h14l2 6v3H3ZM5 12v9h14v-9M9 21v-6h6v6" />
      </>
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2" />
      </>
    ),
    tools: (
      <>
        <path d="m3 21 10-10M15 3a6 6 0 0 0 6 8l-5-2-1-4 3-2Z" />
      </>
    ),
    message: <path d="M21 11a9 9 0 0 1-9 9H4l-3 2 2-6a9 9 0 1 1 18-5ZM7 10h10M7 14h6" />,
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    arrow: <path d="m9 5 7 7-7 7" />,
    close: <path d="m5 5 14 14M5 19 19 5" />,
    star: <path d="m12 2 3 6 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1Z" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 6v6l4 2" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.shop}
    </svg>
  );
}
export function Notice({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <div
      className={`notice ${error ? "error" : ""}`}
      role={error ? "alert" : "status"}
    >
      {children}
    </div>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <Icon name="shop" size={32} />
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export function Loading() {
  return (
    <div className="loading" role="status">
      Carregando…
      <div className="skeleton" />
      <div className="skeleton" />
    </div>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {isValidElement<{ id?: string; "aria-describedby"?: string }>(children)
        ? cloneElement(children, {
            id,
            ...(hint ? { "aria-describedby": id + "-hint" } : {}),
          })
        : children}
      {hint && <small id={id + "-hint"}>{hint}</small>}
    </div>
  );
}
export function Photo({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return safeImage(src) && !failed ? (
    <img
      className={className}
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  ) : (
    <div
      className={`photo-placeholder ${className}`}
      role="img"
      aria-label={alt}
    >
      <Icon name="shop" size={32} />
    </div>
  );
}
export function BusinessCard({ business: b }: { business: Business }) {
  return (
    <Link className="business-card" href={`/loja/${b.slug}`}>
      <Photo
        src={b.cover_url || b.logo_url}
        alt={b.name}
        className="business-cover"
      />
      <div className="card-body">
        <div className="card-heading">
          <h3>{b.name}</h3>
          {b.document_verified === true && <span className="verified" title="Documentação verificada">
            <Icon name="check" size={14} />
            <span className="sr-only">Verificada</span>
          </span>}
        </div>
        <p>
          {b.category_name} <span aria-hidden="true">·</span> {b.city}
        </p>
        <div className="business-meta">
          <span className={b.is_open ? "open" : ""}>
            {b.is_open ? "Aberto agora" : "Fechado"}
          </span>
          {b.rating != null && <span>★ {Number(b.rating).toFixed(1)}</span>}
          {b.distance_km != null && <span>{distanceLabel(b.distance_km)}</span>}
        </div>
        <p className="card-description">{b.description}</p>
        <div className="card-action">
          Conhecer loja
          <Icon name="arrow" size={16} />
        </div>
        {b.listing_type === "INTEGRATED" && (
          <small>Integrado ao Nori Gestão</small>
        )}
      </div>
    </Link>
  );
}
