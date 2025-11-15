'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, BarChart, Bar } from 'recharts'
import { TrendingUp, TrendingDown, RefreshCw, Calendar, BarChart3, Eye, Download, ChevronDown, DollarSign, Activity, Bell, Zap, Target, AlertCircle, Globe } from 'lucide-react'

interface BitcoinData {
  current_price: number
  price_change_24h: number
  price_change_percentage_24h: number
  market_cap: number
  total_volume: number
  last_updated: string
}

interface ChartDataPoint {
  time: string
  price: number
  timestamp: number
}

interface PriceHistory {
  timestamp: number
  price: number
}

interface PriceAlert {
  id: string
  type: 'above' | 'below'
  price: number
  active: boolean
}

type Language = 'en' | 'id'

const translations = {
  en: {
    title: 'Bitcoin Tracker Pro',
    subtitle: 'Real-time tracking with advanced analytics',
    alerts: 'Alerts',
    currentPrice: 'Current Price',
    updated: 'Updated',
    downloadCSV: 'Download CSV',
    downloadJSON: 'Download JSON',
    refreshData: 'Refresh data',
    activeAlerts: 'Active Price Alerts',
    advancedAnalytics: 'Advanced Analytics',
    highPrice: 'High Price',
    lowPrice: 'Low Price',
    averagePrice: 'Average Price',
    volatility: 'Volatility',
    priceChange: 'Price Change',
    momentum: 'Momentum',
    volume24h: '24h Volume',
    marketCap: 'Market Cap',
    marketTrend: 'Market Trend Analysis',
    bullishTrend: 'Bullish Trend',
    bearishTrend: 'Bearish Trend',
    neutralTrend: 'Neutral Trend',
    bullishDesc: 'Price is moving upward. Consider this as a positive signal.',
    bearishDesc: 'Price is moving downward. Exercise caution in trading.',
    neutralDesc: 'Price is relatively stable with minimal movement.',
    keyInsights: 'Key Insights',
    range: 'Range',
    volatilityPercent: 'Volatility',
    currentVsAvg: 'Current vs Avg',
    autoRefresh: 'Auto-refreshing every 60 seconds • Data powered by CoinGecko API',
    setPriceAlert: 'Set Price Alert',
    alertType: 'Alert Type',
    above: 'Above',
    below: 'Below',
    targetPrice: 'Target Price (USD)',
    enterPrice: 'Enter price...',
    alertNotification: "You'll receive a notification when Bitcoin reaches your target price.",
    createAlert: 'Create Alert',
    loading: 'Loading Bitcoin data...',
    show: 'Show',
    hide: 'Hide',
    ofAvgPrice: 'of avg price'
  },
  id: {
    title: 'Bitcoin Tracker Pro',
    subtitle: 'Pelacakan real-time dengan analitik lanjutan',
    alerts: 'Peringatan',
    currentPrice: 'Harga Saat Ini',
    updated: 'Diperbarui',
    downloadCSV: 'Unduh CSV',
    downloadJSON: 'Unduh JSON',
    refreshData: 'Perbarui data',
    activeAlerts: 'Peringatan Harga Aktif',
    advancedAnalytics: 'Analitik Lanjutan',
    highPrice: 'Harga Tertinggi',
    lowPrice: 'Harga Terendah',
    averagePrice: 'Harga Rata-rata',
    volatility: 'Volatilitas',
    priceChange: 'Perubahan Harga',
    momentum: 'Momentum',
    volume24h: 'Volume 24j',
    marketCap: 'Kapitalisasi Pasar',
    marketTrend: 'Analisis Tren Pasar',
    bullishTrend: 'Tren Naik',
    bearishTrend: 'Tren Turun',
    neutralTrend: 'Tren Netral',
    bullishDesc: 'Harga sedang bergerak naik. Pertimbangkan ini sebagai sinyal positif.',
    bearishDesc: 'Harga sedang bergerak turun. Berhati-hatilah dalam trading.',
    neutralDesc: 'Harga relatif stabil dengan pergerakan minimal.',
    keyInsights: 'Wawasan Utama',
    range: 'Rentang',
    volatilityPercent: 'Volatilitas',
    currentVsAvg: 'Saat Ini vs Rata-rata',
    autoRefresh: 'Otomatis diperbarui setiap 60 detik • Data dari CoinGecko API',
    setPriceAlert: 'Atur Peringatan Harga',
    alertType: 'Jenis Peringatan',
    above: 'Di Atas',
    below: 'Di Bawah',
    targetPrice: 'Harga Target (USD)',
    enterPrice: 'Masukkan harga...',
    alertNotification: 'Anda akan menerima notifikasi ketika Bitcoin mencapai harga target.',
    createAlert: 'Buat Peringatan',
    loading: 'Memuat data Bitcoin...',
    show: 'Tampilkan',
    hide: 'Sembunyikan',
    ofAvgPrice: 'dari harga rata-rata'
  }
}

