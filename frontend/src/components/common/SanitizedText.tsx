import React from 'react'
import DOMPurify from 'dompurify'

interface SanitizedTextProps {
  text: string
  className?: string
  tagName?: 'div' | 'span' | 'p'
}

export const SanitizedText: React.FC<SanitizedTextProps> = ({
  text,
  className,
  tagName = 'span',
}) => {
  const sanitizedHTML = DOMPurify.sanitize(text)
  const Tag = tagName

  return (
    <Tag
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
    />
  )
}
