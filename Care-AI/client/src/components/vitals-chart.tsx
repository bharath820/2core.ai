import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { type Vital } from "@shared/schema";

interface VitalsChartProps {
  data: Vital[];
  title: string;
  dataKey: string;
  color: string;
}

export function VitalsChart({ data, title, dataKey, color }: VitalsChartProps) {
  // Sort data by date ascending for the chart
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Format data for Recharts
  const chartData = sortedData.map(item => ({
    ...item,
    formattedDate: format(new Date(item.date), 'MMM d'),
    numericValue: parseFloat(item.value.split('/')[0]), // Handle '120/80' by taking systolic only for now
  }));

  if (data.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>No data available yet</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-lg mx-6 mb-6 border-2 border-dashed border-border/50">
          Start logging your vitals to see trends here.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Trends over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="formattedDate" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                width={30}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  borderColor: 'hsl(var(--border))', 
                  borderRadius: '0.5rem',
                  boxShadow: 'var(--shadow-md)'
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="numericValue" 
                name={title}
                stroke={color} 
                strokeWidth={3} 
                dot={{ r: 4, fill: color, strokeWidth: 2, stroke: 'white' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
