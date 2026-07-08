
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { summarizeDashboardInsights } from "@/ai/flows/summarize-dashboard-insights-flow";
import { aiCropHealthIssues } from "@/ai/flows/ai-crop-health-issues";
import { mockFieldData } from "@/lib/data";
import { AlertTriangle, Bot, Loader2 } from "lucide-react";
import { HealthTrendChart } from "@/components/health-trend-chart";
import type { WeatherData } from "@/types";
import { history as checkupHistory } from "@/lib/data"; // In a real app, this would be a database call.
import { DashboardClient } from "@/components/dashboard-client";
import React from 'react';

async function DashboardSummary({ weather }: { weather: WeatherData | null }) {
  if (!weather) return null;

  // Find the most recent disease from history
  const lastDisease = checkupHistory.find(item => item.status === 'Diseased' || item.status === 'At Risk');

  try {
    const summary = await summarizeDashboardInsights({
        soilHealth: `Approx. ${weather.humidity}% moisture`,
        temperature: `${weather.temperature}°C`,
        leafDiseases: lastDisease ? `${lastDisease.disease} detected recently` : 'No major diseases detected recently.',
        plantHealth: 'Overall health appears stable based on recent checkups.',
    });
     return (
        <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
            <Bot className="text-primary" />
            AI-Powered Insights
            </CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-foreground/80">{summary.summary}</p>
        </CardContent>
        </Card>
      );
    } catch (e) {
        console.error("Failed to get dashboard summary:", e);
        return (
             <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                    <Bot className="text-primary" />
                    AI-Powered Insights
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-foreground/80">AI insights are temporarily unavailable. Please try again later.</p>
                </CardContent>
            </Card>
        )
    }
}

async function ActiveRisksSummary({ weather }: { weather: WeatherData | null }) {
  if (!weather) return null;

  const lastDisease = checkupHistory.find(item => item.status === 'Diseased' || item.status === 'At Risk');

  try {
    const summary = await aiCropHealthIssues({
        cropType: mockFieldData.cropType,
        fieldConditions: `Current temperature is ${weather.temperature}°C with ${weather.humidity}% humidity.`,
        leafAnalysisResults: lastDisease ? `Recent analysis showed ${lastDisease.disease}.` : 'No recent diseases detected.',
        historicalData: 'Historical data is not available yet.',
        location: weather.location,
    });
    return (
        <div>
          <p className="text-sm text-muted-foreground">{summary.summary}</p>
        </div>
      );
  } catch(e) {
    console.error("Failed to get active risks summary:", e);
    return (
        <div>
            <p className="text-sm text-muted-foreground">Could not load active risk assessment. Please try again later.</p>
        </div>
    )
  }
}

async function getWeatherData(latitude: number, longitude: number): Promise<WeatherData | null> {
    try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,is_day&daily=sunshine_duration&timezone=auto`, { next: { revalidate: 3600 } });
        if (!response.ok) {
            console.error('Failed to fetch weather data, status:', response.status);
            return null;
        }
        const data = await response.json();
        
        let locationName = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
        try {
            const geoResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            if (geoResponse.ok) {
                const geoData = await geoResponse.json();
                locationName = geoData.address.city || geoData.address.town || geoData.address.village || geoData.display_name;
            }
        } catch (e) {
            console.error("Reverse geocoding failed", e);
        }

        return {
            temperature: Math.round(data.current.temperature_2m),
            windSpeed: Math.round(data.current.wind_speed_10m),
            humidity: data.current.relative_humidity_2m,
            sunHours: Math.round(data.daily.sunshine_duration[0] / 3600),
            location: locationName,
            isDay: data.current.is_day === 1,
        };
    } catch (error) {
        console.error('Failed to fetch weather data:', error);
        return null;
    }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const lat = searchParams?.lat ? Number(searchParams.lat) : 18.29; // Default to Vizianagaram
  const lon = searchParams?.lon ? Number(searchParams.lon) : 83.4;
  const weather = await getWeatherData(lat, lon);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      
      <DashboardClient weather={weather} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Suspense fallback={<Card className="bg-primary/5 border-primary/20 h-36 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></Card>}>
            <DashboardSummary weather={weather} />
          </Suspense>
        </div>
        <div className="space-y-6">
          <Card className="bg-accent/10 border-accent/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><AlertTriangle className="text-accent" /> Active Risks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Suspense fallback={<div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /><span>Assessing risks...</span></div>}>
                <ActiveRisksSummary weather={weather} />
              </Suspense>
              <Button asChild className="w-full" variant="outline">
                <Link href="/analysis">Analyze Leaf Sample</Link>
              </Button>
              <Button asChild className="w-full">
                <Link href="/reports">Generate Full Report</Link>
              </Button>
            </CardContent>
          </Card>
          <HealthTrendChart />
        </div>
      </div>
    </div>
  );
}
