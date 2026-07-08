"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { healthTrends } from "@/lib/data"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const chartConfig = {
  soilMoisture: {
    label: "Soil Moisture",
    color: "hsl(var(--chart-1))",
  },
  plantHealth: {
    label: "Plant Health",
    color: "hsl(var(--primary))",
  },
}

export function HealthTrendChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Health Trends</CardTitle>
        <CardDescription>Last 7 months</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <ResponsiveContainer>
            <BarChart data={healthTrends} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="plantHealth" fill="var(--color-plantHealth)" radius={4} />
              <Bar dataKey="soilMoisture" fill="var(--color-soilMoisture)" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
