import { useState } from "react"

function useSearch() {
  const [search, setSearch] = useState("")

  const handleGoogleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return

    const query = e.currentTarget.value
    const url = `https://www.google.com/search?q=${query}`
    window.open(url, "_self")
  }

  return { search, handleGoogleSearch, setSearch }
}

export default useSearch
