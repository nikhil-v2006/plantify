
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Layers, Loader2, LocateFixed } from "lucide-react";
import { aiSoilAnalysis } from "@/ai/flows/ai-soil-analysis";
import { mockFieldData } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  cropType: z.string().min(2, { message: "Crop type is required." }),
  location: z.string().min(2, { message: "A location name is required for context." }),
});

type Geolocation = {
    latitude: number;
    longitude: number;
} | null;

export default function SoilAnalysisPage() {
    const { toast } = useToast();
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [geolocation, setGeolocation] = useState<Geolocation>(null);
    const [isLocating, setIsLocating] = useState(false);
    
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            cropType: mockFieldData.cropType,
            location: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!geolocation) {
            toast({
                variant: "destructive",
                title: "Location Required",
                description: "Please use your current location to generate a soil analysis.",
            });
            return;
        }

        setIsLoading(true);
        setAnalysis(null);
        try {
            const result = await aiSoilAnalysis({
                latitude: geolocation.latitude,
                longitude: geolocation.longitude,
                cropType: values.cropType,
            });
            setAnalysis(result.summary);
        } catch (error) {
            console.error("Failed to generate soil analysis:", error);
            toast({
                variant: "destructive",
                title: "Analysis Failed",
                description: "Could not connect to the AI service.",
            });
        } finally {
            setIsLoading(false);
        }
    }
    
    const handleReverseGeocode = async (latitude: number, longitude: number) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await response.json();
            const locationName = data.address.city || data.address.town || data.address.village || data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            form.setValue("location", locationName);
        } catch (error) {
            console.error("Reverse geocoding failed:", error);
            form.setValue("location", `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        } finally {
             setIsLocating(false);
        }
    };


    const handleUseCurrentLocation = () => {
        setIsLocating(true);
        setGeolocation(null);
        form.setValue("location", "Fetching location...");
        toast({ title: "Fetching your location..." });

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setGeolocation({ latitude, longitude });
                    handleReverseGeocode(latitude, longitude);
                },
                () => {
                    toast({
                        variant: "destructive",
                        title: "Location Error",
                        description: "Could not retrieve your location. Please enable location services in your browser.",
                    });
                    form.setValue("location", "");
                    setIsLocating(false);
                }
            );
        } else {
            toast({
                variant: "destructive",
                title: "Location Error",
                description: "Geolocation is not supported by your browser.",
            });
            form.setValue("location", "");
            setIsLocating(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Soil Analysis</h1>
            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Generate Soil Analysis</CardTitle>
                        <CardDescription>Get an AI-powered soil health summary for your precise location.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <Button type="button" variant="outline" className="w-full" onClick={handleUseCurrentLocation} disabled={isLocating}>
                                    {isLocating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LocateFixed />}
                                    {isLocating ? 'Fetching Location...' : 'Use Current Location'}
                                </Button>
                                 <fieldset disabled={!geolocation || isLocating} className="space-y-4">
                                    <FormField control={form.control} name="location" render={({ field }) => (
                                        <FormItem><FormLabel>Location Name</FormLabel><FormControl><Input {...field} placeholder="Location will appear here..." readOnly /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="cropType" render={({ field }) => (
                                        <FormItem><FormLabel>Crop Type</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />

                                    <Button type="submit" className="w-full" disabled={isLoading}>
                                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Analyze Soil
                                    </Button>
                                 </fieldset>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle>AI Analysis & Map</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
                        {geolocation ? (
                             <div className="w-full h-64 rounded-lg overflow-hidden border">
                               <iframe
                                    width="100%"
                                    height="100%"
                                    loading="lazy"
                                    allowFullScreen
                                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${geolocation.longitude-0.01}%2C${geolocation.latitude-0.01}%2C${geolocation.longitude+0.01}%2C${geolocation.latitude+0.01}&layer=cyclosm&marker=${geolocation.latitude}%2C${geolocation.longitude}`}
                                ></iframe>
                            </div>
                        ) : (
                             <div className="w-full h-64 rounded-lg bg-muted flex items-center justify-center">
                                {isLocating ? <Loader2 className="h-8 w-8 animate-spin" /> : <p className="text-muted-foreground">Click the button to get your location</p>}
                            </div>
                        )}
                        {isLoading ? (
                            <div className="space-y-2">
                                <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
                                <p className="text-muted-foreground">AI is analyzing soil data...</p>
                            </div>
                        ) : analysis ? (
                            <div className="text-left w-full flex-1 overflow-y-auto bg-primary/5 p-4 rounded-lg border border-primary/20">
                                <p className="whitespace-pre-wrap text-sm">{analysis}</p>
                            </div>
                        ) : (
                            <div className="space-y-2 flex-1 flex flex-col items-center justify-center">
                                <Layers className="h-12 w-12 text-muted-foreground mx-auto" />
                                <p className="text-muted-foreground">Your analysis will appear here.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
