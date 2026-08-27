import { useMemo } from 'react';

const URL_REGEX = /\bhttps?:\/\/[^\s<>"']+/gi;

const TextWithLinks = ({ text, className = '', maxLines }) => {
  const segments = useMemo(() => {
    if (!text) return [{ type: 'text', value: '' }];

    const parts = [];
    let lastIndex = 0;
    let match;

    URL_REGEX.lastIndex = 0;
    while ((match = URL_REGEX.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
      }
      const url = match[0];
      parts.push({ type: 'link', value: url, href: url });
      lastIndex = match.index + url.length;
    }

    if (lastIndex < text.length) {
      parts.push({ type: 'text', value: text.slice(lastIndex) });
    }

    return parts.length > 0 ? parts : [{ type: 'text', value: text }];
  }, [text]);

  const content = segments.map((seg, i) =>
    seg.type === 'link' ? (
      <a
        key={i}
        href={seg.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-emerald-600 hover:text-emerald-700 underline break-all"
      >
        {seg.value}
      </a>
    ) : (
      <span key={i}>{seg.value}</span>
    )
  );

  if (maxLines) {
    return (
      <p
        className={`text-xs text-neutral-600 leading-relaxed ${className}`}
        style={{
          display: '-webkit-box',
          WebkitLineClamp: maxLines,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {content}
      </p>
    );
  }

  return (
    <p className={`text-xs text-neutral-600 leading-relaxed ${className}`}>
      {content}
    </p>
  );
};

export default TextWithLinks;
