/**
 * Helpers to convert attribute strings like:
 *   ".opacity 60 .gray 80 .mark .border"
 * into safe class names:
 *   "opacity-60 gray-80 mark border"
 *
 * This version fixes handling of negative numbers and non-digit tokens:
 *  - Numeric tokens must be pure digits (^\d+$). Negative numbers (e.g. -20) are ignored.
 *  - Non-numeric tokens that are not valid class-name candidates are ignored (so stray "-20"
 *    won't become a class).
 *  - For classes that accept numeric parameters (e.g. `opacity`, `gray`):
 *      {.opacity 60} -> "opacity-60"
 *      {.opacity} -> "opacity-50" (fallback)
 *  - If a class does NOT accept a numeric parameter but a numeric token follows it,
 *    the numeric token is consumed and ignored (prevents it being used for the next class).
 */

const numericClasses = new Set<string>(["opacity", "gray"]);
const NUMERIC_FALLBACK = 50;

/** Return true if the token is a pure integer token (digits only). */
function isIntegerToken(tok: string | undefined): boolean {
  return typeof tok === "string" && /^\d+$/.test(tok);
}

/** Clamp a numeric percent to 0..100. */
function clampPercent(n: number): number {
  if (!Number.isFinite(n)) return NUMERIC_FALLBACK;
  const i = Math.round(n);
  if (i < 0) return 0;
  if (i > 100) return 100;
  return i;
}

/** Sanitize a name to allowed characters for CSS class segments. */
function sanitizeName(name: string): string {
  return name.replace(/[^A-Za-z0-9_-]/g, "");
}

/** Validate that a candidate is a reasonable class name start (not a stray "-20"). */
function isValidClassCandidate(name: string): boolean {
  // Must start with letter, underscore, or hyphen is allowed but avoid leading hyphen-only tokens.
  // We disallow names that start with a digit or a solitary hyphen followed by digits (e.g. "-20").
  return /^[A-Za-z_][A-Za-z0-9_-]*$/.test(name);
}

/**
 * Convert an attribute string (contents inside `{ ... }`, but without braces) to a
 * space-separated class list suitable for emitting on an element.
 *
 * Rules implemented:
 *  - Tokens with leading dots are tolerated (".opacity 60" or "opacity 60").
 *  - Numeric tokens must be pure digits (^\d+$). Negative numbers or tokens with other
 *    characters are not treated as numbers.
 *  - Numeric-accepting classes (numericClasses) will pair with a following integer token
 *    (consumed) or fall back to NUMERIC_FALLBACK if none present.
 *  - Explicit hyphenated classes like "opacity-60" are accepted and numeric part clamped.
 *  - Non-numeric classes followed by a numeric token will consume and ignore that numeric token.
 *  - Stray numeric tokens with no preceding class are ignored.
 */
export function attrsToClass(attrs: string): string {
  if (!attrs || typeof attrs !== "string") return "";

  const parts = attrs.trim().split(/\s+/);
  const classes: string[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < parts.length; i++) {
    let token = parts[i];
    if (!token) continue;

    // Strip leading dots (".opacity" -> "opacity")
    if (token.startsWith(".")) {
      token = token.replace(/^\.+/, "");
    }
    if (!token) continue;

    // If token is a pure integer, it's a stray number -> ignore
    if (isIntegerToken(token)) {
      continue;
    }

    // If token is explicit hyphen-number like "opacity-60" or "gray-80"
    const explicitMatch = token.match(/^([A-Za-z0-9_-]+)-(\d+)$/);
    if (explicitMatch) {
      const name = sanitizeName(explicitMatch[1] as string);
      if (!name) continue;
      const val = clampPercent(Number(explicitMatch[2]));
      const final = `${name}-${val}`;
      if (!seen.has(final)) {
        classes.push(final);
        seen.add(final);
      }
      continue;
    }

    // If token is not a valid class candidate (e.g. "-20" or "!!bad"), skip it
    const candidateRaw = sanitizeName(token);
    if (!candidateRaw) continue;
    if (!isValidClassCandidate(candidateRaw)) {
      // If it's not a valid candidate but the next token is a pure integer, consume the integer
      // to avoid it being used by a later numeric class. This behavior aligns with the spec:
      // numbers following non-numeric classes are ignored/consumed.
      const next = parts[i + 1];
      if (isIntegerToken(next)) {
        i++;
      }
      continue;
    }

    // If this candidate expects a numeric parameter, check next token
    if (numericClasses.has(candidateRaw)) {
      const next = parts[i + 1];
      let value = NUMERIC_FALLBACK;
      if (isIntegerToken(next)) {
        value = clampPercent(Number(next));
        i++; // consume numeric token
      }
      const final = `${candidateRaw}-${value}`;
      if (!seen.has(final)) {
        classes.push(final);
        seen.add(final);
      }
      continue;
    }

    // Non-numeric class: if next token is a pure integer, consume and ignore it per spec.
    const nextToken = parts[i + 1];
    if (isIntegerToken(nextToken)) {
      i++; // consume stray numeric token
    }

    if (!seen.has(candidateRaw)) {
      classes.push(candidateRaw);
      seen.add(candidateRaw);
    }
  }

  return classes.join(" ");
}

/**
 * Parse into an ordered list of tokens for debugging or testing.
 * Returns objects like { name: 'opacity', value: 60 } or { name: 'mark' }.
 */
export function parseAttrsToTokens(attrs: string): Array<{ name: string; value?: number }> {
  const out: Array<{ name: string; value?: number }> = [];
  if (!attrs || typeof attrs !== "string") return out;

  const parts = attrs.trim().split(/\s+/);
  for (let i = 0; i < parts.length; i++) {
    let token = parts[i];
    if (!token) continue;
    if (token.startsWith(".")) token = token.replace(/^\.+/, "");
    if (!token) continue;

    // stray pure integers -> ignore
    if (isIntegerToken(token)) continue;

    // explicit hyphen-number
    const explicitMatch = token.match(/^([A-Za-z0-9_-]+)-(\d+)$/);
    if (explicitMatch) {
      const name = sanitizeName(explicitMatch[1] as string);
      if (!name) continue;
      out.push({ name, value: clampPercent(Number(explicitMatch[2])) });
      continue;
    }

    const candidateRaw = sanitizeName(token);
    if (!candidateRaw) continue;
    if (!isValidClassCandidate(candidateRaw)) {
      // consume next integer if present and ignore
      const next = parts[i + 1];
      if (isIntegerToken(next)) i++;
      continue;
    }

    if (numericClasses.has(candidateRaw)) {
      const next = parts[i + 1];
      let value: number | undefined;
      if (isIntegerToken(next)) {
        value = clampPercent(Number(next));
        i++;
      } else {
        value = NUMERIC_FALLBACK;
      }
      out.push({ name: candidateRaw, value });
      continue;
    }

    // Non-numeric class: consume trailing integer if present (ignore)
    const trailing = parts[i + 1];
    if (isIntegerToken(trailing)) i++;

    out.push({ name: candidateRaw });
  }

  return out;
}
