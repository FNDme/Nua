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

/** Ranked ids of the current top stories (up to 500) */
export const getTopStoryIds = async (): Promise<number[]> => {
  const { data } = await axios.get<number[]>(`${HN_API}/topstories.json`)
  return data
}

export const getStories = async (ids: number[]): Promise<HackerNewsStory[]> => {
  const stories = await Promise.all(
    ids.map((id) =>
      axios
        .get<HackerNewsStory | null>(`${HN_API}/item/${id}.json`)
        .then((response) => response.data)
    )
  )

  // Deleted/dead items come back as null
  return stories.filter(Boolean)
}
