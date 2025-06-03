import { createApi } from "unsplash-js"

const api = createApi({
  accessKey: process.env.PLASMO_PUBLIC_UNSPLASH_ACCESS_KEY
})

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === "UNSPLASH_API_REQUEST") {
    handleUnsplashRequest(request.payload)
      .then(sendResponse)
      .catch((error) => sendResponse({ error: error.message }))
    return true
  }
})

async function handleUnsplashRequest(payload: {
  method: string
  params: Record<string, any>
}) {
  try {
    const { method, params } = payload
    const result = await api.search[method](params)
    return { data: result }
  } catch (error) {
    console.error("Error in Unsplash API proxy:", error)
    throw error
  }
}
