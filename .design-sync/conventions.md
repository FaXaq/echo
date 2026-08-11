## Working with this design system

This is Echo's shadcn/ui-based component kit (Tailwind CSS v4 + Radix primitives), synced directly from `apps/web/src/components/ui/*.tsx`. It ships no separate "theme provider" component — styling is driven entirely by CSS custom properties already baked into `styles.css`.

### Setup

No wrapping component is required. Just load `styles.css` (it `@import`s the compiled Tailwind output, all component CSS, and the self-hosted Inter Variable font) before rendering. Every component reads its colors from CSS variables already defined at `:root`, so components render correctly with zero extra setup:

```jsx
import { Button } from "EchoUI";
// styles.css is already linked on the page — just use the component.
<Button variant="default">Save</Button>
```

**Dark mode**: add a `dark` class to any ancestor element (`<html class="dark">` or lower) — every token flips via `@custom-variant dark (&:is(.dark *))`. There is no separate dark-mode component API; it's purely the ancestor class.

### Styling idiom: semantic Tailwind utility classes, not raw hex/oklch

Never hand-write colors. Every component composes from this token family (Tailwind v4 utilities backed by CSS variables — same names work as `bg-*`, `text-*`, `border-*`, `ring-*`):

| Token | Use for |
|---|---|
| `background` / `foreground` | page/app base surface and default text |
| `card` / `card-foreground` | panel, card, and elevated-surface backgrounds |
| `primary` / `primary-foreground` | primary buttons, active/selected states |
| `secondary` / `secondary-foreground` | secondary buttons, subdued surfaces |
| `muted` / `muted-foreground` | placeholders, disabled text, helper text |
| `accent` / `accent-foreground` | hover/highlight states on menu items etc. |
| `destructive` | delete/danger actions and error text (used as both background tint and text color — e.g. `bg-destructive/10 text-destructive`; there is no separate `destructive-foreground` token) |
| `border`, `input`, `ring` | borders, form-control borders, focus rings |
| `sidebar`, `sidebar-foreground`, `sidebar-border`, `sidebar-accent` | sidebar-specific surface family (`Sidebar` component only) |

Example: `className="bg-primary text-primary-foreground hover:bg-primary/80"` — never `className="bg-[#1a1a1a]"`.

Radius uses the same pattern: `rounded-md` / `rounded-lg` (backed by `--radius`), not arbitrary pixel values.

### Where the truth lives

- `styles.css` — the full compiled stylesheet (Tailwind utilities + tokens + fonts); read it before inventing a new class name to confirm it exists.
- Each component's `<Name>.d.ts` — exact prop signature.
- Each component's `<Name>.prompt.md` — usage examples pulled from this repo's own Storybook stories.

### Example composition

A typical form field, combining `Field`/`Label`/`Input`/`Button` with the semantic tokens above:

```jsx
<Field>
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="you@example.com" />
  <FieldDescription className="text-muted-foreground">
    We'll never share your email.
  </FieldDescription>
</Field>
<Button variant="default">Submit</Button>
```
