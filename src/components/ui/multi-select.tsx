import * as React from "react"
import { Check, ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface Option {
  id: number | string
  name: string
  slug?: string
}

interface MultiSelectProps {
  options: Option[]
  selected: (number | string)[]
  onChange: (selected: (number | string)[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  /** Caps how many options can be selected at once (e.g. remaining slots left in a limit). */
  max?: number
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options...",
  className,
  disabled = false,
  max,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const atMax = typeof max === "number" && selected.length >= max

  const handleUnselect = (item: number | string) => {
    onChange(selected.filter((s) => s !== item))
  }

  const handleSelect = (item: number | string) => {
    if (selected.includes(item)) {
      onChange(selected.filter((s) => s !== item))
    } else {
      if (atMax) return
      onChange([...selected, item])
    }
  }

  const selectedOptions = options.filter((option) => selected.includes(option.id))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between min-h-[40px] h-auto",
            className
          )}
          disabled={disabled}
        >
          <div className="flex gap-1 flex-wrap">
            {selectedOptions.length > 0 ? (
              selectedOptions.map((option) => (
                <Badge
                  variant="secondary"
                  key={option.id}
                  className="mr-1 mb-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleUnselect(option.id)
                  }}
                >
                  {option.name}
                  <button
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleUnselect(option.id)
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleUnselect(option.id)
                    }}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] max-w-[calc(100vw-2rem)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search options..." />
          <CommandList>
            <CommandEmpty>No options found.</CommandEmpty>
            <CommandGroup>
              {typeof max === "number" && (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  {selected.length} / {max} selected
                </div>
              )}
              {options.map((option) => {
                const isSelected = selected.includes(option.id)
                const disableOption = atMax && !isSelected
                return (
                  <CommandItem
                    key={option.id}
                    onSelect={() => !disableOption && handleSelect(option.id)}
                    className={cn(disableOption && "opacity-40 cursor-not-allowed")}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.name}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}