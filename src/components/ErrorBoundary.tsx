// @ts-nocheck
import React, { Component, ReactNode } from "react";
import { AlertCircle } from "lucide-react";

export class ErrorBoundary extends Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  public static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="p-6 border border-red-500/30 bg-red-500/10 rounded-xl flex items-center gap-4 text-red-500">
          <AlertCircle className="w-8 h-8 shrink-0" />
          <div>
            <h3 className="font-semibold text-lg">Something went wrong</h3>
            <p className="text-sm opacity-80">{this.state.error?.message}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
