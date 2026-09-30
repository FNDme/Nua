import { useState } from "react"

function useSearch() {
  const [search, setSearch] = useState("")

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return

    const text = e.currentTarget.value.trim()
    if (!text) return

    // Uses the browser's default search engine
    chrome.search.query({ text, disposition: "CURRENT_TAB" })
  }

  return { search, handleSearch, setSearch }
}

export default useSearch
