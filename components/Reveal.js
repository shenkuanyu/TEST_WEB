'use client';
import { useEffect, useRef, useState } from 'react';

/**
 * 捲動到畫面時淡入顯示的包裝元件（仿 AOS）
 * 用法：<Reveal variant="fade-right" delay={100}>內容</Reveal>
 */
export default function Reveal({
  children,
  variant = 'fade-up',
  delay = 0,
  duration = 700,
  once = true,
  className = '',
  as: Tag = 'div',
}) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true);
            if (once) io.unobserve(e.target);
          } else if (!once) {
            setShown(false);
          }
        });
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once]);

  const init = {
    'fade-up': 'translate-y-8',
    'fade-down': '-translate-y-8',
    'fade-left': 'translate-x-8',
    'fade-right': '-translate-x-8',
    'zoom-in': 'scale-95',
    fade: '',
  }[variant] || 'translate-y-8';

  return (
    <Tag
      ref={ref}
      style={{ transitionDuration: `${duration}ms`, transitionDelay: `${delay}ms` }}
      className={`transition-all ease-out ${shown ? 'opacity-100 translate-x-0 translate-y-0 scale-100' : `opacity-0 ${init}`} ${className}`}
    >
      {children}
    </Tag>
  );
}
