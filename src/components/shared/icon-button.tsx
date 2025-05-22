import { cn } from "@/lib/utils"

import { Button, type ButtonProps } from "../ui/button"

function IconButton(props: ButtonProps) {
  return (
    <Button
      {...props}
      size="icon"
      variant="ghost"
      className={cn(
        "rounded-full bg-black/20 text-gray-200 shadow-lg backdrop-blur-sm hover:bg-black/30",
        props.className
      )}>
      {props.children}
    </Button>
  )
}

export default IconButton
