import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Chart.css';

interface BookingStatusPieChartProps {
  data: { status: string; count: number }[];
}

const COLORS = ['#6366F1', '#22C55E', '#F59E0B', '#EF4444', '#0EA5E9', '#8B5CF6'];

export function BookingStatusPieChart({ data }: BookingStatusPieChartProps) {
  const chartData = data?.length ? data : [{ status: 'No Data', count: 1 }];

  return (
    <div className="chart-container">
      <h3>Bookings by Status</h3>
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="count"
            nameKey="status"
            cx="50%"
            cy="50%"
            outerRadius={110}
            label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => value.toLocaleString()} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
