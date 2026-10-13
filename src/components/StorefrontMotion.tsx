'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/** Arm reveals before entry so the movement happens inside the viewport. */
export default function StorefrontMotion({ children, className }: { children: ReactNode; className?: string }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = root.current;
    if (!element || !('IntersectionObserver' in window)) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const registered = new Set<HTMLElement>();
    const selector = '[data-motion], [data-motion-stagger] > *';
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const target = entry.target as HTMLElement;
        target.dataset.reveal = 'visible';
        observer.unobserve(target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    const discover = () => {
      // Release removed products when filters or remote collections change.
      registered.forEach((target) => {
        if (!element.contains(target)) {
          observer.unobserve(target);
          registered.delete(target);
        }
      });
      element.querySelectorAll<HTMLElement>(selector).forEach((target) => {
        if (registered.has(target)) return;
        registered.add(target);
        const parent = target.parentElement;
        const siblings = parent ? Array.from(parent.children) : [];
        const index = Math.max(0, siblings.indexOf(target));
        const isCard = parent?.hasAttribute('data-motion-stagger') || target.dataset.motion === 'pop';

        // Gentle, slow, vertical luxury float with subtle scale
        target.style.setProperty('--reveal-x', '0px');
        target.style.setProperty('--reveal-y', isCard ? '28px' : '22px');
        target.style.setProperty('--reveal-scale', isCard ? '0.96' : '0.985');
        target.style.setProperty('--reveal-delay', `${isCard ? (index % 4) * 140 : 0}ms`);
        // Already-passed content must remain visible on restored scroll positions.
        if (preference.matches || target.getBoundingClientRect().bottom < 0) {
          target.dataset.reveal = 'complete';
        } else {
          target.dataset.reveal = 'pending';
          observer.observe(target);
        }
      });
    };
    discover();
    const mutations = new MutationObserver(discover);
    mutations.observe(element, { childList: true, subtree: true });
    const finishMotion = (event: AnimationEvent) => {
      if (event.animationName === 'storefront-reveal' && event.target instanceof HTMLElement) {
        event.target.dataset.reveal = 'complete';
      }
    };
    const revealFocused = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return;
      let target: HTMLElement | null = event.target.closest('[data-reveal]');
      while (target && element.contains(target)) {
        target.dataset.reveal = 'complete';
        observer.unobserve(target);
        target = target.parentElement?.closest<HTMLElement>('[data-reveal]') || null;
      }
    };
    const cancelMotion = () => {
      if (!preference.matches) return;
      observer.disconnect();
      registered.forEach((target) => { target.dataset.reveal = 'complete'; });
    };
    preference.addEventListener('change', cancelMotion);
    element.addEventListener('animationend', finishMotion);
    element.addEventListener('focusin', revealFocused);
    return () => {
      observer.disconnect();
      mutations.disconnect();
      preference.removeEventListener('change', cancelMotion);
      element.removeEventListener('animationend', finishMotion);
      element.removeEventListener('focusin', revealFocused);
      registered.forEach((target) => { delete target.dataset.reveal; });
    };
  }, []);

  return <div ref={root} className={`storefront-motion ${className || ''}`}>{children}</div>;
}
