'use client'

export function CloseDetailsButton() {
  return (
    <button
      type="button"
      onClick={(e) => {
        ;(e.currentTarget.closest('details') as HTMLDetailsElement).open = false
      }}
      className="absolute top-3 right-3 text-[var(--color-text-muted)] hover:text-[var(--color-text-body)] text-lg leading-none"
    >
      ✕
    </button>
  )
}
