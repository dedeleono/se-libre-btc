"use client";

import React, {
  useCallback,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { Button } from "./ui/button";
import { Loader2, Upload, File, X, AlertCircle } from "lucide-react";
import { Progress } from "./ui/progress";
import { Alert, AlertDescription } from "./ui/alert";
import { motion, AnimatePresence } from "framer-motion";

interface S3FileUploadProps {
  onUploadComplete: (url: string) => void;
  onUploadError?: (error: Error) => void;
  acceptedFileTypes?: string[];
  maxFileSize?: number;
  type: "video" | "image" | "document" | "mixed";
  value?: string | null;
  onChange?: (url: string | null) => void;
  variant?: "profile" | "default";
}

export interface S3FileUploadRef {
  stopUpload: () => void;
}

export const S3FileUpload = forwardRef<S3FileUploadRef, S3FileUploadProps>(
  (
    {
      onUploadComplete,
      onUploadError,
      acceptedFileTypes = ["image/*", "video/*", "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword"],
      maxFileSize = 100 * 1024 * 1024, // 100MB
      type,
    },
    ref
  ) => {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({
      stopUpload: () => {
        setIsUploading(false);
        setUploadProgress(0);
        setError(null);
      },
    }));

    const onDrop = useCallback(
      async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;
        
        // Check file size explicitly
        if (file.size > maxFileSize) {
          setError(`El archivo es demasiado grande. El tamaño máximo es ${Math.round(maxFileSize / (1024 * 1024))}MB.`);
          return;
        }
        
        setIsUploading(true);
        setUploadProgress(0);
        setError(null);

        // Try direct upload first, then fall back to server-side upload if it fails
        try {
          // Step 1: Get a presigned URL from our API
          const presignedUrlResponse = await axios.post("/api/s3/presigned-url", {
            fileName: file.name,
            contentType: file.type,
            fileType: type
          });
          
          const { presignedUrl, fileUrl } = presignedUrlResponse.data;
          
          try {
            // Step 2: Try direct upload to S3 using the presigned URL
            await axios.put(presignedUrl, file, {
              headers: {
                "Content-Type": file.type,
              },
              onUploadProgress: (progressEvent) => {
                const progress = (progressEvent.loaded / progressEvent.total!) * 100;
                setUploadProgress(progress);
              },
            });
            
            // Step 3: Return the CloudFront URL if direct upload succeeds
            onUploadComplete(fileUrl);
            setIsUploading(false);
            setUploadProgress(0);
            return;
          } catch (directUploadError) {
            // If direct upload fails due to CORS, fall back to server-side upload
            console.warn("Direct S3 upload failed, falling back to server-side upload:", directUploadError);
          }
        } catch (presignedUrlError) {
          console.warn("Failed to get presigned URL, falling back to server-side upload:", presignedUrlError);
        }
        
        // Fall back to server-side upload
        try {
          // Reset progress for the new upload attempt
          setUploadProgress(0);
          
          const formData = new FormData();
          formData.append("file", file);
          formData.append("type", type);
          
          const response = await axios.post("/api/s3/asset-upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
            onUploadProgress: (progressEvent) => {
              const progress = (progressEvent.loaded / progressEvent.total!) * 100;
              setUploadProgress(progress);
            },
          });
          
          onUploadComplete(response.data.url);
          setIsUploading(false);
          setUploadProgress(0);
        } catch (error: any) {
          console.error("Server upload error:", error);
          console.error("Error details:", {
            name: error.name,
            message: error.message,
            stack: error.stack,
            code: error.code
          });
          
          // More detailed error message
          let errorMessage = "Error al subir el archivo. Por favor, intenta de nuevo.";
          
          if (error.response) {
            // Server responded with a status code outside of 2xx range
            console.error("Response error:", {
              status: error.response.status,
              statusText: error.response.statusText,
              data: error.response.data,
              headers: error.response.headers
            });
            if (error.response.status === 413) {
              errorMessage = "El archivo es demasiado grande para ser procesado por el servidor.";
            } else if (error.response.data?.error) {
              errorMessage = error.response.data.error;
            } else {
              errorMessage = `Error del servidor: ${error.response.status} ${error.response.statusText}`;
            }
          } else if (error.request) {
            // Request was made but no response received
            console.error("Request error:", {
              method: error.config?.method,
              url: error.config?.url,
              baseURL: error.config?.baseURL,
              timeout: error.config?.timeout,
              headers: error.config?.headers
            });
            errorMessage = `No se pudo conectar con el servidor. Verifica tu conexión. URL: ${error.config?.url || 'desconocida'}`;
          }
          
          setError(errorMessage);
          if (onUploadError) {
            onUploadError(error as Error);
          }
          setIsUploading(false);
          setUploadProgress(0);
        }
      },
      [onUploadComplete, onUploadError, type, maxFileSize]
    );

    const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
      onDrop,
      accept: acceptedFileTypes.reduce<Record<string, string[]>>(
        (acc, curr) => ({ ...acc, [curr]: [] }),
        {}
      ),
      maxSize: maxFileSize,
      multiple: false,
      onDropRejected: (rejections) => {
        const rejection = rejections[0];
        if (rejection) {
          const errorCode = rejection.errors[0]?.code;
          if (errorCode === 'file-too-large') {
            setError(`El archivo es demasiado grande. El tamaño máximo es ${Math.round(maxFileSize / (1024 * 1024))}MB.`);
          } else if (errorCode === 'file-invalid-type') {
            setError(`Tipo de archivo no permitido. Formatos aceptados: ${acceptedFileTypes.join(', ')}`);
          } else {
            setError('El archivo no cumple con los requisitos.');
          }
        }
      }
    });

    return (
      <div className="space-y-4">
        <div
          {...getRootProps()}
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            transition-colors duration-200 ease-in-out
            ${isDragActive 
              ? "border-primary bg-primary/5 dark:bg-primary/10" 
              : "border-gray-300 dark:border-white/[0.1] hover:border-primary/50 dark:hover:border-primary/50"
            }
            ${isUploading ? "pointer-events-none opacity-70" : ""}
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            {isUploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <Upload className="h-8 w-8 text-muted-foreground" />
            )}
            <div className="text-sm text-muted-foreground">
              {isUploading 
                ? "Subiendo archivo..." 
                : isDragActive 
                  ? "Suelta el archivo aquí" 
                  : "Arrastra y suelta un archivo aquí, o haz clic para seleccionar"
              }
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isUploading && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progreso de subida</span>
                <span className="font-medium">{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

S3FileUpload.displayName = "S3FileUpload";