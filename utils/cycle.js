import { parseDate, addDays, getDaysDiff, formatDate } from './storage.js'

export const PHASE = {
  PERIOD: 'period',
  FOLLICULAR: 'follicular',
  OVULATION: 'ovulation',
  LUTEAL: 'luteal',
  SAFE: 'safe'
}

export const PHASE_COLORS = {
  [PHASE.PERIOD]: '#FCE4EC',
  [PHASE.FOLLICULAR]: '#E0F2F1',
  [PHASE.OVULATION]: '#BBDEFB',
  [PHASE.LUTEAL]: '#FFF9C4',
  [PHASE.SAFE]: '#F5F5F5'
}

export const PHASE_NAMES = {
  [PHASE.PERIOD]: '经期',
  [PHASE.FOLLICULAR]: '卵泡期',
  [PHASE.OVULATION]: '排卵期',
  [PHASE.LUTEAL]: '黄体期',
  [PHASE.SAFE]: '安全期'
}

/**
 * 计算单个周期内的阶段
 * @param {Date} cycleStart - 本周期经期开始日期
 * @param {number} periodDays - 经期天数
 * @param {number} cycleDays - 周期天数
 * @param {object} records - 用户记录
 * @returns {object} { phases: {dateStr: phase}, periodEndDate }
 */
function calculateSingleCyclePhases(cycleStart, periodDays, cycleDays, records) {
  const phases = {}
  let periodEndDate = addDays(cycleStart, periodDays - 1)

  // 检查用户是否提前标记非经期来截断经期
  for (let i = 0; i < periodDays; i++) {
    const checkDate = addDays(cycleStart, i)
    const dateStr = formatDate(checkDate)
    if (records[dateStr] && !records[dateStr].isPeriod) {
      periodEndDate = addDays(checkDate, -1)
      break
    }
  }

  const ovulationStart = addDays(cycleStart, cycleDays - 18)
  const ovulationEnd = addDays(cycleStart, cycleDays - 11)
  const lutealStart = addDays(ovulationEnd, 1)
  const nextCycleStart = addDays(cycleStart, cycleDays)

  let currentDate = new Date(cycleStart)
  for (let i = 0; i < cycleDays; i++) {
    const dateStr = formatDate(currentDate)
    let phase = PHASE.SAFE

    if (currentDate <= periodEndDate) {
      phase = PHASE.PERIOD
    } else if (currentDate >= ovulationStart && currentDate <= ovulationEnd) {
      phase = PHASE.OVULATION
    } else if (currentDate >= lutealStart && currentDate < nextCycleStart) {
      phase = PHASE.LUTEAL
    } else if (currentDate > periodEndDate && currentDate < ovulationStart) {
      phase = PHASE.FOLLICULAR
    }

    phases[dateStr] = phase
    currentDate = addDays(currentDate, 1)
  }

  return { phases, periodEndDate }
}

/**
 * 计算完整的周期信息，支持多周期预测
 * @param {string} lastPeriodStart - 末次经期开始日期 (YYYY-MM-DD)
 * @param {number} averagePeriodDays - 平均经期天数
 * @param {number} averageCycleDays - 平均周期天数
 * @param {object} records - 用户每日记录
 * @param {number} futureCycles - 向未来预测几个周期，默认 6
 * @returns {object} cycleInfo
 */
export function calculateCycleInfo(lastPeriodStart, averagePeriodDays, averageCycleDays, records = {}, futureCycles = 6) {
  if (!lastPeriodStart) {
    return null
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const startDate = parseDate(lastPeriodStart)

  // 计算当前周期
  const currentCycleResult = calculateSingleCyclePhases(startDate, averagePeriodDays, averageCycleDays, records)

  const cycleInfo = {
    phases: currentCycleResult.phases,
    currentPhase: null,
    nextPeriodStart: addDays(startDate, averageCycleDays),
    periodEnded: false,
    actualPeriodDays: Math.max(1, getDaysDiff(startDate, currentCycleResult.periodEndDate) + 1)
  }

  cycleInfo.periodEnded = today > currentCycleResult.periodEndDate

  // 确定当前阶段
  const todayStr = formatDate(today)
  if (cycleInfo.phases[todayStr]) {
    cycleInfo.currentPhase = cycleInfo.phases[todayStr]
  }

  // 计算未来多个周期的阶段（用于日历翻页查看）
  for (let c = 1; c <= futureCycles; c++) {
    const futureCycleStart = addDays(startDate, averageCycleDays * c)
    const futureResult = calculateSingleCyclePhases(futureCycleStart, averagePeriodDays, averageCycleDays, {})
    // 未来周期没有用户记录，所以第三个参数传空对象
    Object.assign(cycleInfo.phases, futureResult.phases)
  }

  return cycleInfo
}

export function getTips(phase) {
  const tips = {
    [PHASE.PERIOD]: [
      '注意保暖，避免剧烈运动和冷水浴，多喝温水。',
      '痛经明显时，建议每6小时吃一次止痛药，不要硬扛。',
      '腰酸时可以平躺，用热毛巾敷一下腰腹部。',
      '身体乏力头晕，请尽量多卧床休息，避免劳累。',
      '饮食清淡，避免生冷油腻食物。'
    ],
    [PHASE.FOLLICULAR]: [
      '身体状态逐渐回升，新陈代谢加快，可以适当安排一些有挑战性的工作。',
      '多吃高蛋白食物补充营养，如鸡蛋、牛奶、鱼肉。',
      '适度运动，如瑜伽、慢跑，有助于提升气色。',
      '皮肤状态变好，可以尝试新的护肤品或化妆风格。',
      '心情愉悦，适合社交和约会。'
    ],
    [PHASE.OVULATION]: [
      '身体活力达到顶峰！但部分女生可能会有轻微排卵痛。',
      '分泌物增多，注意个人卫生，勤换内裤。',
      '保持饮食清淡，避免过度熬夜。',
      '排卵期是受孕高峰期，如有备孕计划请做好准备。',
      '性欲可能增强，这是正常的生理现象。'
    ],
    [PHASE.LUTEAL]: [
      '受激素影响，可能会感到些许疲惫、容易水肿或情绪波动。',
      '记得早睡早起，多照顾自己的感受。',
      '减少盐分摄入，防范水肿。',
      '可以吃一些富含镁的食物，如香蕉、坚果，有助于缓解情绪。',
      '经期快要来啦！注意腹部保暖，可以开始准备经期用品包了。'
    ],
    [PHASE.SAFE]: [
      '保持规律作息，早睡早起。',
      '均衡饮食，多吃蔬菜水果。',
      '适度运动，保持身体健康。',
      '保持心情愉悦，减少压力。',
      '注意个人卫生，勤换内衣。'
    ]
  }

  const phaseTips = tips[phase] || tips[PHASE.SAFE]
  const today = new Date()
  const index = (today.getDate() + today.getMonth()) % phaseTips.length
  return phaseTips[index]
}
