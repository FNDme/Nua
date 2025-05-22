import { useEffect, useMemo, useState, type CSSProperties } from "react"

import { Progress } from "../ui/progress"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"

function WorkTimer({
  workStart = "08:00",
  workEnd = "17:00"
}: {
  workStart?: string
  workEnd?: string
}) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const isWorkDay = useMemo(() => {
    const day = currentTime.getDay()
    return day !== 0 && day !== 6 // 0 is Sunday, 6 is Saturday
  }, [currentTime])

  const progress = useMemo(() => {
    if (!isWorkDay) return 0

    const [startHour, startMinute] = workStart.split(":").map(Number)
    const [endHour, endMinute] = workEnd.split(":").map(Number)

    const startTime = startHour * 60 + startMinute
    const endTime = endHour * 60 + endMinute
    const currentTimeInMinutes =
      currentTime.getHours() * 60 + currentTime.getMinutes()

    if (currentTimeInMinutes < startTime) return 0
    if (currentTimeInMinutes > endTime) return 100

    return ((currentTimeInMinutes - startTime) / (endTime - startTime)) * 100
  }, [currentTime, workStart, workEnd, isWorkDay])

  if (!isWorkDay) return null

  return (
    <div className="flex h-9 w-full items-center justify-center">
      <div className="flex w-fit max-w-md flex-col gap-2 sm:w-1/2">
        <Tooltip delayDuration={100}>
          <TooltipTrigger className="cursor-default justify-center">
            <Progress
              value={progress}
              className="hidden bg-black/20 sm:block"
              style={{ "--primary": "black" } as CSSProperties}
            />

            <div className="block sm:hidden">
              <div className="relative h-9 w-9 rounded-full bg-black/20">
                <svg className="h-full w-full -rotate-90">
                  <circle
                    className="stroke-black/20"
                    strokeWidth="4"
                    fill="none"
                    r="16"
                    cx="18"
                    cy="18"
                  />
                  <circle
                    className="stroke-black transition-all duration-1000"
                    strokeWidth="4"
                    strokeLinecap="round"
                    fill="none"
                    r="16"
                    cx="18"
                    cy="18"
                    strokeDasharray={`${2 * Math.PI * 16}`}
                    strokeDashoffset={`${2 * Math.PI * 16 * (1 - progress / 100)}`}
                  />
                </svg>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{Math.round(progress)}%</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}

export default WorkTimer
