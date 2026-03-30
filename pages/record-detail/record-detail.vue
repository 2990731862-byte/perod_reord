<template>
  <view class="container">
    <view class="card">
      <view class="record-title">📝 记录</view>
      
      <view class="form-item">
        <text class="label">记录日期</text>
        <picker mode="date" :value="recordDate" :end="today" @change="onDateChange">
          <view class="picker">
            {{ recordDate }}
          </view>
        </picker>
      </view>
      
      <view class="form-item">
        <text class="label">是否经期</text>
        <view class="option-group">
          <view class="option-item" :class="{ active: !record.isPeriod }" @click="setIsPeriod(false)">
            <text>非经期</text>
          </view>
          <view class="option-item" :class="{ active: record.isPeriod }" @click="setIsPeriod(true)">
            <text>经期</text>
          </view>
        </view>
      </view>
      
      <view class="form-item">
        <text class="label">心情</text>
        <view class="mood-grid">
          <view v-for="mood in moods" :key="mood.value" 
                class="mood-option" 
                :class="{ active: record.mood === mood.value }"
                @click="setMood(mood.value)">
            <text class="mood-emoji">{{ mood.emoji }}</text>
            <text class="mood-label">{{ mood.label }}</text>
          </view>
        </view>
      </view>
      
      <view class="form-item">
        <text class="label">症状（可多选）</text>
        <view class="symptoms-grid">
          <view v-for="symptom in symptoms" :key="symptom" 
                class="symptom-option"
                :class="{ active: record.symptoms.includes(symptom) }"
                @click="toggleSymptom(symptom)">
            <text>{{ symptom }}</text>
          </view>
        </view>
      </view>
      
      <view class="btn-group">
        <button class="cancel-btn" @click="goBack">取消</button>
        <button class="delete-btn" v-if="hasExistingRecord" @click="deleteRecord">删除</button>
        <button class="btn-primary" @click="saveRecord">保存记录</button>
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
      recordDate: '',
      today: '',
      hasExistingRecord: false,
      record: {
        isPeriod: false,
        mood: '',
        symptoms: []
      },
      moods: [
        { value: '开心', emoji: '😊' },
        { value: '烦躁', emoji: '😠' },
        { value: '疲惫', emoji: '😴' },
        { value: '焦虑', emoji: '😰' },
        { value: '低落', emoji: '😔' },
        { value: '平稳', emoji: '😐' }
      ],
      symptoms: ['痛经', '腰酸', '乳房胀痛', '长痘', '失眠', '乏力', '头痛']
    }
  },
  onLoad(options) {
    this.init(options.date)
  },
  methods: {
    async init(date) {
      this.today = formatDate(new Date())
      this.recordDate = date || this.today
      this.appData = await loadData()
      
      if (this.appData.records[this.recordDate]) {
        this.record = { ...this.appData.records[this.recordDate] }
        this.hasExistingRecord = true
      } else {
        this.hasExistingRecord = false
      }
    },
    
    onDateChange(e) {
      this.recordDate = e.detail.value
      if (this.appData.records[this.recordDate]) {
        this.record = { ...this.appData.records[this.recordDate] }
        this.hasExistingRecord = true
      } else {
        this.record = {
          isPeriod: false,
          mood: '',
          symptoms: []
        }
        this.hasExistingRecord = false
      }
    },
    
    setIsPeriod(value) {
      this.record.isPeriod = value
    },
    
    setMood(mood) {
      this.record.mood = mood
    },
    
    toggleSymptom(symptom) {
      const index = this.record.symptoms.indexOf(symptom)
      if (index > -1) {
        this.record.symptoms.splice(index, 1)
      } else {
        this.record.symptoms.push(symptom)
      }
    },
    
    async saveRecord() {
      this.appData.records[this.recordDate] = { ...this.record }
      await saveData(this.appData)
      uni.showToast({
        title: '保存成功',
        icon: 'success'
      })
      setTimeout(() => {
        uni.navigateBack()
      }, 1000)
    },
    
    async deleteRecord() {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这条记录吗？',
        confirmColor: '#D81B60',
        success: async (res) => {
          if (res.confirm) {
            delete this.appData.records[this.recordDate]
            await saveData(this.appData)
            uni.showToast({
              title: '已删除',
              icon: 'success'
            })
            setTimeout(() => {
              uni.navigateBack()
            }, 1000)
          }
        }
      })
    },
    
    goBack() {
      uni.navigateBack()
    }
  }
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  padding: 16px;
}

.record-title {
  font-size: 20px;
  font-weight: bold;
  color: #444;
  margin-bottom: 24px;
  text-align: center;
}

.form-item {
  margin-bottom: 24px;
}

.label {
  display: block;
  font-size: 15px;
  font-weight: bold;
  color: #555;
  margin-bottom: 12px;
}

.picker {
  width: 100%;
  padding: 14px 16px;
  background: #F5F5F5;
  border-radius: 12px;
  font-size: 15px;
  color: #333;
  text-align: center;
  box-sizing: border-box;
}

.option-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.option-item {
  padding: 14px;
  background: #F5F5F5;
  border-radius: 12px;
  text-align: center;
  font-size: 15px;
  color: #666;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.option-item.active {
  background: #FCE4EC;
  color: #D81B60;
  font-weight: bold;
  border-color: #F48FB1;
}

.mood-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.mood-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  background: #F5F5F5;
  border-radius: 12px;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.mood-option.active {
  background: #FCE4EC;
  border-color: #F48FB1;
}

.mood-emoji {
  font-size: 28px;
  margin-bottom: 6px;
}

.mood-label {
  font-size: 12px;
  color: #666;
}

.mood-option.active .mood-label {
  color: #D81B60;
  font-weight: bold;
}

.symptoms-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.symptom-option {
  padding: 10px 18px;
  background: #F5F5F5;
  border-radius: 50px;
  font-size: 14px;
  color: #666;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.symptom-option.active {
  background: #FCE4EC;
  color: #D81B60;
  font-weight: bold;
  border-color: #F48FB1;
}

.btn-group {
  display: flex;
  gap: 12px;
  margin-top: 32px;
}

.cancel-btn {
  flex: 1;
  padding: 14px;
  background: #F5F5F5;
  border-radius: 50px;
  font-size: 15px;
  color: #666;
  font-weight: 500;
}

.delete-btn {
  padding: 14px 20px;
  background: #FFF3E0;
  border-radius: 50px;
  font-size: 15px;
  color: #E65100;
  font-weight: 500;
}
</style>
