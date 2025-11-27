import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './Chart.css'

interface PropertyClicksChartProps {
  data: { propertyId: string; propertyName: string; clicks: number; pageUrl: string }[]
}

export function PropertyClicksChart({ data }: PropertyClicksChartProps) {
  return (
    <div className="chart-container">
      <h3>Property/Listing Clicks</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="propertyName" 
            angle={-45}
            textAnchor="end"
            height={120}
            interval={0}
          />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="clicks" fill="#FF8042" name="Clicks" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

