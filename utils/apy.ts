const YEAR_IN_SECONDS = 31536000

export const calculateApy = (p: number, d: number) => {
  if (p === 0 || p === 1 || d === 0) {
    return 0
  }
  const apy = (p ** (YEAR_IN_SECONDS / d) - 1) * 100
  if (d <= 604800 && apy < 0) {
    // If the duration is less than or equal to a week and the APY is negative,
    // we set it to 0 to avoid misleading values
    return 0
  }
  return apy
}
