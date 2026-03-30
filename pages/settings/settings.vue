<template>
  <view class="container">
    <view class="card">
      <view class="setting-title">⚙️ 个人设置</view>
      
      <view class="setting-item">
        <text class="setting-label">末次经期开始日期</text>
        <picker mode="date" :value="appData.lastPeriodStart" :end="today" @change="onLastPeriodChange">
          <view class="setting-value">
            {{ appData.lastPeriodStart || '请选择' }}
          </view>
        </picker>
      </view>
      
      <view class="setting-item">
        <text class="setting-label">平均经期天数</text>
        <view class="setting-input-wrapper">
          <input type="number" class="setting-input" 
                 :value="appData.averagePeriodDays" 
                 @input="onPeriodDaysChange" />
          <text class="unit">天</text>
        </view>
      </view>
      
      <view class="setting-item">
        <text class="setting-label">平均周期天数</text>
        <view class="setting-input-wrapper">
          <input type="number" class="setting-input" 
                 :value="appData.averageCycleDays" 
                 @input="onCycleDaysChange" />
          <text class="unit">天</text>
        </view>
      </view>
      
      <button class="btn-primary save-btn" @click="saveSettings">保存设置</button>
    </view>
    
    <view class="card about-card">
      <view class="about-title">关于</view>
      <view class="about-info">
        <text>温柔经期记录</text>
        <text class="version">v1.0.0</text>
      </view>
      <view class="about-desc">
        所有数据仅保存在您的设备本地，我们不会收集或上传任何信息。
      </view>
    </view>
  </view>
</template>

<script>
import { loadData, saveData, formatDate } from '@/utils/storage.js'

export default {
  data() {
    return {
      appData: null,
      today: ''
    }
  },
  onLoad() {
    this.init()
  },
  onShow() {
    this.init()
  },
  methods: {
    async init() {
      this.today = formatDate(new Date())
      this.appData = await loadData()
    },
    
    onLastPeriodChange(e) {
      this.appData.lastPeriodStart = e.detail.value
    },
    
    onPeriodDaysChange(e) {
      this.appData.averagePeriodDays = parseInt(e.detail.value) || 5
    },
    
    onCycleDaysChange(e) {
      this.appData.averageCycleDays = parseInt(e.detail.value) || 28
    },
    
    async saveSettings() {
      await saveData(this.appData)
      uni.showToast({
        title: '保存成功',
        icon: 'success'
      })
    }
  }
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  padding: 16px;
}

.setting-title {
  font-size: 18px;
  font-weight: bold;
  color: #444;
  margin-bottom: 24px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #F0F0F0;
}

.setting-item:last-of-type {
  border-bottom: none;
  margin-bottom: 20px;
}

.setting-label {
  font-size: 15px;
  color: #555;
}

.setting-value {
  font-size: 15px;
  color: #D81B60;
  font-weight: 500;
}

.setting-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.setting-input {
  width: 80px;
  padding: 8px 12px;
  background: #F5F5F5;
  border-radius: 8px;
  font-size: 15px;
  text-align: center;
  color: #D81B60;
  font-weight: 500;
}

.unit {
  font-size: 14px;
  color: #888;
}

.save-btn {
  width: 100%;
  margin-top: 16px;
}

.about-card {
  margin-top: 16px;
}

.about-title {
  font-size: 16px;
  font-weight: bold;
  color: #555;
  margin-bottom: 16px;
}

.about-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 15px;
  color: #666;
}

.version {
  font-size: 13px;
  color: #999;
}

.about-desc {
  font-size: 13px;
  color: #888;
  line-height: 1.6;
}
</style>
