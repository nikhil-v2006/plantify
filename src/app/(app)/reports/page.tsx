"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FileText, Loader2, Download, ImageUp, LocateFixed } from "lucide-react";
import { generateRiskAssessmentReport } from "@/ai/flows/generate-risk-assessment-report-flow";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const formSchema = z.object({
  location: z.string().min(2, { message: "Location is required." }),
});

export default function ReportsPage() {
    const { toast } = useToast();
    const [report, setReport] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [reportImage, setReportImage] = useState<string | null>(null);
    const [reportTimestamp, setReportTimestamp] = useState<string>('');
    const reportRef = useRef<HTMLDivElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [isLocating, setIsLocating] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            location: "",
        },
    });
    
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
        form.setValue("location", "Fetching location...");
        toast({ title: "Fetching your location..." });

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
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

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!reportImage) {
            toast({
                variant: 'destructive',
                title: 'Image Required',
                description: 'Please upload an image for the report.',
            });
            return;
        }

        setIsLoading(true);
        setReport(null);
        try {
            const result = await generateRiskAssessmentReport({
                imageData: reportImage,
                location: values.location,
            });
            setReport(result.report);
            setReportTimestamp(new Date().toLocaleString());
        } catch (error) {
            console.error("Failed to generate report:", error);
            toast({
                variant: "destructive",
                title: "Report Generation Failed",
                description: "Could not connect to the AI service.",
            });
        } finally {
            setIsLoading(false);
        }
    }
    
    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setReportImage(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDownloadPdf = () => {
        const input = reportRef.current;
        if (!input) return;

        const timestampEl = input.querySelector('[data-pdf-timestamp]') as HTMLElement | null;
        if (timestampEl) timestampEl.style.display = 'block';

        html2canvas(input, { scale: 2, useCORS: true }).then(canvas => {
            if (timestampEl) timestampEl.style.display = 'none'; 

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'px', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasHeight / canvasWidth;
            const pdfHeight = pdfWidth * ratio;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            
            pdf.save(`FieldMaster_Risk_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        });
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Risk Assessment Reports</h1>
            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Generate Report</CardTitle>
                        <CardDescription>Upload an image and provide the location to generate an AI-powered risk assessment.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                
                                <div>
                                    <FormLabel>Reference Image</FormLabel>
                                    <div className="mt-2">
                                        <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">
                                            {reportImage ? (
                                                <Image src={reportImage} alt="Uploaded preview" width={128} height={128} className="h-full w-auto object-contain rounded-lg py-1" />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center text-center p-4">
                                                    <ImageUp className="w-8 h-8 mb-2 text-muted-foreground" />
                                                    <p className="text-sm text-muted-foreground">
                                                        <span className="font-semibold">Click to upload image</span>
                                                    </p>
                                                </div>
                                            )}
                                        </label>
                                        <input id="image-upload" ref={imageInputRef} type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleImageChange} />
                                    </div>
                                </div>

                                <FormField control={form.control} name="location" render={({ field }) => (
                                    <FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />

                                 <Button type="button" variant="outline" className="w-full" onClick={handleUseCurrentLocation} disabled={isLocating}>
                                    {isLocating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LocateFixed className="mr-2 h-4 w-4" />}
                                    {isLocating ? 'Fetching Location...' : 'Use Current Location'}
                                </Button>

                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Generate Report
                                 </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
                <Card className="flex flex-col">
                    <CardHeader className="flex flex-row items-start justify-between">
                        <div className="space-y-1.5">
                            <CardTitle>Generated Report</CardTitle>
                             {report && <CardDescription>Review the AI-generated report below.</CardDescription>}
                        </div>
                        {report && (
                            <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
                                <Download className="mr-2 h-4 w-4" />
                                Download PDF
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col items-center justify-center text-center p-6">
                        {isLoading ? (
                            <div className="space-y-2">
                                <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
                                <p className="text-muted-foreground">AI is generating your report...</p>
                            </div>
                        ) : report ? (
                             <div className="h-full w-full overflow-y-auto">
                                <div ref={reportRef} className="text-left w-full bg-primary/5 p-6 rounded-lg border border-primary/20 space-y-4">
                                    <h2 className="text-xl font-bold text-primary">Field Master Risk Assessment Report</h2>
                                    <p data-pdf-timestamp style={{ display: 'none' }} className="text-xs text-muted-foreground">Generated on: {reportTimestamp}</p>
                                    
                                    {reportImage && (
                                        <div className="my-4">
                                            <h3 className="font-semibold mb-2">Reference Image</h3>
                                            <Image src={reportImage} alt="Report reference" width={200} height={200} className="rounded-md border" />
                                        </div>
                                    )}
                                    <p className="whitespace-pre-wrap text-sm">{report}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
                                <p className="text-muted-foreground">Your report will appear here.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
