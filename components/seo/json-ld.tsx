/**
 * Renders a JSON-LD block. `JSON.stringify` escapes the `<` in any user-supplied
 * string, so profile text cannot close the script tag and inject markup.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
