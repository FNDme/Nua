import axios from "axios"

const HN_API = "https://hacker-news.firebaseio.com/v0"

export interface HackerNewsStory {
  id: number
  title: string
  // Missing for text posts (Ask HN, etc.)
  url?: string
  score: number
  by: string
  descendants?: number
  time: number
}

export const getHackerNewsItemUrl = (id: number) =>
  `https://news.ycombinator.com/item?id=${id}`

export const getTopStories = async (limit = 5): Promise<HackerNewsStory[]> => {
  const { data: ids } = await axios.get<number[]>(`${HN_API}/topstories.json`)

  const stories = await Promise.all(
    ids
      .slice(0, limit)
      .map((id) =>
        axios
          .get<HackerNewsStory | null>(`${HN_API}/item/${id}.json`)
          .then((response) => response.data)
      )
  )

  // Deleted/dead items come back as null
  return stories.filter(Boolean)
}
