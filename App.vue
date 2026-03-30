<script>
export default {
  onLaunch() {
    console.log('App Launch')
  },
  onShow() {
    console.log('App Show')
  },
  onHide() {
    console.log('App Hide')
  }
}
</script>

<style>
:root {
  --primary: #F48FB1;
  --primary-light: #FCE4EC;
  --primary-dark: #D81B60;
  --secondary: #CE93D8;
  --bg: #FAFAFA;
  --text: #424242;
}

page {
  background-color: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.03);
  padding: 20px;
  margin-bottom: 20px;
}

.btn-primary {
  background-color: var(--primary);
  color: white;
  border-radius: 9999px;
  padding: 10px 24px;
  transition: all 0.2s;
  box-shadow: 0 4px 10px rgba(244, 143, 177, 0.3);
}

.text-primary {
  color: var(--primary-dark);
}

.bg-primary-light {
  background-color: var(--primary-light);
}
</style>
