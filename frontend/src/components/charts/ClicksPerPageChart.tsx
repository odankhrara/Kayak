import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import './Chart.css'

interface ClicksPerPageChartProps {
  data: { page: string; clicks: number; uniqueUsers: number }[]
  chartType?: 'bar' | 'pie'
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

export function ClicksPerPageChart({ data, chartType = 'bar' }: ClicksPerPageChartProps) {
  if (chartType === 'pie') {
    return (
      <div className="chart-container">
        <h3>Clicks per Page (Pie Chart)</h3>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ page, percent }) => `${page.substring(0, 20)} ${(percent * 100).toFixed(0)}%`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="clicks"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
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
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="page" 
            angle={-45}
            textAnchor="end"
            height={100}
            interval={0}
          />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="clicks" fill="#0066cc" name="Total Clicks" />
          <Bar dataKey="uniqueUsers" fill="#00C49F" name="Unique Users" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

