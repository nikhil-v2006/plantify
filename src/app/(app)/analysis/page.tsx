
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { AlertCircle, Bot, CheckCircle, FileUp, Loader2, Camera, Video, Image as ImageIcon, Download } from "lucide-react";
import { provideCustomizedPesticideRecommendation } from "@/ai/flows/provide-customized-pesticide-recommendation-flow";
import { analyzeHyperspectralImage } from "@/ai/flows/analyze-hyperspectral-image-flow";
import { useToast } from "@/hooks/use-toast";
import { useHistory } from "@/hooks/use-history";
import type { Checkup } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

type AnalysisState = 'idle' | 'analyzing' | 'complete' | 'error';
type AnalysisType = 'camera' | 'normalImage' | 'hyperspectral' | null;

type Recommendation = {
    diseaseDetected: string;
    cropType: string;
    pesticideRecommendation: string;
    reasoning: string;
} | null;

type HyperspectralAnalysis = {
    report: string;
} | null;

export default function AnalysisPage() {
    const { toast } = useToast();
    const { addHistoryItem } = useHistory();
    const [analysisState, setAnalysisState] = useState<AnalysisState>('idle');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [recommendation, setRecommendation] = useState<Recommendation>(null);
    const [hyperspectralAnalysis, setHyperspectralAnalysis] = useState<HyperspectralAnalysis>(null);
    const [error, setError] = useState<string | null>(null);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [analysisType, setAnalysisType] = useState<AnalysisType>(null);
    const [file, setFile] = useState<File | null>(null);
    const [soilType, setSoilType] = useState<string>("");
    const [reportTimestamp, setReportTimestamp] = useState<string>('');


    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const normalImageInputRef = useRef<HTMLInputElement>(null);
    const hyperspectralInputRef = useRef<HTMLInputElement>(null);
    const reportRef = useRef<HTMLDivElement>(null);

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraActive(false);
    };
    
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && isCameraActive) {
                stopCamera();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            stopCamera();
        }
      }, [isCameraActive]);
    
    const handleActivateCamera = async () => {
        resetState();
        setAnalysisType('camera');
        
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                setHasCameraPermission(true);
                setIsCameraActive(true);
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (error) {
                console.error('Error accessing camera:', error);
                setHasCameraPermission(false);
                setIsCameraActive(false);
                toast({
                    variant: 'destructive',
                    title: 'Camera Access Denied',
                    description: 'Please enable camera permissions in your browser settings.',
                });
            }
        } else {
            setHasCameraPermission(false);
            toast({
                variant: 'destructive',
                title: 'Camera Not Supported',
                description: 'Your browser does not support camera access.',
            });
        }
    };

    const resetState = () => {
        if(isCameraActive) stopCamera();

        setAnalysisState('idle');
        setPreviewUrl(null);
        setRecommendation(null);
        setHyperspectralAnalysis(null);
        setError(null);
        setAnalysisType(null);
        setFile(null);
        setSoilType("");
        if (normalImageInputRef.current) normalImageInputRef.current.value = "";
        if (hyperspectralInputRef.current) hyperspectralInputRef.current.value = "";
    }

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                const dataUrl = canvas.toDataURL('image/png');
                setPreviewUrl(dataUrl);
                stopCamera();
            }
        }
    };
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'normalImage' | 'hyperspectral') => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            resetState();
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreviewUrl(e.target?.result as string);
            };
            reader.readAsDataURL(selectedFile);
            setFile(selectedFile);
            setAnalysisType(type);
        }
    };

    const determineStatus = (disease: string): Checkup['status'] => {
        if (disease === 'None' || disease.toLowerCase().includes('healthy')) return 'Healthy';
        if (disease.toLowerCase().includes('early') || disease.toLowerCase().includes('mild')) return 'At Risk';
        return 'Diseased';
    }

    const handleAnalyze = async () => {
        if (!previewUrl || (analysisType !== 'hyperspectral' && !soilType)) {
             toast({
                variant: "destructive",
                title: "Missing Information",
                description: "Please capture/upload an image and select a soil type before starting the analysis.",
            });
            return;
        }
        
        setAnalysisState('analyzing');
        setError(null);
        setReportTimestamp(new Date().toLocaleString());
        
        if (!previewUrl) return;

        if (analysisType === 'camera' || analysisType === 'normalImage') {
            try {
                const result = await provideCustomizedPesticideRecommendation({
                    imageData: previewUrl,
                    plantType: 'Unknown',
                    soilType: soilType,
                    location: 'Unknown'
                });
                setRecommendation(result);
                setAnalysisState('complete');
                addHistoryItem({
                    name: `${analysisType === 'camera' ? 'Camera' : 'Image'} Scan`,
                    cropType: result.cropType,
                    disease: result.diseaseDetected,
                    status: determineStatus(result.diseaseDetected),
                    imageUrl: previewUrl
                });

            } catch (e) {
                console.error(e);
                setError("Failed to get recommendation from AI. Please try again.");
                setAnalysisState('error');
            }
        } else if (analysisType === 'hyperspectral' && file) {
             try {
                const result = await analyzeHyperspectralImage({
                    imageData: previewUrl, // Data URI from file reader
                    fileName: file.name
                });
                setHyperspectralAnalysis(result);
                setAnalysisState('complete');
                addHistoryItem({
                    name: `Hyperspectral: ${file.name}`,
                    cropType: 'Unknown',
                    disease: "See Report",
                    status: 'At Risk',
                    imageUrl: '/file-icon.svg'
                });
            } catch (e) {
                console.error(e);
                setError("Failed to analyze hyperspectral image. Please try again.");
                setAnalysisState('error');
            }
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
            
            pdf.save(`FieldMaster_Analysis_${new Date().toISOString().split('T')[0]}.pdf`);
        });
    };
    
    const getAnalysisButtonText = () => {
        if (analysisState === 'analyzing') return 'Analyzing...';
        switch (analysisType) {
            case 'camera': return 'Analyze Captured Image';
            case 'normalImage': return 'Analyze Uploaded Leaf';
            case 'hyperspectral': return 'Analyze Hyperspectral Image';
            default: return 'Analyze';
        }
    }
    
    const renderPreview = () => {
        const imagePreview = previewUrl ? <Image src={previewUrl} alt="Analysis Preview" width={400} height={225} className="rounded-lg object-cover w-full" /> : null;
        
        if (analysisType === 'camera' || analysisType === 'normalImage') {
            return imagePreview;
        }
        if (analysisType === 'hyperspectral') {
             if (file) {
                 return (
                     <div className="p-4 rounded-lg bg-muted border text-left">
                         <p className="font-semibold text-sm">File for analysis:</p>
                         <p className="text-xs text-muted-foreground truncate">{file.name}</p>
                     </div>
                 );
             }
             return null;
        }
        // Fallback for when analysis is complete
        if (recommendation && previewUrl) {
            return <Image src={previewUrl} alt="Analysis Preview" width={400} height={225} className="rounded-lg object-cover w-full" />;
        }
        if (hyperspectralAnalysis && file) {
            return (
                 <div className="p-4 rounded-lg bg-muted border text-left">
                     <p className="font-semibold text-sm">Analyzed file:</p>
                     <p className="text-xs text-muted-foreground truncate">{file.name}</p>
                 </div>
            )
        }

        return null;
    }


    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Leaf Analysis</h1>
            {hasCameraPermission === false && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Camera Access Required</AlertTitle>
                    <AlertDescription>
                        To use the camera scanning feature, please allow camera access in your browser's settings for this site.
                    </AlertDescription>
                </Alert>
            )}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Live Camera Scan</CardTitle>
                        <CardDescription>Scan a crop leaf with your device's camera.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden border bg-muted flex items-center justify-center">
                            <video ref={videoRef} className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`} autoPlay muted playsInline />
                            <canvas ref={canvasRef} className="hidden" />
                            {!isCameraActive && (
                                <div className="absolute text-center text-muted-foreground p-4">
                                    <Camera className="mx-auto h-12 w-12 mb-2" />
                                     <p>Activate camera to start scanning.</p>
                                </div>
                            )}
                        </div>
                        {isCameraActive ? (
                            <Button onClick={handleCapture} disabled={hasCameraPermission !== true} className="w-full">
                                <Camera className="mr-2" /> Capture Image
                            </Button>
                        ) : (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button className="w-full">
                                        <Camera className="mr-2" /> Activate Camera
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                     <AlertDialogHeader>
                                        <AlertDialogTitle>Ready to Scan?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will request permission to activate your device's camera. Please position the crop leaf in the frame.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleActivateCamera}>Continue</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Normal Image Upload</CardTitle>
                        <CardDescription>Upload a standard image file (JPG, PNG).</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="flex flex-col items-center justify-center w-full h-full">
                            <label htmlFor="normal-image-upload" className="flex flex-col items-center justify-center w-full h-full aspect-video border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">
                                <div className="flex flex-col items-center justify-center text-center p-4">
                                    <ImageIcon className="w-8 h-8 mb-2 text-muted-foreground" />
                                    <p className="mb-2 text-sm text-muted-foreground">
                                        <span className="font-semibold">Click to upload</span>
                                    </p>
                                    <p className="text-xs text-muted-foreground">Standard leaf photo</p>
                                </div>
                                <input id="normal-image-upload" ref={normalImageInputRef} type="file" className="hidden" accept="image/png, image/jpeg" onChange={(e) => handleFileChange(e, 'normalImage')} />
                            </label>
                        </div> 
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Hyperspectral Upload</CardTitle>
                        <CardDescription>Upload a hyperspectral image for analysis.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="flex flex-col items-center justify-center w-full h-full">
                            <label htmlFor="hyperspectral-image-upload" className="flex flex-col items-center justify-center w-full h-full aspect-video border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">
                                <div className="flex flex-col items-center justify-center text-center p-4">
                                    <FileUp className="w-8 h-8 mb-2 text-muted-foreground" />
                                    <p className="mb-2 text-sm text-muted-foreground">
                                        <span className="font-semibold">Click to upload</span>
                                    </p>
                                    <p className="text-xs text-muted-foreground">Hyperspectral data file</p>
                                </div>
                                <input id="hyperspectral-image-upload" ref={hyperspectralInputRef} type="file" className="hidden" onChange={(e) => handleFileChange(e, 'hyperspectral')} />
                            </label>
                        </div> 
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                     <div className="space-y-1.5">
                        <CardTitle>Analysis & Recommendation</CardTitle>
                        <CardDescription>Results from the AI analysis will appear below.</CardDescription>
                    </div>
                    {analysisState === 'complete' && (
                        <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center text-center p-6 space-y-4 min-h-[300px]">
                    {analysisState === 'idle' && !previewUrl && (
                        <>
                            <Video className="h-12 w-12 text-muted-foreground" />
                            <p className="text-muted-foreground">Capture or upload an image to start analysis.</p>
                        </>
                    )}
                    {previewUrl && analysisState === 'idle' && (
                         <div className="w-full max-w-md mx-auto space-y-4">
                            {renderPreview()}
                            {analysisType !== 'hyperspectral' && (
                                <div className="grid w-full items-center gap-1.5">
                                    <Label htmlFor="soil-type">Soil Type (for context)</Label>
                                    <Select onValueChange={setSoilType} value={soilType}>
                                        <SelectTrigger id="soil-type">
                                            <SelectValue placeholder="Select soil type..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Sandy">Sandy</SelectItem>
                                            <SelectItem value="Clay">Clay</SelectItem>
                                            <SelectItem value="Silt">Silt</SelectItem>
                                            <SelectItem value="Loam">Loam</SelectItem>
                                            <SelectItem value="Peat">Peat</SelectItem>
                                            <SelectItem value="Chalky">Chalky</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                             <Button onClick={handleAnalyze} disabled={analysisState === 'analyzing' || (!previewUrl)} className="w-full">
                                 {analysisState === 'analyzing' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                 {getAnalysisButtonText()}
                             </Button>
                         </div>
                    )}
                    {analysisState === 'analyzing' && (
                        <>
                            <Loader2 className="h-12 w-12 text-primary animate-spin" />
                            <p className="text-muted-foreground">Consulting AI...</p>
                        </>
                    )}
                    {analysisState === 'error' && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Analysis Failed</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    {analysisState === 'complete' && (
                         <div ref={reportRef} className="text-left w-full bg-background p-6 rounded-lg space-y-4">
                            <h2 className="text-xl font-bold text-primary">Field Master Analysis Report</h2>
                            <p data-pdf-timestamp style={{ display: 'none' }} className="text-xs text-muted-foreground">Generated on: {reportTimestamp}</p>
                            <div className="grid md:grid-cols-2 gap-8 w-full">
                                <div className="space-y-4">
                                    <h3 className="font-semibold">Analyzed Input</h3>
                                    {renderPreview()}
                                </div>
                                <div className="w-full text-left space-y-6">
                                    {recommendation && (
                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="font-semibold">Crop Type</h3>
                                                <p>{recommendation.cropType}</p>
                                            </div>
                                            <Separator />
                                            <div>
                                                <h3 className="font-semibold flex items-center gap-2 mb-2"><CheckCircle className="text-primary"/> Disease Detected</h3>
                                                <p className="font-bold text-lg">{recommendation.diseaseDetected}</p>
                                            </div>
                                            <Separator />
                                            <div>
                                                <h3 className="font-semibold flex items-center gap-2 mb-2"><Bot className="text-primary"/> AI Recommended Cure</h3>
                                                <div className="space-y-4 text-sm p-4 bg-primary/5 rounded-lg border border-primary/20">
                                                    <div>
                                                        <h4 className="font-medium">Recommended Treatment:</h4>
                                                        <p>{recommendation.pesticideRecommendation}</p>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium">Reasoning:</h4>
                                                        <p>{recommendation.reasoning}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {hyperspectralAnalysis && (
                                        <div>
                                            <h3 className="font-semibold flex items-center gap-2 mb-2"><Bot className="text-primary"/> Hyperspectral Analysis Report</h3>
                                            <div className="space-y-4 text-sm p-4 bg-primary/5 rounded-lg border border-primary/20 whitespace-pre-wrap">
                                                {hyperspectralAnalysis.report}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                         </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
