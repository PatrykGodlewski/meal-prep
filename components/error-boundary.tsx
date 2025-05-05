"use client";

import React, { type ErrorInfo } from "react";

export type ErrorBoundaryProps = React.PropsWithChildren & {
  fallback?: React.ReactNode;
  key?: string;
  dataTestId?: string;
};

type State = {
  hasError: boolean;
  error?: Error | undefined;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, State> {
  public state: State = {
    hasError: false,
  };
  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = { hasError: false };
  }

  resetErrorBoundary = () => this.setState({ hasError: false });

  componentDidUpdate(
    prevProps: Readonly<ErrorBoundaryProps>,
    _prevState: Readonly<State>,
    _snapshot?: unknown,
  ): void {
    if (prevProps.key !== this.props.key) {
      this.resetErrorBoundary();
    }
  }

  static getDerivedStateFromError(error: Error) {
    console.error(error);
    console.log(error);
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(error, errorInfo);
    console.log(error, errorInfo);
    return;
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      try {
        return <ErrorBoundary>{this.props.fallback}</ErrorBoundary>;
      } catch (err: unknown) {
        if (process.env.NODE_ENV === "development") {
          return;
        }
      }
    }

    return (
      <div data-test-id={this.props.dataTestId || "error-boundary"}>
        <h2>
          "Client side error"{" "}
          {this.state.error instanceof Error ? this.state.error.message : ""}
        </h2>
      </div>
    );
  }
}
