import { Input } from "@/components/ui/input"
import useSearch from "@/hooks/search"
import type { InputHTMLAttributes } from "react"

export default function SearchInput(
  props: InputHTMLAttributes<HTMLInputElement>
) {
  const { search, handleGoogleSearch, setSearch } = useSearch()
  return (
    <Input
      placeholder="Search"
      onChange={(e) => setSearch(e.target.value)}
      onKeyDown={handleGoogleSearch}
      value={search}
      {...props}
    />
  )
}
