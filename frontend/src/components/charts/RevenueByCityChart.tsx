import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './Chart.css'

interface RevenueByCityChartProps {
  data: { city: string; revenue: number }[]
}

export function RevenueByCityChart({ data }: RevenueByCityChartProps) {
  return (
    <div className="chart-container">
      <h3>Revenue by City</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="city" />
          <YAxis />
          <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
          <Legend />
          <Bar dataKey="revenue" fill="#0066cc" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

