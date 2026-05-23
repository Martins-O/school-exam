'use client';

import { useEffect, useRef } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
}

export default function MathRenderer({ content }: MathRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.querySelectorAll<HTMLElement>('.math').forEach((el) => {
      const tex = el.getAttribute('data-value') || el.textContent || '';
      const isBlock = el.tagName === 'DIV' || el.classList.contains('math-display');
      try {
        const html = katex.renderToString(tex, {
          displayMode: isBlock,
          throwOnError: false,
        });
        el.outerHTML = html;
      } catch {
        el.outerHTML = `<span class="math-error" style="color:red">${tex}</span>`;
      }
    });

    containerRef.current.querySelectorAll<HTMLElement>('math').forEach((el) => {
      const tex = el.getAttribute('data-value') || el.textContent || '';
      const isBlock = el.tagName === 'MATH' && el.hasAttribute('display');
      try {
        const html = katex.renderToString(tex, {
          displayMode: isBlock,
          throwOnError: false,
        });
        el.outerHTML = html;
      } catch {
        el.outerHTML = `<span class="math-error" style="color:red">${tex}</span>`;
      }
    });
  }, [content]);

  return <div ref={containerRef} className="math-content" dangerouslySetInnerHTML={{ __html: content }} />;
}
