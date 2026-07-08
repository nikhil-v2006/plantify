
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Droplets, Loader2, Sparkles, Sprout, TestTube2, Wind, Bug } from "lucide-react";
import { predictYield, type PredictYieldOutput } from "@/ai/flows/predict-yield-flow";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  cropType: z.string().min(2, { message: "Crop type is required." }),
  fieldSize: z.string().min(1, { message: "Field size is required." }),
  soilHealth: z.string().min(10, { message: "Please describe soil health." }),
  weatherForecast: z.string().min(10, { message: "Please provide a weather forecast." }),
  irrigation: z.string().min(10, { message: "Please describe irrigation methods." }),
  fertilization: z.string().min(10, { message: "Please describe the fertilization plan." }),
  pestControl: z.string().min(10, { message: "Please describe pest control measures." }),
  historicalYield: z.string().min(1, { message: "Historical yield is required." }),
});

export default function YieldPredictionPage() {
    const { toast } = useToast();
    const [prediction, setPrediction] = useState<PredictYieldOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            cropType: "",
            fieldSize: "",
            soilHealth: "pH: 6.5, Organic Matter: 3%, Nitrogen: High, Phosphorus: Medium",
            weatherForecast: "Mild season with moderate rainfall expected. Average temperature: 25°C.",
            irrigation: "Drip irrigation, twice a week.",
            fertilization: "NPK 10-10-10 applied at planting. Second application planned mid-season.",
            pestControl: "Preventative neem oil spray every 3 weeks.",
            historicalYield: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        setPrediction(null);
        try {
            const result = await predictYield(values);
            setPrediction(result);
        } catch (error) {
            console.error("Failed to generate prediction:", error);
            toast({
                variant: "destructive",
                title: "Prediction Failed",
                description: "Could not connect to the AI service. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Crop Yield Prediction</h1>
            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Enter Field Data</CardTitle>
                        <CardDescription>Provide details about your field to get an AI-powered yield prediction and optimization plan.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="cropType" render={({ field }) => (
                                        <FormItem><FormLabel>Crop Type</FormLabel><FormControl><Input placeholder="e.g., Corn, Wheat" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                     <FormField control={form.control} name="fieldSize" render={({ field }) => (
                                        <FormItem><FormLabel>Field Size</FormLabel><FormControl><Input placeholder="e.g., 10 acres" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                                <FormField control={form.control} name="soilHealth" render={({ field }) => (
                                    <FormItem><FormLabel>Soil Health Metrics</FormLabel><FormControl><Textarea {...field} rows={3} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="weatherForecast" render={({ field }) => (
                                    <FormItem><FormLabel>Weather Forecast</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="irrigation" render={({ field }) => (
                                    <FormItem><FormLabel>Irrigation Plan</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="fertilization" render={({ field }) => (
                                    <FormItem><FormLabel>Fertilization Plan</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="pestControl" render={({ field }) => (
                                    <FormItem><FormLabel>Pest Control</FormLabel><FormControl><Textarea {...field} rows={2} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="historicalYield" render={({ field }) => (
                                    <FormItem><FormLabel>Historical Yield</FormLabel><FormControl><Input placeholder="e.g., 4 tons/acre" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2" />}
                                    Predict Yield & Optimize
                                 </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle>AI Prediction & Recommendations</CardTitle>
                         <CardDescription>Your generated report will appear below.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col items-center justify-center text-center p-6">
                        {isLoading ? (
                            <div className="space-y-2">
                                <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
                                <p className="text-muted-foreground">AI is running simulations...</p>
                            </div>
                        ) : prediction ? (
                            <div className="text-left w-full h-full space-y-6">
                                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-center">
                                    <h3 className="text-lg font-semibold text-primary">Predicted Yield</h3>
                                    <p className="text-3xl font-bold">{prediction.predictedYield}</p>
                                </div>
                                 <Separator />
                                <div className="space-y-4">
                                     <h3 className="text-lg font-semibold text-left">Optimization Plan</h3>
                                    <div className="p-4 rounded-lg bg-muted/50 border">
                                        <h4 className="font-semibold flex items-center gap-2 mb-2"><Droplets className="text-primary"/> Irrigation</h4>
                                        <p className="text-sm text-muted-foreground">{prediction.recommendations.irrigation}</p>
                                    </div>
                                     <div className="p-4 rounded-lg bg-muted/50 border">
                                        <h4 className="font-semibold flex items-center gap-2 mb-2"><Sprout className="text-primary"/> Fertilization</h4>
                                        <p className="text-sm text-muted-foreground">{prediction.recommendations.fertilization}</p>
                                    </div>
                                     <div className="p-4 rounded-lg bg-muted/50 border">
                                        <h4 className="font-semibold flex items-center gap-2 mb-2"><Bug className="text-primary"/> Pest Control</h4>
                                        <p className="text-sm text-muted-foreground">{prediction.recommendations.pestControl}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <TestTube2 className="h-12 w-12 text-muted-foreground mx-auto" />
                                <p className="text-muted-foreground">Your yield prediction will appear here.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
