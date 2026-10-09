/**
 * The owned glyph set. Icons are verbs and directions only (search, close,
 * sort, external link); nouns such as Orders or Products are words.
 * Drawn on a 16px grid, 1.5px stroke, round joins, no fills.
 * A new glyph needs a reason it can't be a word.
 */
const PATHS = {
  search: 'M7 12.25A5.25 5.25 0 1 0 7 1.75a5.25 5.25 0 0 0 0 10.5ZM10.75 10.75 14.25 14.25',
  close: 'M3.5 3.5l9 9M12.5 3.5l-9 9',
  'arrow-r': 'M2.5 8h11M9.5 4l4 4-4 4',
  external: 'M6 3H3v10h10v-3M9 2.5h4.5V7M13.5 2.5 7.5 8.5',
  chevron: 'M6 3.5 10.5 8 6 12.5',
  sort: 'M5 6l3-3 3 3M5 10l3 3 3-3',
  filter: 'M2.5 4h11M4.5 8h7M6.5 12h3',
  copy: 'M5.5 5.5h8v8h-8zM10.5 5.5v-3h-8v8h3',
  refresh: 'M13 8a5 5 0 1 1-1.5-3.6M13 2.5v3h-3',
  download: 'M8 2.5v8M4.5 7 8 10.5 11.5 7M3 13.5h10',
  menu: 'M2.5 4.5h11M2.5 8h11M2.5 11.5h11',
  more: 'M3.5 8h.01M8 8h.01M12.5 8h.01',
} as const;

export type GlyphName = keyof typeof PATHS;

export function Glyph({
  name,
  size = 16,
  className,
  title,
}: {
  name: GlyphName;
  size?: number;
  className?: string;
  /** Only when the glyph is the sole content of a control; otherwise decorative. */
  title?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={name === 'more' ? 2.25 : 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title ? <title>{title}</title> : null}
      <path d={PATHS[name]} />
    </svg>
  );
}
