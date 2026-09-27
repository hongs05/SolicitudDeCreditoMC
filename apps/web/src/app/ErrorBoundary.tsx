import { Component, type ReactNode } from 'react';

export class ErrorBoundary extends Component<{ mensaje: string; children: ReactNode }, { fallo: boolean }> {
  state = { fallo: false };

  static getDerivedStateFromError() {
    return { fallo: true };
  }

  componentDidCatch(error: unknown) {
    console.error(error);
  }

  render() {
    if (this.state.fallo) return <p role="alert" className="p-6 text-red-700">{this.props.mensaje}</p>;
    return this.props.children;
  }
}