export default function BitcoinTracker() {
  const [bitcoinData, setBitcoinData] = useState<BitcoinData | null>(null)
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [fullHistory, setFullHistory] = useState<PriceHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | '1y'>('24h')
  const [downloadOpen, setDownloadOpen] = useState(false)
  const [showAlertModal, setShowAlertModal] = useState(false)
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([])
  const [newAlertPrice, setNewAlertPrice] = useState('')
  const [newAlertType, setNewAlertType] = useState<'above' | 'below'>('above')
  const [chartType, setChartType] = useState<'area' | 'line' | 'bar'>('area')
  const [showStats, setShowStats] = useState(true)
  const [language, setLanguage] = useState<Language>('en')
  const [analysis, setAnalysis] = useState({
    highPrice: 0,
    lowPrice: 0,
    avgPrice: 0,
    volatility: 0,
    trend: 'neutral' as 'up' | 'down' | 'neutral',
    priceChangePercent: 0,
    momentum: 0
  })
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [logoClickCount, setLogoClickCount] = useState(0)
  const [devMode, setDevMode] = useState(false)
  const [showWebhookModal, setShowWebhookModal] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookType, setWebhookType] = useState<'discord' | 'slack' | 'custom'>('discord')
  const [webhookName, setWebhookName] = useState('')
  const [savedWebhooks, setSavedWebhooks] = useState<Array<{id: string, name: string, url: string, type: string}>>([])
  const [isSendingWebhook, setIsSendingWebhook] = useState(false)

  const t = translations[language]

  const fetchBitcoinData = useCallback(async () => {
    if (isRefreshing) return
    
    try {
      setIsRefreshing(true)
      setError(null)
      
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true'
      )
      
      if (response.status === 429) {
        setError('Rate limit exceeded. Please wait a moment...')
        setIsRefreshing(false)
        return
      }
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      
      const data = await response.json()
      const bitcoinInfo = data.bitcoin
      const currentData = {
        current_price: bitcoinInfo.usd,
        price_change_24h: bitcoinInfo.usd_24h_change,
        price_change_percentage_24h: bitcoinInfo.usd_24h_change,
        market_cap: bitcoinInfo.usd_market_cap,
        total_volume: bitcoinInfo.usd_24h_vol,
        last_updated: new Date(bitcoinInfo.last_updated_at * 1000).toISOString(),
      }
      
      setBitcoinData(currentData)
      checkPriceAlerts(currentData.current_price)
      setLastUpdated(new Date())
      setLoading(false)
      setIsRefreshing(false)
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to fetch data. Retrying...')
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [isRefreshing])

  const fetchHistoricalData = useCallback(async (period: '24h' | '7d' | '30d' | '1y') => {
    try {
      setError(null)
      let days = period === '24h' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : 365
      
      // Add delay to avoid rate limit
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const historyResponse = await fetch(
        `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${days}`
      )
      
      if (historyResponse.status === 429) {
        setError('Rate limit exceeded. Chart will update soon...')
        return
      }
      
      if (!historyResponse.ok) {
        throw new Error(`API error: ${historyResponse.status}`)
      }
      
      const historyData = await historyResponse.json()
      if (!historyData.prices || !Array.isArray(historyData.prices)) {
        throw new Error('Invalid data format')
      }

      let prices = historyData.prices
      
      if (period === '24h') {
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000)
        prices = prices.filter((price: [number, number]) => price[0] >= oneDayAgo)
      }
      
      setFullHistory(prices)

      const chartPoints = prices.map((price: [number, number]) => {
        const date = new Date(price[0])
        let timeLabel = ''
        
        if (period === '24h') {
          timeLabel = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        } else if (period === '7d') {
          timeLabel = date.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' })
        } else if (period === '30d') {
          timeLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        } else {
          timeLabel = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        }
        
        return {
          time: timeLabel,
          price: Math.round(price[1]),
          timestamp: price[0]
        }
      })
      
      setChartData(chartPoints)
      
      const priceValues = prices.map((p: [number, number]) => p[1])
      const high = Math.max(...priceValues)
      const low = Math.min(...priceValues)
      const avg = priceValues.reduce((a: number, b: number) => a + b, 0) / priceValues.length
      const volatility = Math.sqrt(
        priceValues.reduce((sum: number, val: number) => sum + Math.pow(val - avg, 2), 0) / priceValues.length
      )
      
      const firstPrice = priceValues[0]
      const lastPrice = priceValues[priceValues.length - 1]
      const priceChangePercent = ((lastPrice - firstPrice) / firstPrice) * 100
      const trend = lastPrice > firstPrice ? 'up' : lastPrice < firstPrice ? 'down' : 'neutral'
      const momentum = priceValues.length > 10 
        ? ((priceValues[priceValues.length - 1] - priceValues[priceValues.length - 10]) / priceValues[priceValues.length - 10]) * 100
        : 0
      
      setAnalysis({
        highPrice: high,
        lowPrice: low,
        avgPrice: avg,
        volatility,
        trend,
        priceChangePercent,
        momentum
      })
    } catch (error) {
      console.error('Error fetching historical data:', error)
      setError('Failed to load chart data')
    }
  }, [])

  const checkPriceAlerts = useCallback((currentPrice: number) => {
    priceAlerts.forEach(alert => {
      if (!alert.active) return
      
      if (alert.type === 'above' && currentPrice >= alert.price) {
        showNotification(`Price Alert! Bitcoin is now above $${alert.price.toLocaleString()}`)
        setPriceAlerts(prev => prev.map(a => 
          a.id === alert.id ? { ...a, active: false } : a
        ))
      } else if (alert.type === 'below' && currentPrice <= alert.price) {
        showNotification(`Price Alert! Bitcoin is now below $${alert.price.toLocaleString()}`)
        setPriceAlerts(prev => prev.map(a => 
          a.id === alert.id ? { ...a, active: false } : a
        ))
      }
    })
  }, [priceAlerts])

  const showNotification = (message: string) => {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      alert(message)
      return
    }

    // Request permission if needed
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('Bitcoin Tracker 🔔', { 
            body: message,
            icon: '₿',
            badge: '₿',
            tag: 'bitcoin-price-alert',
            requireInteraction: true
          })
        } else {
          alert(message)
        }
      })
    } else if (Notification.permission === 'granted') {
      new Notification('Bitcoin Tracker 🔔', { 
        body: message,
        icon: '₿',
        badge: '₿',
        tag: 'bitcoin-price-alert',
        requireInteraction: true
      })
    } else {
      // Permission denied, use alert as fallback
      alert(message)
    }
  }

  const addPriceAlert = () => {
    const price = parseFloat(newAlertPrice)
    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid price')
      return
    }

    // Request notification permission immediately
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          // Show test notification
          new Notification('Bitcoin Tracker 🔔', {
            body: `Alert set! You'll be notified when Bitcoin ${newAlertType === 'above' ? 'rises above' : 'drops below'} ${price.toLocaleString()}`,
            icon: '₿',
            tag: 'bitcoin-alert-created'
          })
        }
      })
    }

    const newAlert: PriceAlert = {
      id: Date.now().toString(),
      type: newAlertType,
      price: price,
      active: true
    }

    setPriceAlerts(prev => [...prev, newAlert])
    setNewAlertPrice('')
    setShowAlertModal(false)
  }

  const removeAlert = (id: string) => {
    setPriceAlerts(prev => prev.filter(a => a.id !== id))
  }

  const handleLogoClick = () => {
    const newCount = logoClickCount + 1
    setLogoClickCount(newCount)
    
    if (newCount === 5) {
      setDevMode(!devMode)
      if (!devMode) {
        showNotification('🎉 Developer Mode Activated! You can now test notifications.')
      } else {
        alert('👋 Developer Mode Deactivated!')
      }
      setLogoClickCount(0)
    } else {
      // Reset after 5 seconds instead of 2
      setTimeout(() => {
        if (logoClickCount === newCount) {
          setLogoClickCount(0)
        }
      }, 5000)
    }
  }

  const testNotification = () => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('🧪 Test Notification', {
          body: `Bitcoin is at ${formattedPrice}. This is a test notification from Developer Mode!`,
          icon: '₿',
          badge: '🔔',
          tag: 'test-notification',
          requireInteraction: false
        })
        alert('✅ Test notification sent!')
      } else if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('🧪 Test Notification', {
              body: `Bitcoin is at ${formattedPrice}. This is a test notification!`,
              icon: '₿',
              badge: '🔔',
              tag: 'test-notification'
            })
            alert('✅ Permission granted! Test notification sent!')
          } else {
            alert('❌ Permission denied. Please allow notifications in your browser settings.')
          }
        })
      } else {
        alert('❌ Notifications are blocked. Please enable them in your browser settings.')
      }
    } else {
      alert('❌ Your browser does not support notifications.')
    }
  }

  const saveWebhook = () => {
    if (!webhookUrl.trim()) {
      alert('Please enter a webhook URL')
      return
    }
    
    if (!webhookName.trim()) {
      alert('Please enter a webhook name')
      return
    }

    const newWebhook = {
      id: Date.now().toString(),
      name: webhookName,
      url: webhookUrl,
      type: webhookType
    }

    setSavedWebhooks(prev => [...prev, newWebhook])
    setWebhookUrl('')
    setWebhookName('')
    setShowWebhookModal(false)
    alert('✅ Webhook saved successfully!')
  }

  const removeWebhook = (id: string) => {
    setSavedWebhooks(prev => prev.filter(w => w.id !== id))
  }

  const sendToWebhook = async (webhook: {id: string, name: string, url: string, type: string}) => {
    if (!bitcoinData) return
    
    setIsSendingWebhook(true)
    
    try {
      let payload: any
      
      if (webhook.type === 'discord') {
        // Discord Webhook Format
        payload = {
          embeds: [{
            title: '₿ Bitcoin Price Update',
            color: isPriceUp ? 0x00ff00 : 0xff0000,
            fields: [
              {
                name: '💰 Current Price',
                value: formattedPrice,
                inline: true
              },
              {
                name: '📈 24h Change',
                value: formattedChange,
                inline: true
              },
              {
                name: '📊 Market Cap',
                value: formattedMarketCap,
                inline: true
              },
              {
                name: '💹 24h Volume',
                value: formattedVolume,
                inline: true
              },
              {
                name: '🎯 High / Low',
                value: `${analysis.highPrice.toLocaleString()} / ${analysis.lowPrice.toLocaleString()}`,
                inline: true
              },
              {
                name: '📉 Trend',
                value: analysis.trend === 'up' ? '📈 Bullish' : analysis.trend === 'down' ? '📉 Bearish' : '➡️ Neutral',
                inline: true
              }
            ],
            footer: {
              text: 'Bitcoin Tracker Pro • Data from CoinGecko'
            },
            timestamp: new Date().toISOString()
          }]
        }
      } else if (webhook.type === 'slack') {
        // Slack Webhook Format
        payload = {
          text: '₿ Bitcoin Price Update',
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: '₿ Bitcoin Price Update',
                emoji: true
              }
            },
            {
              type: 'section',
              fields: [
                {
                  type: 'mrkdwn',
                  text: `*💰 Current Price:*\n${formattedPrice}`
                },
                {
                  type: 'mrkdwn',
                  text: `*📈 24h Change:*\n${formattedChange}`
                },
                {
                  type: 'mrkdwn',
                  text: `*📊 Market Cap:*\n${formattedMarketCap}`
                },
                {
                  type: 'mrkdwn',
                  text: `*💹 Volume:*\n${formattedVolume}`
                }
              ]
            }
          ]
        }
      } else {
        // Custom Webhook Format (Generic JSON)
        payload = {
          cryptocurrency: 'Bitcoin',
          symbol: 'BTC',
          price: bitcoinData.current_price,
          priceFormatted: formattedPrice,
          change24h: bitcoinData.price_change_24h,
          change24hFormatted: formattedChange,
          marketCap: bitcoinData.market_cap,
          marketCapFormatted: formattedMarketCap,
          volume24h: bitcoinData.total_volume,
          volume24hFormatted: formattedVolume,
          trend: analysis.trend,
          high: analysis.highPrice,
          low: analysis.lowPrice,
          average: analysis.avgPrice,
          volatility: analysis.volatility,
          timestamp: new Date().toISOString()
        }
      }

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        alert(`✅ Data sent to ${webhook.name} successfully!`)
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error('Webhook error:', error)
      alert(`❌ Failed to send to ${webhook.name}. Please check your webhook URL.`)
    } finally {
      setIsSendingWebhook(false)
    }
  }

  useEffect(() => {
    fetchBitcoinData()
    
    // Fetch historical data only once on mount
    const timer = setTimeout(() => {
      fetchHistoricalData(timeframe)
    }, 2000)
    
    // Increase interval to 60 seconds to avoid rate limit
    const interval = setInterval(fetchBitcoinData, 60000)
    
    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    fetchHistoricalData(timeframe)
  }, [timeframe, fetchHistoricalData])

  const handleTimeframeChange = (newTimeframe: '24h' | '7d' | '30d' | '1y') => {
    setTimeframe(newTimeframe)
  }

  const isPriceUp = bitcoinData ? bitcoinData.price_change_24h >= 0 : false
  const formattedPrice = useMemo(() => 
    bitcoinData ? `$${bitcoinData.current_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-',
    [bitcoinData]
  )
  const formattedChange = useMemo(() => 
    bitcoinData ? `${bitcoinData.price_change_24h >= 0 ? '+' : ''}${bitcoinData.price_change_24h.toFixed(2)}%` : '-',
    [bitcoinData]
  )
  const formattedMarketCap = useMemo(() => 
    bitcoinData ? `$${(bitcoinData.market_cap / 1e9).toFixed(2)}B` : '-',
    [bitcoinData]
  )
  const formattedVolume = useMemo(() => 
    bitcoinData ? `$${(bitcoinData.total_volume / 1e9).toFixed(2)}B` : '-',
    [bitcoinData]
  )

  const downloadDataAsCSV = () => {
    if (fullHistory.length === 0) return

    const csvContent = [
      ['Timestamp', 'Date & Time', 'Price (USD)'],
      ...fullHistory.map(item => [
        item[0],
        new Date(item[0]).toLocaleString('en-US'),
        item[1].toFixed(2)
      ])
    ].map(row => row.join(',')).join('\n')

    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent))
    element.setAttribute('download', `bitcoin-price-${timeframe}-${new Date().toISOString().split('T')[0]}.csv`)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    setDownloadOpen(false)
  }

  const downloadDataAsJSON = () => {
    if (fullHistory.length === 0) return

    const jsonData = {
      currency: 'bitcoin',
      timeframe: timeframe,
      downloadedAt: new Date().toISOString(),
      dataPoints: fullHistory.map(item => ({
        timestamp: item[0],
        dateTime: new Date(item[0]).toLocaleString('en-US'),
        price: item[1]
      })),
      analysis
    }

    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(jsonData, null, 2)))
    element.setAttribute('download', `bitcoin-price-${timeframe}-${new Date().toISOString().split('T')[0]}.json`)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    setDownloadOpen(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center p-4">
        <div className="text-slate-300 text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mb-4"></div>
          <p className="text-lg font-medium">{t.loading}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-4 sm:p-6 lg:p-8">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-orange-600/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8 sm:mb-12">
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogoClick}
              className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/50 cursor-pointer hover:scale-110 transition-transform duration-300 active:scale-95 relative"
              title={devMode ? '🔧 Developer Mode' : 'Bitcoin'}
            >
              <span className="text-white font-bold text-2xl">{devMode ? '🔧' : '₿'}</span>
              {logoClickCount > 0 && logoClickCount < 5 && !devMode && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-bounce">
                  {logoClickCount}
                </span>
              )}
            </button>
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold text-white">
                {t.title}
                {devMode && <span className="text-green-400 text-sm ml-2">DEV</span>}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">{t.subtitle}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {devMode && (
              <button
                onClick={testNotification}
                className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-3 rounded-xl bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 border border-green-500/50 transition-all duration-300 text-white shadow-lg shadow-green-500/30 animate-pulse"
                title="Test Notification"
              >
                <Bell size={18} />
                <span className="hidden sm:inline text-sm font-medium">Test 🧪</span>
              </button>
            )}
            <div className="relative">
              <button
                onClick={() => setLanguage(language === 'en' ? 'id' : 'en')}
                className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-3 rounded-xl bg-slate-800/80 backdrop-blur-sm border border-slate-700 hover:bg-slate-700/80 transition-all duration-300 text-white shadow-lg"
                title="Change language"
              >
                <Globe size={18} />
                <span className="text-sm font-medium">{language.toUpperCase()}</span>
              </button>
            </div>
            <button
              onClick={() => setShowAlertModal(true)}
              className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 border border-blue-500/50 transition-all duration-300 text-white shadow-lg shadow-blue-500/30"
              title={t.alerts}
            >
              <Bell size={18} />
              <span className="hidden sm:inline text-sm font-medium">{t.alerts}</span>
            </button>
            <button
              onClick={() => setShowWebhookModal(true)}
              className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 border border-purple-500/50 transition-all duration-300 text-white shadow-lg shadow-purple-500/30"
              title="Send to Webhook"
            >
              <Zap size={18} />
              <span className="hidden sm:inline text-sm font-medium">Webhook</span>
            </button>
            <div className="relative">
              <button
                onClick={() => setDownloadOpen(!downloadOpen)}
                className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-3 rounded-xl bg-slate-800/80 backdrop-blur-sm border border-slate-700 hover:bg-slate-700/80 transition-all duration-300 text-white shadow-lg"
                title="Download data"
              >
                <Download size={18} />
                <ChevronDown size={16} className={`transition-transform duration-300 ${downloadOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {downloadOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-800/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl py-2 z-50">
                  <button onClick={downloadDataAsCSV} className="w-full text-left px-4 py-2 hover:bg-slate-700 transition-colors text-slate-200 hover:text-white">
                    <span className="text-sm font-medium">{t.downloadCSV}</span>
                  </button>
                  <button onClick={downloadDataAsJSON} className="w-full text-left px-4 py-2 hover:bg-slate-700 transition-colors text-slate-200 hover:text-white">
                    <span className="text-sm font-medium">{t.downloadJSON}</span>
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={fetchBitcoinData}
              disabled={isRefreshing}
              className={`p-2 sm:p-3 rounded-xl bg-slate-800/80 backdrop-blur-sm border border-slate-700 hover:bg-slate-700/80 transition-all duration-300 text-white shadow-lg ${isRefreshing ? 'opacity-50 cursor-not-allowed' : 'hover:rotate-180'}`}
              title={t.refreshData}
            >
              <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {priceAlerts.length > 0 && (
          <div className="mb-6 bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-4 shadow-xl">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Bell size={18} />
              {t.activeAlerts}
            </h3>
            <div className="flex flex-wrap gap-2">
              {priceAlerts.map(alert => (
                <div key={alert.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${alert.active ? 'bg-blue-500/20 border border-blue-500/40' : 'bg-slate-700/50 border border-slate-600'}`}>
                  <span className="text-sm text-slate-300">
                    {alert.type === 'above' ? '↑' : '↓'} ${alert.price.toLocaleString()}
                  </span>
                  <button onClick={() => removeAlert(alert.id)} className="text-red-400 hover:text-red-300 text-xs">✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {savedWebhooks.length > 0 && (
          <div className="mb-6 bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-4 shadow-xl">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Zap size={18} />
              Saved Webhooks
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {savedWebhooks.map(webhook => (
                <div key={webhook.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm">{webhook.name}</p>
                    <p className="text-slate-400 text-xs truncate">{webhook.url}</p>
                    <span className="text-xs text-purple-400 mt-1 inline-block capitalize">{webhook.type}</span>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <button
                      onClick={() => sendToWebhook(webhook)}
                      disabled={isSendingWebhook}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSendingWebhook ? '...' : 'Send'}
                    </button>
                    <button
                      onClick={() => removeWebhook(webhook.id)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <p className="text-red-400 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </p>
          </div>
        )}

        <div className="mb-6 sm:mb-8 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-slate-400 text-sm mb-2 flex items-center gap-2">
                <DollarSign size={16} />
                {t.currentPrice}
              </p>
              <p className="text-5xl sm:text-6xl font-bold text-white mb-2">{formattedPrice}</p>
              <p className="text-slate-500 text-sm">
                {lastUpdated && `${t.updated} ${lastUpdated.toLocaleTimeString()}`}
              </p>
            </div>
            <div className={`flex items-center gap-2 px-5 py-3 rounded-xl ${isPriceUp ? 'bg-green-500/20 border-2 border-green-500/50' : 'bg-red-500/20 border-2 border-red-500/50'}`}>
              {isPriceUp ? (
                <TrendingUp className="text-green-400" size={24} />
              ) : (
                <TrendingDown className="text-red-400" size={24} />
              )}
              <span className={`font-bold text-xl ${isPriceUp ? 'text-green-400' : 'text-red-400'}`}>
                {formattedChange}
              </span>
            </div>
          </div>

          <div className="flex gap-2 mb-6 border-b border-slate-800 pb-4">
            {(['24h', '7d', '30d', '1y'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => handleTimeframeChange(tf)}
                className={`px-5 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  timeframe === tf
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="flex gap-2 mb-4">
            {(['area', 'line', 'bar'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                  chartType === type ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="mb-6 bg-slate-800/30 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/50">
            <ResponsiveContainer width="100%" height={350}>
              {chartType === 'area' ? (
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
                  <XAxis dataKey="time" stroke="rgba(148,163,184,0.5)" tick={{ fill: 'rgba(148,163,184,0.7)', fontSize: 11 }} />
                  <YAxis stroke="rgba(148,163,184,0.5)" tick={{ fill: 'rgba(148,163,184,0.7)', fontSize: 11 }} tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(148,163,184,0.3)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                    labelStyle={{ color: 'rgba(226, 232, 240, 0.9)', fontWeight: 'bold' }}
                    formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Price']}
                  />
                  <Area type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
                </AreaChart>
              ) : chartType === 'line' ? (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
                  <XAxis dataKey="time" stroke="rgba(148,163,184,0.5)" tick={{ fill: 'rgba(148,163,184,0.7)', fontSize: 11 }} />
                  <YAxis stroke="rgba(148,163,184,0.5)" tick={{ fill: 'rgba(148,163,184,0.7)', fontSize: 11 }} tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(148,163,184,0.3)', borderRadius: '12px' }}
                    labelStyle={{ color: 'rgba(226, 232, 240, 0.9)', fontWeight: 'bold' }}
                    formatter={(value) => [`${Number(value).toLocaleString()}`, 'Price']}
                  />
                  <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={3} dot={false} />
                </LineChart>
              ) : (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
                  <XAxis dataKey="time" stroke="rgba(148,163,184,0.5)" tick={{ fill: 'rgba(148,163,184,0.7)', fontSize: 11 }} />
                  <YAxis stroke="rgba(148,163,184,0.5)" tick={{ fill: 'rgba(148,163,184,0.7)', fontSize: 11 }} tickFormatter={(value) => `${(value/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(148,163,184,0.3)', borderRadius: '12px' }}
                    labelStyle={{ color: 'rgba(226, 232, 240, 0.9)', fontWeight: 'bold' }}
                    formatter={(value) => [`${Number(value).toLocaleString()}`, 'Price']}
                  />
                  <Bar dataKey="price" fill="#3b82f6" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity size={24} />
              {t.advancedAnalytics}
            </h2>
            <button
              onClick={() => setShowStats(!showStats)}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              {showStats ? t.hide : t.show}
            </button>
          </div>
          
          {showStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <AnalysisCard 
                icon={<TrendingUp size={20} />}
                label={t.highPrice}
                value={`${analysis.highPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}`}
                color="text-green-400"
                bgColor="bg-green-500/10"
                borderColor="border-green-500/30"
              />
              <AnalysisCard 
                icon={<TrendingDown size={20} />}
                label={t.lowPrice}
                value={`${analysis.lowPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}`}
                color="text-red-400"
                bgColor="bg-red-500/10"
                borderColor="border-red-500/30"
              />
              <AnalysisCard 
                icon={<Target size={20} />}
                label={t.averagePrice}
                value={`${analysis.avgPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}`}
                color="text-blue-400"
                bgColor="bg-blue-500/10"
                borderColor="border-blue-500/30"
              />
              <AnalysisCard 
                icon={<Activity size={20} />}
                label={t.volatility}
                value={`${analysis.volatility.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
                color="text-orange-400"
                bgColor="bg-orange-500/10"
                borderColor="border-orange-500/30"
              />
              <AnalysisCard 
                icon={<Zap size={20} />}
                label={t.priceChange}
                value={`${analysis.priceChangePercent >= 0 ? '+' : ''}${analysis.priceChangePercent.toFixed(2)}%`}
                color={analysis.priceChangePercent >= 0 ? "text-green-400" : "text-red-400"}
                bgColor={analysis.priceChangePercent >= 0 ? "bg-green-500/10" : "bg-red-500/10"}
                borderColor={analysis.priceChangePercent >= 0 ? "border-green-500/30" : "border-red-500/30"}
              />
              <AnalysisCard 
                icon={<TrendingUp size={20} />}
                label={t.momentum}
                value={`${analysis.momentum >= 0 ? '+' : ''}${analysis.momentum.toFixed(2)}%`}
                color={analysis.momentum >= 0 ? "text-green-400" : "text-red-400"}
                bgColor={analysis.momentum >= 0 ? "bg-green-500/10" : "bg-red-500/10"}
                borderColor={analysis.momentum >= 0 ? "border-green-500/30" : "border-red-500/30"}
              />
              <AnalysisCard 
                icon={<BarChart3 size={20} />}
                label={t.volume24h}
                value={formattedVolume}
                color="text-purple-400"
                bgColor="bg-purple-500/10"
                borderColor="border-purple-500/30"
              />
              <AnalysisCard 
                icon={<DollarSign size={20} />}
                label={t.marketCap}
                value={formattedMarketCap}
                color="text-yellow-400"
                bgColor="bg-yellow-500/10"
                borderColor="border-yellow-500/30"
              />
            </div>
          )}
        </div>

        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 shadow-xl mb-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Calendar size={20} />
            {t.marketTrend} ({timeframe})
          </h3>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <p className={`text-2xl font-bold mb-2 ${analysis.trend === 'up' ? 'text-green-400' : analysis.trend === 'down' ? 'text-red-400' : 'text-slate-400'}`}>
                {analysis.trend === 'up' ? `📈 ${t.bullishTrend}` : analysis.trend === 'down' ? `📉 ${t.bearishTrend}` : `➡️ ${t.neutralTrend}`}
              </p>
              <p className="text-slate-400 text-sm">
                {analysis.trend === 'up' ? t.bullishDesc : analysis.trend === 'down' ? t.bearishDesc : t.neutralDesc}
              </p>
            </div>
            <div className="flex-1 bg-slate-800/50 rounded-xl p-4">
              <p className="text-slate-400 text-sm mb-2">{t.keyInsights}</p>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">•</span>
                  {t.range}: ${analysis.lowPrice.toLocaleString()} - ${analysis.highPrice.toLocaleString()}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">•</span>
                  {t.volatilityPercent}: {((analysis.volatility / analysis.avgPrice) * 100).toFixed(2)}% {t.ofAvgPrice}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">•</span>
                  {t.currentVsAvg}: {((bitcoinData!.current_price / analysis.avgPrice - 1) * 100).toFixed(2)}%
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-slate-500 text-sm bg-slate-900/30 backdrop-blur-sm rounded-xl p-4 border border-slate-800">
          <p className="flex items-center justify-center gap-2">
            <RefreshCw size={14} />
            Auto-refreshing every 60 seconds • Data powered by CoinGecko API
          </p>
        </div>
      </div>

      {showAlertModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Bell size={24} />
                {t.setPriceAlert}
              </h3>
              <button
                onClick={() => setShowAlertModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-slate-400 text-sm mb-2 block">{t.alertType}</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewAlertType('above')}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                      newAlertType === 'above'
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {t.above} ↑
                  </button>
                  <button
                    onClick={() => setNewAlertType('below')}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                      newAlertType === 'below'
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {t.below} ↓
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-400 text-sm mb-2 block">{t.targetPrice}</label>
                <input
                  type="number"
                  value={newAlertPrice}
                  onChange={(e) => setNewAlertPrice(e.target.value)}
                  placeholder={t.enterPrice}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <p className="text-blue-400 text-sm flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  {t.alertNotification}
                </p>
              </div>

              <button
                onClick={addPriceAlert}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/30"
              >
                {t.createAlert}
              </button>
            </div>
          </div>
        </div>
      )}

      {showWebhookModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Zap size={24} />
                Setup Webhook
              </h3>
              <button
                onClick={() => setShowWebhookModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-slate-400 text-sm mb-2 block">Webhook Name</label>
                <input
                  type="text"
                  value={webhookName}
                  onChange={(e) => setWebhookName(e.target.value)}
                  placeholder="e.g., My Discord Server"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-slate-400 text-sm mb-2 block">Webhook Type</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setWebhookType('discord')}
                    className={`py-3 rounded-xl font-medium transition-all ${
                      webhookType === 'discord'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    Discord
                  </button>
                  <button
                    onClick={() => setWebhookType('slack')}
                    className={`py-3 rounded-xl font-medium transition-all ${
                      webhookType === 'slack'
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    Slack
                  </button>
                  <button
                    onClick={() => setWebhookType('custom')}
                    className={`py-3 rounded-xl font-medium transition-all ${
                      webhookType === 'custom'
                        ? 'bg-orange-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    Custom
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-400 text-sm mb-2 block">Webhook URL</label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder={
                    webhookType === 'discord' 
                      ? 'https://discord.com/api/webhooks/...' 
                      : webhookType === 'slack'
                      ? 'https://hooks.slack.com/services/...'
                      : 'https://your-webhook-url.com/endpoint'
                  }
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                <p className="text-purple-400 text-sm mb-2 font-semibold">ℹ️ How to get webhook URL:</p>
                {webhookType === 'discord' && (
                  <ul className="text-purple-300 text-xs space-y-1 ml-4 list-disc">
                    <li>Go to Server Settings → Integrations → Webhooks</li>
                    <li>Click "New Webhook" or select existing one</li>
                    <li>Copy the Webhook URL</li>
                  </ul>
                )}
                {webhookType === 'slack' && (
                  <ul className="text-purple-300 text-xs space-y-1 ml-4 list-disc">
                    <li>Go to api.slack.com/apps</li>
                    <li>Create app → Enable Incoming Webhooks</li>
                    <li>Add New Webhook to Workspace</li>
                    <li>Copy the Webhook URL</li>
                  </ul>
                )}
                {webhookType === 'custom' && (
                  <ul className="text-purple-300 text-xs space-y-1 ml-4 list-disc">
                    <li>Use any endpoint that accepts POST requests</li>
                    <li>Data will be sent as JSON payload</li>
                    <li>Includes: price, change, market cap, trend, etc.</li>
                  </ul>
                )}
              </div>

              <button
                onClick={saveWebhook}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-medium transition-all shadow-lg shadow-purple-500/30"
              >
                Save Webhook
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AnalysisCard({ icon, label, value, color, bgColor, borderColor }: { 
  icon: React.ReactNode
  label: string
  value: string
  color: string
  bgColor: string
  borderColor: string
}) {
  return (
    <div className={`${bgColor} border ${borderColor} backdrop-blur-sm rounded-xl p-5 hover:scale-105 transition-all duration-300 shadow-lg`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`${color}`}>{icon}</div>
        <p className="text-slate-400 text-sm font-medium">{label}</p>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  )
}