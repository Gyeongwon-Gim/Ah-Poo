/**
 * fee 컬럼(문자/숫자)을 원화 표기로 보기 좋게 포맷합니다.
 * 예: 1000 → 1,000₩, "5000원" → 5,000₩, "성인 3000" → 성인 3,000₩
 * 숫자가 없으면(무료 등) 원문 그대로 반환합니다.
 */
export function formatPoolFee(fee) {
  if (fee == null) return ''
  const s = String(fee).trim()
  if (!s) return ''

  const withCommas = (n) => n.toLocaleString('ko-KR')
  const asWon = (digits) => {
    const n = parseInt(String(digits).replace(/[\s,]/g, ''), 10)
    return Number.isNaN(n) ? null : `${withCommas(n)}₩`
  }

  // 전체가 숫자(+공백/쉼표)만
  if (/^[\d,\s]+$/.test(s)) {
    const formatted = asWon(s)
    if (formatted) return formatted
  }

  // "5000원" / "5,000 원"
  const wonSuffix = /^([\d,\s]+)\s*원\s*$/i.exec(s)
  if (wonSuffix) {
    const formatted = asWon(wonSuffix[1])
    if (formatted) return formatted
  }

  // "KRW" / "₩" 만 붙은 경우
  const currencySuffix = /^([\d,\s]+)\s*(?:₩|krw)?\s*$/i.exec(s)
  if (currencySuffix && /^[\d,\s]+$/.test(currencySuffix[1].trim())) {
    const formatted = asWon(currencySuffix[1])
    if (formatted) return formatted
  }

  // "성인 5000" / "성인 5,000원"
  const withPrefix = /^(.+?)\s+([\d,\s]+)\s*(?:원|₩|krw)?\s*$/i.exec(s)
  if (withPrefix) {
    const prefix = withPrefix[1].trim()
    const formatted = asWon(withPrefix[2])
    if (formatted && prefix.length > 0) return `${prefix} ${formatted}`
  }

  // 숫자 없음 → 그대로
  if (!/\d/.test(s)) return s

  // 숫자 덩어리만 천단위 쉼표 적용, 끝에 ₩ (원/₩ 문구는 정리)
  const stripped = s
    .replace(/(\d[\d,]*)/g, (chunk) => {
      const n = parseInt(chunk.replace(/,/g, ''), 10)
      return Number.isNaN(n) ? chunk : withCommas(n)
    })
    .replace(/\s*원\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!/\d/.test(stripped)) return s

  // 이미 ₩로 끝나면 그대로
  if (stripped.endsWith('₩')) return stripped
  return `${stripped}₩`
}

/** 일일입장료 라벨 + 포맷된 가격 (예: 일일입장 5,000₩) */
export function formatDailyAdmissionFee(fee) {
  const price = formatPoolFee(fee)
  if (!price) return ''
  return `일일입장 ${price}`
}
