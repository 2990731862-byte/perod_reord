<template>
  <view class="container">
    <view v-if="appData.firstUse" class="onboarding">
      <view class="card">
        <view class="onboarding-title">🌸 欢迎来到温柔经期记录</view>
        <view class="onboarding-desc">
          这里是你专属的秘密花园，所有数据仅保存在你的设备本地，绝对安全。
        </view>
        
        <view class="form-item">
          <text class="label">末次经期开始日期</text>
          <picker mode="date" :value="tempData.lastPeriodStart" :end="today" @change="onDateChange">
            <view class="picker">
              {{ tempData.lastPeriodStart || '请选择日期' }}
            </view>
          </picker>
        </view>
        
        <view class="form-item">
          <text class="label">平均经期天数</text>
          <input type="number" class="input" v-model="tempData.averagePeriodDays" placeholder="5" />
        </view>
        
        <view class="form-item">
          <text class="label">平均周期天数</text>
          <input type="number" class="input" v-model="tempData.averageCycleDays" placeholder="28" />
        </view>
        
        <button class="btn-primary" @click="saveOnboarding">开始使用</button>
      </view>
    </view>
    
    <view v-else class="main-content">
      <view class="card phase-card">
        <view class="phase-info">
          <text class="phase-label">当前阶段</text>
          <text class="phase-name">{{ cycleInfo ? PHASE_NAMES[cycleInfo.currentPhase] : '暂无数据' }}</text>
          <view class="prediction" v-if="cycleInfo">
            <text>预计下次：{{ formatDateDisplay(cycleInfo.nextPeriodStart) }}</text>
          </view>
          <view class="countdown" v-if="cycleInfo && countdownDays > 0">
            <text>还有 {{ countdownDays }} 天</text>
          </view>
          <view class="countdown countdown-today" v-else-if="cycleInfo && countdownDays === 0">
            <text>今天可能来月经</text>
          </view>
        </view>
      </view>
      
      <view class="card tips-card">
        <view class="tips-title">💖 贴心嘱咐</view>
        <text class="tips-text">{{ dailyTip }}</text>
        <view v-if="showShortPeriodWarning" class="warning-text">
          本次经期时长过短，可能需要对身体多加关心。
        </view>
      </view>
      
      <view class="card calendar-card">
        <view class="calendar-header">
          <view class="calendar-nav" @click="changeMonth(-1)">
            <text class="nav-arrow">‹</text>
          </view>
          <text class="calendar-month">{{ currentYear }}年 {{ currentMonth + 1 }}月</text>
          <view class="calendar-nav" @click="changeMonth(1)">
            <text class="nav-arrow">›</text>
          </view>
        </view>
        
        <view class="weekdays">
          <view v-for="day in weekDays" :key="day" class="weekday">{{ day }}</view>
        </view>
        
        <view class="calendar-grid">
          <view v-for="(day, index) in calendarDays" :key="index" 
                class="calendar-day" 
                :class="day.className"
                @click="onDayClick(day)">
            {{ day.date ? day.date : '' }}
          </view>
        </view>
        
        <view class="calendar-legend">
          <view class="legend-item">
            <view class="legend-color" style="background: #FCE4EC;"></view>
            <text>经期</text>
          </view>
          <view class="legend-item">
            <view class="legend-color" style="background: #E0F2F1;"></view>
            <text>卵泡期</text>
          </view>
          <view class="legend-item">
            <view class="legend-color" style="background: #BBDEFB;"></view>
            <text>排卵期</text>
          </view>
          <view class="legend-item">
            <view class="legend-color" style="background: #FFF9C4;"></view>
            <text>黄体期</text>
          </view>
          <view class="legend-item">
            <view class="legend-color" style="background: #F5F5F5;"></view>
            <text>安全期</text>
          </view>
        </view>
      </view>
      
      <view class="add-record-btn" @click="goToRecord">
        <text class="add-icon">+</text>
        <text>记一笔</text>
      </view>
    </view>
  </view>
</template>

<script>
import { loadData, saveData, formatDate, parseDate, addDays, getDaysDiff } from '@/utils/storage.js'
import { calculateCycleInfo, getTips, PHASE, PHASE_NAMES, PHASE_COLORS } from '@/utils/cycle.js'

