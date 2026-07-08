
"use client";

import { useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Thermometer, Droplets, Wind, Sun, Loader2, RefreshCw, Moon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { WeatherData } from "@/types";

function WeatherCard({ title, value, subtext, icon, action, isLoading }: {
    title: string;
    value: string;
    subtext: string;
    icon: React.ReactNode;
    action?: React.ReactNode;
    isLoading: boolean;
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                    <>
                        <div className="text-2xl font-bold">{value}</div>
                        <div className="flex justify-between items-center">
                            <p className="text-xs text-muted-foreground">{subtext}</p>
                            {action}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

export function DashboardClient({ weather }: { weather: WeatherData | null }) {
    const { toast } = useToast();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isLocating, setIsLocating] = useState(false);
    
    // Check if lat/lon are not in search params to trigger initial location fetch
    useEffect(() => {
        if (!searchParams.has('lat') && !searchParams.has('lon')) {
            handleGetCurrentLocation();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast({
                variant: "destructive",
                title: "Location Not Supported",
                description: "Geolocation is not supported by this browser.",
            });
            return;
        }

        setIsLocating(true);
        toast({ title: "Fetching your location..." });

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                router.push(`${pathname}?lat=${latitude}&lon=${longitude}`);
                setIsLocating(false);
            },
            (err) => {
                console.error("Geolocation error:", err.message);
                toast({
                    variant: "destructive",
                    title: "Location Error",
                    description: "Could not get your location. Falling back to default.",
                });
                setIsLocating(false);
            }
        );
    };
    
    const isLoading = weather === undefined || weather === null && !searchParams.has('lat');

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <WeatherCard
                title="Temperature"
                value={`${weather?.temperature ?? '...'}°C`}
                subtext={`in ${weather?.location ?? '...'}`}
                icon={<Thermometer className="h-4 w-4 text-muted-foreground" />}
                isLoading={isLoading}
                action={
                    <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2" onClick={handleGetCurrentLocation} disabled={isLocating}>
                        {isLocating ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                    </Button>
                }
            />
            <WeatherCard
                title="Soil Moisture"
                value={`${weather?.humidity ?? '...'}%`}
                subtext="Current humidity"
                icon={<Droplets className="h-4 w-4 text-muted-foreground" />}
                isLoading={isLoading}
            />
            <WeatherCard
                title="Wind Speed"
                value={`${weather?.windSpeed ?? '...'} km/h`}
                subtext="Current wind"
                icon={<Wind className="h-4 w-4 text-muted-foreground" />}
                isLoading={isLoading}
            />
            {isLoading ? (
                <WeatherCard title="Sunlight" value="..." subtext="..." icon={<Sun className="h-4 w-4 text-muted-foreground" />} isLoading={true} />
            ) : weather?.isDay ? (
                <WeatherCard
                    title="Sunlight"
                    value={`${weather?.sunHours ?? '...'}h`}
                    subtext="of daily sunlight"
                    icon={<Sun className="h-4 w-4 text-muted-foreground" />}
                    isLoading={isLoading}
                />
            ) : (
                <WeatherCard
                    title="Night"
                    value="Night"
                    subtext="Currently dark"
                    icon={<Moon className="h-4 w-4 text-muted-foreground" />}
                    isLoading={isLoading}
                />
            )}
        </div>
    );
}
