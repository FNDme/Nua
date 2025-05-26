import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Figma,
  Github,
  Link,
  Mail,
  Newspaper,
  PencilOff,
  Trash,
  Trello,
  Twitter,
  type LucideIcon
} from "lucide-react"
import React, { useEffect, useState } from "react"

import { useUserPreferences } from "~/context/user-preferences.context"
import { cn } from "~/lib/utils"

import IconButton from "../shared/icon-button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "../ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../ui/select"

const availableIcons: { name: string; icon: LucideIcon }[] = [
  {
    name: "Link",
    icon: Link
  },
  {
    name: "Github",
    icon: Github
  },
  {
    name: "Figma",
    icon: Figma
  },
  {
    name: "Trello",
    icon: Trello
  },
  {
    name: "News",
    icon: Newspaper
  },
  {
    name: "Email",
    icon: Mail
  }
]
type AvailableIcons = (typeof availableIcons)[number]["name"]

function QuickLinks() {
  const {
    preferences: { quickLinks },
    updateQuickLinks
  } = useUserPreferences()

  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const [icon, setIcon] = useState<AvailableIcons>("Link")

  const handleDeleteLink = (name: string) => {
    const newLinks = quickLinks.links.filter((link) => link.name !== name)
    updateQuickLinks({
      links: newLinks,
      isEditing: newLinks.length > 0
    })
  }

  const handleAddLink = () => {
    updateQuickLinks({
      links: [...quickLinks.links, { name, url, icon }],
      isCreating: false
    })
    setName("")
    setUrl("")
    setIcon("Link")
  }

  return (
    <div className="flex h-full flex-col gap-2">
      {quickLinks.links.map((link) => (
        <div
          className="group relative flex h-fit items-center justify-center"
          title={link.name}
          key={`${link.name}-${link.url}`}>
          <span
            className={cn(
              "absolute right-0 top-1/2 -translate-y-1/2 translate-x-0 content-center rounded-full bg-black/30 py-1 pl-2 pr-4 text-gray-200 opacity-0 transition-all duration-300 group-hover:-translate-x-10 group-hover:opacity-100",
              quickLinks.isEditing && "hidden"
            )}>
            {link.name}
          </span>
          <IconButton
            title={link.name}
            disabled={quickLinks.isEditing}
            onClick={() => window.open(link.url, "_blank")}>
            {availableIcons.find((icon) => icon.name === link.icon)?.icon &&
              React.createElement(
                availableIcons.find((icon) => icon.name === link.icon)!.icon
              )}
          </IconButton>
          {quickLinks.isEditing && (
            <Trash
              className="absolute right-0 top-0 cursor-pointer rounded-full bg-red-500/60 p-1 text-gray-600 shadow-lg backdrop-blur-sm hover:bg-red-500/30 hover:text-gray-200"
              size={16}
              onClick={() => handleDeleteLink(link.name)}
            />
          )}
        </div>
      ))}
      {quickLinks.isEditing && (
        <IconButton
          title="Stop editing"
          className="absolute right-0 top-0 -translate-x-[calc(100%+0.5rem)] rounded-full bg-black/20 text-gray-600 shadow-lg backdrop-blur-sm hover:bg-black/30 hover:text-gray-200"
          onClick={() => updateQuickLinks({ isEditing: false })}>
          <PencilOff />
        </IconButton>
      )}
      <Dialog
        open={quickLinks.isCreating}
        onOpenChange={(open) => updateQuickLinks({ isCreating: open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Link</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Input
              type="text"
              placeholder="Link name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              type="text"
              placeholder="Link URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <Select
              value={icon}
              onValueChange={(value) => setIcon(value as AvailableIcons)}>
              <SelectTrigger>
                <SelectValue placeholder="Select icon" />
              </SelectTrigger>
              <SelectContent>
                {availableIcons.map((icon) => (
                  <SelectItem key={icon.name} value={icon.name}>
                    {icon.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button className="self-end" onClick={handleAddLink}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default QuickLinks
