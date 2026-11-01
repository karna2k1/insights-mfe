// Shared UI kit exposed by jobradar-shell (keep in sync with jobradar-shell/src/ui/index.tsx).
declare module 'shell/ui' {
  import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode, JSX } from 'react';
  type Tone = 'indigo' | 'green' | 'amber' | 'rose' | 'slate';
  export function Button(
    props: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; size?: 'sm' | 'md' },
  ): JSX.Element;
  export function Card(props: HTMLAttributes<HTMLDivElement>): JSX.Element;
  export function Badge(props: { tone?: Tone; children: ReactNode; className?: string }): JSX.Element;
  export function ScoreBadge(props: { score: number }): JSX.Element;
  export function Input(props: InputHTMLAttributes<HTMLInputElement>): JSX.Element;
  export function Spinner(props: { label?: string }): JSX.Element;
  export function EmptyState(props: { title: string; hint?: string }): JSX.Element;
  export function ErrorNote(props: { message: string }): JSX.Element;
}
