import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './Chart.css'

interface ReviewsChartProps {
  data: { propertyId: string; propertyName: string; averageRating: number; reviewCount: number }[]
}

export function ReviewsChart({ data }: ReviewsChartProps) {
  return (
    <div className="chart-container">
      <h3>Reviews on Properties</h3>
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
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Bar yAxisId="left" dataKey="reviewCount" fill="#8884d8" name="Review Count" />
          <Bar yAxisId="right" dataKey="averageRating" fill="#82ca9d" name="Avg Rating" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

