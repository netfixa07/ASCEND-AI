import * as React from "react"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white dark:group-[.toaster]:bg-zinc-950 group-[.toaster]:text-zinc-950 dark:group-[.toaster]:text-zinc-50 group-[.toaster]:border-zinc-200 dark:group-[.toaster]:border-zinc-800 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-zinc-500 dark:group-[.toast]:text-zinc-400",
          actionButton:
            "group-[.toast]:bg-zinc-900 dark:group-[.toast]:bg-zinc-50 group-[.toast]:text-zinc-50 dark:group-[.toast]:text-zinc-900",
          cancelButton:
            "group-[.toast]:bg-zinc-100 dark:group-[.toast]:bg-zinc-800 group-[.toast]:text-zinc-500 dark:group-[.toast]:text-zinc-400",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
