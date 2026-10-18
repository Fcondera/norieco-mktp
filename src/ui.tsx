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
          <span className="verified" title="Empresa verificada">
            <Icon name="check" size={14} />
            <span className="sr-only">Verificada</span>
          </span>
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
          {b.listing_type === "INTEGRATED"
            ? "Ver cardápio"
            : "Conhecer empresa"}
          <Icon name="arrow" size={16} />
        </div>
        {b.listing_type === "INTEGRATED" && (
          <small>Integrado ao Nori Gestão</small>
        )}
      </div>
    </Link>
  );
}
