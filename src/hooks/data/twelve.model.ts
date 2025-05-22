export type TwelveDataError = {
  status: "error"
}

export type TwelveDataResult = {
  [symbol: string]: StockInfo
}

export interface StockInfo {
  meta: StockMeta
  values: StockValue[]
  status?: string
}

export interface StockMeta {
  symbol: string
  interval: string
  currency: string
  exchange_timezone: string
  exchange: string
  mic_code: string
  type: string
}

export interface StockValue {
  datetime: string
  open: string
  high: string
  low: string
  close: string
  volume: string
}
