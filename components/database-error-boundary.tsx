"use client";

import React from "react";
import { useLocale, type Messages } from "@/lib/i18n";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  labels: Messages["errors"];
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Database Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold">{this.props.labels.connectionTitle}</h2>
            <p className="text-muted-foreground">
              {this.props.labels.connectionDescription}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="mt-4 rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
            >
              {this.props.labels.reloadPage}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function DatabaseErrorBoundary({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();
  return <ErrorBoundary labels={t.errors}>{children}</ErrorBoundary>;
} 
