import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { CATEGORY_COLORS } from '../../utils/helpers';

export default function ExpensePieChart({ data }) {
  if (!data?.length) {
    return <p className="text-gray-400 text-sm text-center py-8">No data for selected period</p>;
  }

  const chartData = data.map((d) => ({
    name: d._id,
    value: d.total,
    color: CATEGORY_COLORS[d._id] || '#94a3b8',
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          outerRadius={75}
          dataKey="value"
          label={({ name, percent }) =>
            percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''
          }
          labelLine={false}
        >
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Amount']} contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
