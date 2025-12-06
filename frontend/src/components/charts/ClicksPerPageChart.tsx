import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import './Chart.css'

interface ClicksPerPageChartProps {
  data: { page: string; clicks: number; uniqueUsers: number }[]
  chartType?: 'bar' | 'pie'
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

// Format page URL for display
const formatPageLabel = (page: string): string => {
  if (!page || page === '/') return 'Home'
  
  // Remove leading slash and split
  const parts = page.replace(/^\//, '').split('/')
  
  if (parts.length === 1) {
    // Just the section: /hotels -> Hotels
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
  }
  
  if (parts.length === 2) {
    // Section + ID: /hotels/HT0001 -> Hotels: HT0001
    const section = parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
    return `${section}: ${parts[1]}`
  }
  
  // Longer paths - truncate
  return page.length > 25 ? page.substring(0, 22) + '...' : page
}

// Custom tooltip to show full page URL
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ 
        backgroundColor: 'white', 
        padding: '10px', 
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color, margin: '2px 0' }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function ClicksPerPageChart({ data, chartType = 'bar' }: ClicksPerPageChartProps) {
  // Transform data with formatted labels
  const formattedData = data.map(item => ({
    ...item,
    displayLabel: formatPageLabel(item.page),
    fullPage: item.page // Keep original for tooltip
  }))

  if (chartType === 'pie') {
    return (
      <div className="chart-container">
        <h3>Clicks per Page (Pie Chart)</h3>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={formattedData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ displayLabel, percent }) => `${displayLabel} ${((percent || 0) * 100).toFixed(0)}%`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="clicks"
            >
              {formattedData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div className="chart-container">
      <h3>Clicks per Page</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={formattedData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="displayLabel" 
            angle={-35}
            textAnchor="end"
            height={80}
            interval={0}
            tick={{ fontSize: 12 }}
          />
          <YAxis allowDecimals={false} />
          <Tooltip 
            content={<CustomTooltip />}
            labelFormatter={(label) => {
              const item = formattedData.find(d => d.displayLabel === label)
              return item ? item.fullPage : label
            }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Bar dataKey="clicks" fill="#0066cc" name="Total Clicks" radius={[4, 4, 0, 0]} />
          <Bar dataKey="uniqueUsers" fill="#00C49F" name="Unique Users" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