export default {
  data() {
    return {
      appData: null,
      tempData: {
        lastPeriodStart: '',
        averagePeriodDays: 5,
        averageCycleDays: 28
      },
      today: '',
      currentYear: 2024,
      currentMonth: 0,
      calendarDays: [],
      weekDays: ['日', '一', '二', '三', '四', '五', '六'],
      cycleInfo: null,
      dailyTip: '',
      showShortPeriodWarning: false,
      countdownDays: 0,
      PHASE,
      PHASE_NAMES
    }
  },
  onLoad() {
    this.init()
  },
  onShow() {
    this.refreshData().then(() => {
      if (!this.appData.firstUse) {
        this.renderCalendar()
      }
    })
  },
  methods: {
    async init() {
      const now = new Date()
      this.today = formatDate(now)
      this.currentYear = now.getFullYear()
      this.currentMonth = now.getMonth()
      
      this.tempData.lastPeriodStart = this.today
      
      await this.refreshData()
      this.renderCalendar()
    },
    
    async refreshData() {
      this.appData = await loadData()
      
      if (!this.appData.firstUse) {
        this.cycleInfo = calculateCycleInfo(
          this.appData.lastPeriodStart,
          this.appData.averagePeriodDays,
          this.appData.averageCycleDays,
          this.appData.records
        )
        
        if (this.cycleInfo && this.cycleInfo.currentPhase) {
          this.dailyTip = getTips(this.cycleInfo.currentPhase)
        }
        
        this.showShortPeriodWarning = this.cycleInfo && this.cycleInfo.actualPeriodDays <= 3
        
        if (this.cycleInfo && this.cycleInfo.nextPeriodStart) {
          const nextDate = parseDate(formatDate(this.cycleInfo.nextPeriodStart))
          const todayDate = new Date()
          todayDate.setHours(0, 0, 0, 0)
          this.countdownDays = Math.max(0, getDaysDiff(todayDate, nextDate))
        }
      }
    },
    
    async saveOnboarding() {
      if (!this.tempData.lastPeriodStart) {
        uni.showToast({ title: '请选择末次经期开始日期', icon: 'none' })
        return
      }
      
      if (!this.appData) {
        this.appData = await loadData()
      }
      
      this.appData.firstUse = false
      this.appData.lastPeriodStart = this.tempData.lastPeriodStart
      this.appData.averagePeriodDays = parseInt(this.tempData.averagePeriodDays) || 5
      this.appData.averageCycleDays = parseInt(this.tempData.averageCycleDays) || 28
      
      await saveData(this.appData)
      await this.refreshData()
      this.renderCalendar()
    },
    
    onDateChange(e) {
      this.tempData.lastPeriodStart = e.detail.value
    },
    
    changeMonth(delta) {
      this.currentMonth += delta
      if (this.currentMonth < 0) {
        this.currentMonth = 11
        this.currentYear--
      } else if (this.currentMonth > 11) {
        this.currentMonth = 0
        this.currentYear++
      }
      this.renderCalendar()
    },
    
    renderCalendar() {
      const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay()
      const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate()
      
      this.calendarDays = []
      
      for (let i = 0; i < firstDay; i++) {
        this.calendarDays.push({
          className: 'empty'
        })
      }
      
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(this.currentYear, this.currentMonth, day)
        const dateStr = formatDate(date)
        const dayObj = {
          date: day,
          dateStr: dateStr,
          isToday: dateStr === this.today
        }
        
        const classes = []
        if (this.cycleInfo && this.cycleInfo.phases[dateStr]) {
          const phase = this.cycleInfo.phases[dateStr]
          classes.push(`phase-${phase}`)
        }
        if (dayObj.isToday) {
          classes.push('today')
        }
        if (this.appData && this.appData.records[dateStr]) {
          classes.push('has-record')
        }
        dayObj.className = classes.join(' ')
        
        this.calendarDays.push(dayObj)
      }
    },
    
    getDayClass(day) {
      if (!day) return 'empty'
      
      const classes = []
      
      if (this.cycleInfo && this.cycleInfo.phases[day.dateStr]) {
        const phase = this.cycleInfo.phases[day.dateStr]
        classes.push(`phase-${phase}`)
      }
      
      if (day.isToday) {
        classes.push('today')
      }
      
      if (this.appData.records[day.dateStr]) {
        classes.push('has-record')
      }
      
      return classes.join(' ')
    },
    
    onDayClick(day) {
      if (day && day.dateStr) {
        uni.navigateTo({
          url: `/pages/record-detail/record-detail?date=${day.dateStr}`
        })
      }
    },
    
    goToRecord() {
      uni.navigateTo({
        url: `/pages/record-detail/record-detail?date=${this.today}`
      })
    },
    
    formatDateDisplay(dateStr) {
      if (!dateStr) return ''
      const date = parseDate(dateStr)
      return `${date.getMonth() + 1}月${date.getDate()}日`
    }
  }
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  padding: 16px;
  padding-bottom: 80px;
}

