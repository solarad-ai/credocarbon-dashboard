"use client";

import React, { useCallback, useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FileUploadZoneProps {
    onFileAccepted: (file: File) => void;
    acceptedTypes?: string[];
    maxSizeMB?: number;
    isUploading?: boolean;
    uploadProgress?: number;
    uploadedFile?: {
        name: string;
        size: number;
        status: string;
    } | null;
    onRemoveFile?: () => void;
}

export function FileUploadZone({
    onFileAccepted,
    acceptedTypes = ['.csv', '.xlsx', '.xls'],
    maxSizeMB = 50,
    isUploading = false,
    uploadProgress = 0,
    uploadedFile = null,
    onRemoveFile,
}: FileUploadZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const validateFile = useCallback((file: File): boolean => {
        setError(null);

        // Check file extension
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!acceptedTypes.includes(extension)) {
            setError(`Invalid file type. Accepted: ${acceptedTypes.join(', ')}`);
            return false;
        }

        // Check file size
        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > maxSizeMB) {
            setError(`File too large. Maximum size: ${maxSizeMB} MB`);
            return false;
        }

        return true;
    }, [acceptedTypes, maxSizeMB]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (validateFile(file)) {
                onFileAccepted(file);
            }
        }
    }, [onFileAccepted, validateFile]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (validateFile(file)) {
                onFileAccepted(file);
            }
        }
        // Reset input so same file can be selected again
        e.target.value = '';
    }, [onFileAccepted, validateFile]);

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    // Show uploaded file state
    if (uploadedFile) {
        return (
            <Card className="border-2 border-green-200 bg-green-50">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <FileText className="h-8 w-8 text-green-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">{uploadedFile.name}</p>
                                <p className="text-sm text-gray-500">
                                    {formatFileSize(uploadedFile.size)} • {uploadedFile.status}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            {onRemoveFile && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onRemoveFile}
                                    className="text-gray-500 hover:text-red-600"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Show uploading state
    if (isUploading) {
        return (
            <Card className="border-2 border-blue-200 bg-blue-50">
                <CardContent className="p-8">
                    <div className="flex flex-col items-center justify-center gap-4">
                        <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
                        <div className="text-center">
                            <p className="font-medium text-gray-900">Uploading file...</p>
                            {uploadProgress > 0 && (
                                <p className="text-sm text-gray-500">{uploadProgress}% complete</p>
                            )}
                        </div>
                        <div className="w-full max-w-xs bg-blue-200 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <Card
                className={`border-2 border-dashed transition-colors cursor-pointer ${isDragging
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-upload')?.click()}
            >
                <CardContent className="p-8">
                    <div className="flex flex-col items-center justify-center gap-4 text-center">
                        <div className={`p-4 rounded-full ${isDragging ? 'bg-blue-100' : 'bg-gray-100'}`}>
                            <Upload className={`h-10 w-10 ${isDragging ? 'text-blue-600' : 'text-gray-400'}`} />
                        </div>
                        <div>
                            <p className="text-lg font-medium text-gray-900">
                                {isDragging ? 'Drop your file here' : 'Drag and drop your file here'}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                or <span className="text-blue-600 hover:underline">browse</span> to choose a file
                            </p>
                        </div>
                        <div className="text-xs text-gray-400 space-y-1">
                            <p>Accepted formats: {acceptedTypes.join(', ')}</p>
                            <p>Maximum file size: {maxSizeMB} MB</p>
                        </div>
                    </div>
                    <input
                        id="file-upload"
                        type="file"
                        accept={acceptedTypes.join(',')}
                        onChange={handleFileInput}
                        className="hidden"
                    />
                </CardContent>
            </Card>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
        </div>
    );
}
