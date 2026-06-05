import type { ElementType, ReactNode } from 'react';

interface TypographyProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}

/**
 * Display Title
 * Used on: Dashboard, Analytics, Candidate Profile, Job Detail
 * Size: 40px, Bold, Tight line height, letter-spacing -0.04em
 */
export function DisplayTitle({ children, className = '', as: Component = 'h1' }: TypographyProps) {
  return (
    <Component className={`font-heading text-[40px] font-bold leading-[1.1] tracking-[-0.04em] text-primary dark:text-darktext ${className}`}>
      {children}
    </Component>
  );
}

/**
 * Page Title Text component
 * Size: 36px (text-4xl), Bold, line-height 1.2, letter-spacing -0.03em
 */
export function PageTitleText({ children, className = '', as: Component = 'h1' }: TypographyProps) {
  return (
    <Component className={`font-heading text-4xl font-bold tracking-tight leading-[1.2] text-primary dark:text-darktext ${className}`}>
      {children}
    </Component>
  );
}

/**
 * Page Title Layout Wrapper
 * Incorporates title text styling and margin spacing layout.
 */
export function PageTitle({
  title,
  subtitle,
  action,
  className = ''
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-8 flex items-start justify-between gap-4 ${className}`}>
      <div>
        <PageTitleText>{title}</PageTitleText>
        {subtitle && (
          <p className="mt-2 text-[15px] leading-relaxed text-secondary dark:text-darkmuted font-sans font-normal">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

/**
 * Section Title
 * Size: 20px (text-xl), Semibold (600), line-height 1.3
 */
export function SectionTitle({ children, className = '', as: Component = 'h2' }: TypographyProps) {
  return (
    <Component className={`font-heading text-xl font-semibold tracking-tight leading-[1.3] text-primary dark:text-darktext ${className}`}>
      {children}
    </Component>
  );
}

/**
 * Card Title
 * Size: 18px, Semibold (600), line-height 1.4
 */
export function CardTitle({ children, className = '', as: Component = 'h3' }: TypographyProps) {
  return (
    <Component className={`font-heading text-[18px] font-semibold leading-[1.4] text-primary dark:text-darktext ${className}`}>
      {children}
    </Component>
  );
}

/**
 * Body Text
 * Options: Large (16px), Default (14px), Small (13px)
 */
export function BodyText({
  children,
  variant = 'default',
  color = 'primary',
  className = '',
  as: Component = 'p'
}: TypographyProps & {
  variant?: 'large' | 'default' | 'small';
  color?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger';
}) {
  const sizes = {
    large: 'text-[16px] font-normal leading-[1.7]',
    default: 'text-[14px] font-normal leading-[1.6]',
    small: 'text-[13px] font-medium leading-[1.5]'
  };

  const colors = {
    primary: 'text-primary dark:text-darktext',
    secondary: 'text-secondary dark:text-darkmuted',
    accent: 'text-accent dark:text-darkaccent',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-danger'
  };

  return (
    <Component className={`font-sans ${sizes[variant]} ${colors[color]} ${className}`}>
      {children}
    </Component>
  );
}

/**
 * Caption Text
 * Size: 12px, Medium (500), line-height 1.4, Muted
 */
export function Caption({ children, className = '', as: Component = 'span' }: TypographyProps) {
  return (
    <Component className={`font-sans text-[12px] font-medium leading-[1.4] text-secondary dark:text-darkmuted ${className}`}>
      {children}
    </Component>
  );
}
