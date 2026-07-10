export function calculateWeekNumber(date: Date, firstWeekStartDate: string): number {
  const firstWeekStart = new Date(firstWeekStartDate)
  firstWeekStart.setHours(0, 0, 0, 0)
  
  const currentDate = new Date(date)
  currentDate.setHours(0, 0, 0, 0)
  
  const diff = currentDate.getTime() - firstWeekStart.getTime()
  const oneWeek = 1000 * 60 * 60 * 24 * 7
  
  if (diff < 0) {
    return 0
  }
  
  return Math.floor(diff / oneWeek) + 1
}