.onboarding {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
}

.onboarding-title {
  font-size: 22px;
  font-weight: bold;
  color: #D81B60;
  text-align: center;
  margin-bottom: 16px;
}

.onboarding-desc {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 24px;
}

.form-item {
  margin-bottom: 20px;
}

.label {
  display: block;
  font-size: 14px;
  font-weight: bold;
  color: #444;
  margin-bottom: 8px;
}

.picker, .input {
  width: 100%;
  padding: 12px;
  background: #F5F5F5;
  border-radius: 12px;
  font-size: 14px;
  box-sizing: border-box;
}

.picker {
  color: #333;
}

.phase-card {
  background: linear-gradient(135deg, #FCE4EC 0%, #F3E5F5 100%);
  border: none;
}

.phase-info {
  text-align: center;
}

.phase-label {
  display: block;
  font-size: 14px;
  color: #888;
  margin-bottom: 8px;
}

.phase-name {
  display: block;
  font-size: 28px;
  font-weight: bold;
  color: #D81B60;
  margin-bottom: 12px;
}

.prediction {
  display: inline-block;
  background: rgba(255, 255, 255, 0.6);
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  color: #666;
}

.tips-title {
  font-size: 16px;
  font-weight: bold;
  color: #CE93D8;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}

.tips-text {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.warning-text {
  margin-top: 12px;
  padding: 12px;
  background: #FFF3E0;
  border-radius: 8px;
  font-size: 13px;
  color: #E65100;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.calendar-nav {
  padding: 8px 16px;
  font-size: 24px;
  color: #999;
}

.nav-arrow {
  font-weight: 300;
}

.calendar-month {
  font-size: 16px;
  font-weight: bold;
  color: #555;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 8px;
}

.weekday {
  text-align: center;
  font-size: 12px;
  color: #999;
  padding: 8px 0;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 14px;
  color: #666;
  position: relative;
}

.calendar-day.empty {
  pointer-events: none;
}

.calendar-day.today {
  border: 2px solid #D81B60;
  background: #FFF0F5;
  font-weight: bold;
  color: #D81B60;
}

.calendar-day.has-record::after {
  content: '';
  position: absolute;
  bottom: 2px;
  width: 4px;
  height: 4px;
  background: #D81B60;
  border-radius: 50%;
}

.calendar-day.phase-period {
  background: #FCE4EC;
  color: #D81B60;
  font-weight: bold;
}

.calendar-day.phase-ovulation {
  background: #BBDEFB;
  color: #1976D2;
}

.calendar-day.phase-luteal {
  background: #FFF9C4;
  color: #F57F17;
}

.calendar-day.phase-follicular {
  background: #E0F2F1;
  color: #00796B;
}

.calendar-day.phase-safe {
  background: #F5F5F5;
  color: #999;
}

.countdown {
  display: inline-block;
  background: rgba(255, 255, 255, 0.6);
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 13px;
  color: #888;
  margin-top: 8px;
}

.countdown-today {
  color: #D81B60;
  font-weight: bold;
  background: rgba(255, 255, 255, 0.8);
}

.calendar-legend {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #F0F0F0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #888;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.add-record-btn {
  position: fixed;
  bottom: 100px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #F48FB1 0%, #CE93D8 100%);
  color: white;
  padding: 12px 20px;
  border-radius: 50px;
  box-shadow: 0 4px 12px rgba(244, 143, 177, 0.4);
  font-size: 14px;
  font-weight: bold;
}

.add-icon {
  font-size: 20px;
  line-height: 1;
}
</style>
