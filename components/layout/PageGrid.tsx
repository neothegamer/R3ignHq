/**
 * All detail pages must use this grid so cards in the same row always align.
 * Never stack columns independently.
 *
 * Usage:
 *   <PageGrid>
 *     <PageCard>…</PageCard>   // row 1 left
 *     <PageCard>…</PageCard>   // row 1 right
 *     <PageCard>…</PageCard>   // row 2 left
 *     <PageCard>…</PageCard>   // row 2 right
 *     <PageGridActions>…</PageGridActions>  // full-width row
 *   </PageGrid>
 */
import type { ReactNode, HTMLAttributes } from "react";

type PageGridProps = {
  children: ReactNode;
  /** Default "2-1" (main + sidebar). Use "1-1" for equal columns. */
  columns?: "2-1" | "1-1";
  className?: string;
} & HTMLAttributes<HTMLDivElement>;

export function PageGrid({
  children,
  columns = "2-1",
  className = "",
  ...rest
}: PageGridProps) {
  const colClass =
    columns === "1-1" ? "page-grid page-grid--equal" : "page-grid";
  return (
    <div className={`${colClass}${className ? ` ${className}` : ""}`} {...rest}>
      {children}
    </div>
  );
}

type PageCardProps = {
  children: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLDivElement>;

export function PageCard({
  children,
  className = "",
  ...rest
}: PageCardProps) {
  return (
    <div
      className={`page-card form-panel${className ? ` ${className}` : ""}`}
      {...rest}
    >
      {children}
    </div>
  );
}

type PageGridActionsProps = {
  children: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLDivElement>;

export function PageGridActions({
  children,
  className = "",
  ...rest
}: PageGridActionsProps) {
  return (
    <div
      className={`page-grid-actions cta-actions${className ? ` ${className}` : ""}`}
      {...rest}
    >
      {children}
    </div>
  );
}
