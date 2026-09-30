import BackgroundSelector from "@/components/widgets/background-selector/background-selector"
import News from "@/components/widgets/news/news"
import QuickLinks from "@/components/widgets/quick-links"
import SearchInput from "@/components/widgets/search-input"
import Time from "@/components/widgets/time"
import WorkTimer from "@/components/widgets/work-timer"

import Currency from "~/components/widgets/currency/currency"
import Pomodoro from "~/components/widgets/pomodoro"
import QuickNotes from "~/components/widgets/quick-notes"
import { useUserPreferences } from "~/context/user-preferences.context"

export default function Home() {
  const {
    preferences: { widgets: on }
  } = useUserPreferences()

  return (
    <div className="relative flex h-full flex-col items-center justify-between p-8">
      {/* Content */}
      <div className="relative flex w-full justify-between">
        <div className="absolute left-0 top-0">
          {on.background ? (
            <BackgroundSelector />
          ) : (
            // Photo turned off: a calm gradient instead (no API calls)
            <div className="fixed inset-0 z-[-1] bg-gradient-to-br from-zinc-800 via-zinc-900 to-black" />
          )}
        </div>
        <div className="z-10 flex flex-1 flex-col items-center justify-center gap-2.5">
          {on.workTimer && <WorkTimer />}
          {(on.currency || on.pomodoro) && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              {on.currency && <Currency />}
              {on.pomodoro && <Pomodoro />}
            </div>
          )}
        </div>
        <div className="absolute right-0 top-0">
          {on.quickLinks && <QuickLinks />}
        </div>
      </div>
      {/* Center area */}
      <div className="relative z-10 flex w-full justify-center"></div>
      {/* Bottom area */}
      <div className="relative z-10 flex w-full justify-between gap-8">
        <div className="bottom-0 left-0 hidden lg:absolute lg:block">
          {on.news && <News />}
        </div>
        <div className="flex flex-1 items-end justify-center">
          {on.search && (
            <SearchInput
              autoFocus
              className="w-full max-w-md rounded-full border-none bg-black/20 text-white outline-none backdrop-blur-sm transition-all duration-300 placeholder:text-gray-300 focus:scale-110 focus:shadow-lg focus:shadow-black/20 lg:max-w-[35vw]"
            />
          )}
        </div>
        <div className="bottom-0 right-0 hidden flex-col items-end gap-3 sm:flex lg:absolute">
          {on.notes && (
            <div className="hidden lg:block">
              <QuickNotes />
            </div>
          )}
          {on.clock && <Time />}
        </div>
      </div>
    </div>
  )
}
