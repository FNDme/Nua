import { useEffect, useState } from "react"

function Time() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const hours = time.getHours()
  const minutes = time.getMinutes()

  const formattedHours = hours.toString().padStart(2, "0")
  const formattedMinutes = minutes.toString().padStart(2, "0")
  const ampm = hours >= 12 ? "PM" : "AM"

  return (
    <div className="h-fit w-fit rounded-2xl bg-black/10 p-6 shadow-lg shadow-black/20 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl">
      {/* Content */}
      <div className="relative z-10">
        {/* Time display */}
        <div className="flex items-center justify-center space-x-2">
          <div className="text-4xl font-bold text-gray-200">
            {formattedHours}
          </div>
          <div className="animate-pulse text-4xl font-bold text-gray-200">
            :
          </div>
          <div className="text-4xl font-bold text-gray-200">
            {formattedMinutes}
          </div>
          <div className="ml-2 text-2xl font-medium text-gray-200/80">
            {ampm}
          </div>
        </div>

        {/* Date display */}
        <div className="mt-2 text-center font-medium text-gray-200/80">
          {time.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
          })}
        </div>
      </div>
    </div>
  )
}

export default Time
