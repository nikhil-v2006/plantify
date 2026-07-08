
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useHistory } from "@/hooks/use-history";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Image from "next/image";

export default function HistoryPage() {
    const { history, isHistoryLoading } = useHistory();

    const getBadgeVariant = (status: 'Healthy' | 'At Risk' | 'Diseased'): "default" | "secondary" | "destructive" | "outline" => {
        switch (status) {
            case 'Healthy': return 'default';
            case 'At Risk': return 'secondary';
            case 'Diseased': return 'destructive';
            default: return 'outline';
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Checkup History</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Analysis Log</CardTitle>
                    <CardDescription>A log of all past field and leaf analyses.</CardDescription>
                </CardHeader>
                <CardContent>
                    <TooltipProvider>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Checkup Name</TableHead>
                                    <TableHead>Image</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Crop Type</TableHead>
                                    <TableHead>Disease Detected</TableHead>
                                    <TableHead className="text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isHistoryLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-10 w-10 rounded-md" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                            <TableCell className="text-right"><Skeleton className="h-6 w-16 inline-block" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : history.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            No analysis history found. Perform an analysis on the "Leaf Analysis" page.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    history.map((checkup) => (
                                        <TableRow key={checkup.id}>
                                            <TableCell className="font-medium">{checkup.name}</TableCell>
                                            <TableCell>
                                                {checkup.imageUrl && (
                                                     <Tooltip>
                                                        <TooltipTrigger>
                                                            <Image
                                                                src={checkup.imageUrl}
                                                                alt={checkup.name}
                                                                width={40}
                                                                height={40}
                                                                className="rounded-md object-cover"
                                                            />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <Image
                                                                src={checkup.imageUrl}
                                                                alt={checkup.name}
                                                                width={200}
                                                                height={200}
                                                                className="rounded-md object-cover"
                                                            />
                                                        </TooltipContent>
                                                    </Tooltip>
                                                )}
                                            </TableCell>
                                            <TableCell>{checkup.date}</TableCell>
                                            <TableCell>{checkup.cropType}</TableCell>
                                            <TableCell>{checkup.disease === 'None' ? '—' : checkup.disease}</TableCell>
                                            <TableCell className="text-right">
                                                <Badge
                                                    className={
                                                        checkup.status === 'Healthy'
                                                            ? 'bg-primary/80 text-primary-foreground'
                                                            : ''
                                                    }
                                                    variant={getBadgeVariant(checkup.status)}
                                                >
                                                    {checkup.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TooltipProvider>
                </CardContent>
            </Card>
        </div>
    );
}
