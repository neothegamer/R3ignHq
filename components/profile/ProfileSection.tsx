import type { ReactNode } from "react";

type Props = {
  icon: string;
  title: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
};

export default function ProfileSection({
  icon,
  title,
  action,
  className = "",
  children,
}: Props) {
  return (
    <section className={`profile-section ${className}`.trim()}>
      <header className="profile-section-heading">
        <h2>
          <span className="profile-section-icon" aria-hidden="true">
            {icon}
          </span>
          {title}
        </h2>
        {action}
      </header>
      {children}
    </section>
  );
}

export function SectionLoadError({ message }: { message: string | undefined }) {
  if (!message) return null;
  return (
    <p className="profile-inline-error" role="alert">
      Could not load this section: {message}
    </p>
  );
}
