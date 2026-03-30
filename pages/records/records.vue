<template>
  <view class="container">
    <view class="stats-card card" v-if="cycleHistory.length > 0">
      <view class="stats-title">📊 最近周期统计</view>
      <view class="stats-list">
        <view v-for="(cycle, index) in cycleHistory" :key="index" class="stats-item">
          <view class="stats-label">第 {{ cycleHistory.length - index }} 个周期</view>
          <view class="stats-data">
            <text>周期 {{ cycle.cycleDays }} 天</text>
            <text>经期 {{ cycle.periodDays }} 天</text>
            <text :class="cycle.isRegular ? 'regular' : 'irregular'">
              {{ cycle.isRegular ? '规律' : '不规律' }}
            </text>
          </view>
        </view>
      </view>
    </view>
    
    <view class="records-list">
      <view v-if="sortedRecords.length === 0" class="empty-state">
        <text class="empty-text">暂无记录，快去记一笔吧~</text>
      </view>
      <view v-else>
        <view v-for="(record, date) in sortedRecords" :key="date" 
              class="record-item card"
              @click="goToDetail(date)">
          <view class="record-header">
            <text class="record-date">{{ formatDateDisplay(date) }}</text>
            <view v-if="record.isPeriod" class="period-tag">🩸 经期</view>
          </view>
          <view class="record-content">
            <view v-if="record.mood" class="mood-item">
              <text class="mood-emoji">{{ getMoodEmoji(record.mood) }}</text>
              <text>{{ record.mood }}</text>
            </view>
            <view v-if="record.symptoms && record.symptoms.length > 0" class="symptoms-list">
              <text v-for="symptom in record.symptoms" :key="symptom" class="symptom-tag">
                {{ symptom }}
              </text>
            </view>
            <view v-if="!record.mood && (!record.symptoms || record.symptoms.length === 0)" class="no-symptoms">
              平稳的一天
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { loadData, formatDate, parseDate, addDays, getDaysDiff } from '@/utils/storage.js'
import { calculateCycleInfo } from '@/utils/cycle.js'

export default {
  data() {
    return {
      appData: null,
      cycleInfo: null,
      sortedRecords: {},
      cycleHistory: []
    }
  },
  onLoad() {
    this.refreshData()
  },
  onShow() {
    this.refreshData()
  },
  methods: {
    async refreshData() {
      this.appData = await loadData()
      
      this.sortedRecords = {}
      const dates = Object.keys(this.appData.records).sort((a, b) => 
        new Date(b) - new Date(a)
      )
      dates.forEach(date => {
        this.sortedRecords[date] = this.appData.records[date]
      })
      
      this.calculateCycleHistory()
    },
    
    calculateCycleHistory() {
      this.cycleHistory = []
      
      if (!this.appData.lastPeriodStart) return
      
      // 找出所有标记为经期开始的记录（连续经期记录中的第一条）
      const recordDates = Object.keys(this.appData.records)
        .sort()
        .filter(d => this.appData.records[d] && this.appData.records[d].isPeriod)
      
      if (recordDates.length === 0) {
        // 没有经期记录，基于设置显示一条
        this.cycleHistory.push({
          cycleDays: this.appData.averageCycleDays,
          periodDays: this.appData.averagePeriodDays,
          isRegular: Math.abs(this.appData.averageCycleDays - 28) <= 3
        })
        return
      }
      
      // 找出每个周期的开始日期（连续经期日期中断点即为新周期开始）
      const periodStarts = [recordDates[0]]
      for (let i = 1; i < recordDates.length; i++) {
        const prev = parseDate(recordDates[i - 1])
        const curr = parseDate(recordDates[i])
        const diff = getDaysDiff(prev, curr)
        if (diff > 3) {
          periodStarts.push(recordDates[i])
        }
      }
      
      // 为每个周期计算信息
      for (let i = 0; i < Math.min(periodStarts.length, 5); i++) {
        const startDate = parseDate(periodStarts[i])
        // 找这个周期的经期结束
        let periodDays = 0
        for (let j = 0; j < 30; j++) {
          const checkDate = formatDate(addDays(startDate, j))
          if (this.appData.records[checkDate] && this.appData.records[checkDate].isPeriod) {
            periodDays = j + 1
          } else {
            break
          }
        }
        periodDays = Math.max(1, periodDays)
        
        // 计算到下一个周期的天数
        let cycleDays = this.appData.averageCycleDays
        if (i < periodStarts.length - 1) {
          const nextStart = parseDate(periodStarts[i + 1])
          cycleDays = getDaysDiff(startDate, nextStart)
        } else if (i === periodStarts.length - 1 && periodStarts.length > 1) {
          // 最新周期用上一个和上上个的间隔
          const prevStart = parseDate(periodStarts[i - 1])
          cycleDays = getDaysDiff(prevStart, startDate)
        }
        
        this.cycleHistory.push({
          cycleDays: cycleDays,
          periodDays: periodDays,
          isRegular: Math.abs(cycleDays - 28) <= 3
        })
      }
    },
    
    getMoodEmoji(mood) {
      const emojis = {
        '开心': '😊',
        '烦躁': '😠',
        '疲惫': '😴',
        '焦虑': '😰',
        '低落': '😔',
        '平稳': '😐'
      }
      return emojis[mood] || '😊'
    },
    
    formatDateDisplay(dateStr) {
      const date = parseDate(dateStr)
      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      return `${date.getMonth() + 1}月${date.getDate()}日 ${weekDays[date.getDay()]}`
    },
    
    goToDetail(date) {
      uni.navigateTo({
        url: `/pages/record-detail/record-detail?date=${date}`
      })
    }
  }
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  padding: 16px;
  padding-bottom: 20px;
}

.stats-title {
  font-size: 16px;
  font-weight: bold;
  color: #555;
  margin-bottom: 16px;
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stats-item {
  padding: 12px;
  background: #F9F9F9;
  border-radius: 12px;
}

.stats-label {
  font-size: 13px;
  color: #888;
  margin-bottom: 8px;
}

.stats-data {
  display: flex;
  gap: 12px;
  font-size: 14px;
  color: #555;
}

.stats-data .regular {
  color: #4CAF50;
}

.stats-data .irregular {
  color: #FF5722;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.empty-text {
  font-size: 14px;
  color: #999;
}

.record-item {
  margin-bottom: 12px;
}

.record-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.record-date {
  font-size: 15px;
  font-weight: bold;
  color: #444;
}

.period-tag {
  padding: 4px 10px;
  background: #FCE4EC;
  color: #D81B60;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.record-content {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.mood-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #666;
}

.mood-emoji {
  font-size: 18px;
}

.symptoms-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.symptom-tag {
  padding: 4px 10px;
  background: #F5F5F5;
  color: #666;
  border-radius: 12px;
  font-size: 12px;
}

.no-symptoms {
  font-size: 13px;
  color: #999;
}
</style>
