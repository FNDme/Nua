import BackgroundSelector from "@/components/widgets/background-selector/background-selector"
import QuickLinks from "@/components/widgets/quick-links"
import SearchInput from "@/components/widgets/search-input"
import Time from "@/components/widgets/time"
import WorkTimer from "@/components/widgets/work-timer"

import Currency from "~/components/widgets/currency/currency"

export default function Home() {
  return (
    <div className="relative flex h-full flex-col items-center justify-between p-8">
      {/* Content */}
      <div className="relative z-10 flex w-full justify-between">
        <div className="absolute left-0 top-0">
          <BackgroundSelector />
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 sm:gap-0">
          <WorkTimer />
          <Currency />
        </div>
        <div className="absolute right-0 top-0">
          <QuickLinks />
        </div>
      </div>
      {/* Center area */}
      <div className="relative z-10 flex w-full justify-center"></div>
      {/* Bottom area */}
      <div className="relative z-10 flex w-full justify-between gap-8">
        <div></div>
        <div className="flex flex-1 items-end justify-center">
          <SearchInput
            autoFocus
            className="w-full max-w-md rounded-full border-none bg-black/20 text-white outline-none backdrop-blur-sm transition-all duration-300 placeholder:text-gray-300 focus:scale-110 focus:shadow-lg focus:shadow-black/20 lg:max-w-[35vw]"
          />
        </div>
        <div className="bottom-0 right-0 hidden sm:block lg:absolute">
          <Time />
        </div>
      </div>
    </div>
  )
}
