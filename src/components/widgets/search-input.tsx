import { Input } from "@/components/ui/input"
import useSearch from "@/hooks/search"
import type { InputHTMLAttributes } from "react"

export default function SearchInput(
  props: InputHTMLAttributes<HTMLInputElement>
) {
  const { search, handleSearch, setSearch } = useSearch()
  return (
    <Input
      placeholder="Search"
      onChange={(e) => setSearch(e.target.value)}
      onKeyDown={handleSearch}
      value={search}
      {...props}
    />
  )
}
