export default {
  async scheduled(event, env, ctx) {
    const url = env.APP_URL + '/api/cron/update-scores'
    const res = await fetch(url, {
      headers: { 'Authorization': 'Bearer ' + env.CRON_SECRET }
    })
    const body = await res.json()
    console.log('Cron update:', JSON.stringify(body))
  }
}
