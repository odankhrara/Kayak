import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './Chart.css'

interface TopPropertiesChartProps {
  data: { name: string; revenue: number }[]
}

export function TopPropertiesChart({ data }: TopPropertiesChartProps) {
  return (
    <div className="chart-container">
      <h3>Top Properties by Revenue</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" width={150} />
          <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
          <Legend />
          <Bar dataKey="revenue" fill="#ff6600" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

