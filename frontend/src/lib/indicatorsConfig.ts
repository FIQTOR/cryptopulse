export interface IndicatorConfig {
  sma20: boolean;
  sma50: boolean;
  ema200: boolean;
  bollinger: boolean;
  volume: boolean;
  rsi: boolean;
  macd: boolean;
}

export const DEFAULT_INDICATORS: IndicatorConfig = {
  sma20: true,
  sma50: true,
  ema200: false,
  bollinger: false,
  volume: true,
  rsi: false,
  macd: false,
};
