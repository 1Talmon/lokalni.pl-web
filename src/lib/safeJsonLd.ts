/**
 * Serialize JSON-LD for `<script type="application/ld+json">`.
 * JSON.stringify does not escape `<`, so user content like `</script ` could close the tag and
 * inject HTML — exploitable because CSP allows 'unsafe-inline'. Escape the HTML-significant chars.
 */
export const safeJsonLd = (data: unknown): string =>
    JSON.stringify(data)
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .replace(/&/g, '\\u0026');
