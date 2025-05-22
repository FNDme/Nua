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
    <div className="relative h-fit w-fit overflow-hidden rounded-2xl p-6">
      {/* Glass effect overlay */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" />

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

      {/* Decorative elements */}
      <div className="absolute left-0 top-0 h-32 w-32 -translate-x-16 -translate-y-16 rounded-full bg-black/10 blur-2xl" />
      <div className="absolute bottom-0 right-0 h-32 w-32 translate-x-16 translate-y-16 rounded-full bg-black/10 blur-2xl" />
    </div>
  )
}

export default Time
