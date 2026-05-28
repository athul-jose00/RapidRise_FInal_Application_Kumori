import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export const classNames = (...values) => values.filter(Boolean).join(" ");

export function useReveal(scopeRef) {
  useEffect(() => {
    if (!scopeRef.current) return undefined;

    const ctx = gsap.context(() => {
      const items = scopeRef.current.querySelectorAll("[data-reveal]");
      items.forEach((item, index) => {
        gsap.fromTo(
          item,
          { opacity: 0, y: 30, filter: "blur(8px)" },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.8,
            ease: "power2.out",
            delay: index * 0.05,
            scrollTrigger: {
              trigger: item,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          },
        );
      });
    }, scopeRef);

    return () => ctx.revert();
  }, [scopeRef]);
}

export function SectionHeading({
  eyebrow,
  title,
  highlightText,
  description,
  align = "left",
}) {
  return (
    <div
      className={classNames(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
      )}
    >
      <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.4em] text-[#C62828]">
        {eyebrow}
      </p>
      <h2 className="text-balance text-3xl font-bold leading-tight tracking-tight text-neutral-900 sm:text-4xl lg:text-5xl">
        {title}{" "}
        {highlightText && (
          <span className="font-bold text-[#C62828]">{highlightText}</span>
        )}
      </h2>
      <p
        className={classNames(
          "mt-4 text-base leading-relaxed text-neutral-500 sm:text-lg",
          align === "center" && "mx-auto max-w-2xl",
        )}
      >
        {description}
      </p>
    </div>
  );
}

export function Button({ children, variant = "solid", href, className }) {
  const base =
    "inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2";

  const styles =
    variant === "solid"
      ? "bg-neutral-900 !text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 hover:bg-neutral-800 hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] active:translate-y-0"
      : variant === "accent"
        ? "bg-[#C62828] !text-white shadow-[0_4px_12px_rgba(198,40,40,0.15)] hover:-translate-y-0.5 hover:bg-[#D32F2F] hover:shadow-[0_8px_20px_rgba(198,40,40,0.25)] active:translate-y-0"
        : variant === "outline"
          ? "border border-neutral-200 bg-white text-neutral-800 hover:border-neutral-300 hover:bg-neutral-50"
          : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800";

  if (href) {
    return (
      <a href={href} className={classNames(base, styles, className)}>
        {children}
      </a>
    );
  }

  return (
    <button className={classNames(base, styles, className)}>{children}</button>
  );
}
