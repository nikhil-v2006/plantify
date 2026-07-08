
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layers, Loader2, LocateFixed, Briefcase, Sparkles, Shield, Bug } from "lucide-react";
import { getCropRecommendation } from "@/ai/flows/get-crop-recommendation-flow";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";

type Geolocation = {
    latitude: number;
    longitude: number;
} | null;

type Recommendation = {
    name: string;
    reason: string;
    estimatedYield: string;
    potentialDiseases: string;
    recommendedPesticides: string;
};

export default function RecommendationPage() {
    const { toast } = useToast();
    const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [geolocation, setGeolocation] = useState<Geolocation>(null);
    const [isLocating, setIsLocating] = useState(false);
    const [locationName, setLocationName] = useState("");

    const handleGetRecommendations = async () => {
        if (!geolocation) {
            toast({
                variant: "destructive",
                title: "Location Required",
                description: "Please use your current location to get crop recommendations.",
            });
            return;
        }

        setIsLoading(true);
        setRecommendations(null);
        try {
            const result = await getCropRecommendation({
                latitude: geolocation.latitude,
                longitude: geolocation.longitude,
            });
            setRecommendations(result.recommendations);
        } catch (error) {
            console.error("Failed to generate recommendations:", error);
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
            const name = data.address.city || data.address.town || data.address.village || data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            setLocationName(name);
        } catch (error) {
            console.error("Reverse geocoding failed:", error);
            setLocationName(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        } finally {
            setIsLocating(false);
        }
    };

    const handleUseCurrentLocation = () => {
        setIsLocating(true);
        setGeolocation(null);
        setLocationName("Fetching location...");
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
                    setLocationName("");
                    setIsLocating(false);
                }
            );
        } else {
            toast({
                variant: "destructive",
                title: "Location Error",
                description: "Geolocation is not supported by your browser.",
            });
            setLocationName("");
            setIsLocating(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Crop Recommendation</h1>
            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Find Suitable Crops</CardTitle>
                        <CardDescription>Get AI-powered crop recommendations for your specific location.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button type="button" variant="outline" className="w-full" onClick={handleUseCurrentLocation} disabled={isLocating}>
                            {isLocating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LocateFixed />}
                            {isLocating ? 'Fetching Location...' : 'Use Current Location'}
                        </Button>
                        
                        {geolocation && (
                            <div className="p-3 rounded-md border bg-muted text-sm">
                                <p className="font-semibold">Current Location:</p>
                                <p className="text-muted-foreground">{locationName}</p>
                            </div>
                        )}

                        <Button onClick={handleGetRecommendations} className="w-full" disabled={isLoading || !geolocation}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles />}
                            Get Recommendations
                        </Button>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2 flex flex-col">
                    <CardHeader>
                        <CardTitle>AI Recommendations</CardTitle>
                        <CardDescription>Crops suggested by our AI based on your location's climate and soil profile.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
                        {isLoading ? (
                            <div className="space-y-2">
                                <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
                                <p className="text-muted-foreground">AI is analyzing your location...</p>
                            </div>
                        ) : recommendations ? (
                            <Accordion type="single" collapsible className="w-full text-left">
                                {recommendations.map((rec, index) => (
                                    <AccordionItem value={`item-${index}`} key={index}>
                                        <AccordionTrigger className="text-lg font-semibold">
                                            <div className="flex items-center gap-2">
                                                <Briefcase className="text-primary" />
                                                {rec.name}
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="space-y-4 pt-2 text-sm">
                                            <div>
                                                <h4 className="font-semibold">Reasoning</h4>
                                                <p className="text-muted-foreground">{rec.reason}</p>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold">Estimated Yield</h4>
                                                <p className="text-muted-foreground">{rec.estimatedYield}</p>
                                            </div>
                                            <Separator />
                                            <div className="p-3 rounded-md bg-accent/10 border border-accent/20 space-y-4">
                                                <div>
                                                    <h4 className="font-semibold flex items-center gap-2"><Bug className="text-accent"/> Potential Diseases & Pests</h4>
                                                    <p className="text-muted-foreground">{rec.potentialDiseases}</p>
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold flex items-center gap-2"><Shield className="text-accent"/> Recommended Treatments</h4>
                                                    <p className="text-muted-foreground">{rec.recommendedPesticides}</p>
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        ) : (
                            <div className="space-y-2">
                                <Layers className="h-12 w-12 text-muted-foreground mx-auto" />
                                <p className="text-muted-foreground">Your crop recommendations will appear here.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
