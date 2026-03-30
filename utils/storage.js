const STORAGE_KEY = 'menstrual_tracker_data_v1'

const defaultData = {
  firstUse: true,
  lastPeriodStart: null,
  averagePeriodDays: 5,
  averageCycleDays: 28,
  records: {},
  cycleHistory: []
}

export function loadData() {
  return new Promise((resolve) => {
    uni.getStorage({
      key: STORAGE_KEY,
      success: (res) => {
        const data = res.data
        resolve({
          ...defaultData,
          ...data
        })
      },
      fail: () => {
        resolve(defaultData)
      }
    })
  })
}

export function saveData(data) {
  return new Promise((resolve, reject) => {
    uni.setStorage({
      key: STORAGE_KEY,
      data: data,
      success: resolve,
      fail: reject
    })
  })
}

export function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function addDays(date, days) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function getDaysDiff(date1, date2) {
  const oneDay = 24 * 60 * 60 * 1000
  const firstDate = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate())
  const secondDate = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate())
  return Math.round((secondDate - firstDate) / oneDay)
}
