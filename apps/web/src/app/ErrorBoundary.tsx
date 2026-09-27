import { Component, type ReactNode } from 'react';
import { claseBoton } from '../shared/ui/Button';
import { PaginaError } from '../shared/ui/PaginaError';

interface Props { mensaje: string; detalleTecnico?: string; texto?: string; inicio?: string; children: ReactNode }

export class ErrorBoundary extends Component<Props, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: unknown) {
    console.error(error);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div role="alert">
        <PaginaError
          codigo="!" icono="bicho" tono="grave" titulo={this.props.mensaje} texto={this.props.texto ?? ''}
          detalle={<details className="max-w-[60ch] text-left text-xs text-muted"><summary className="cursor-pointer">{this.props.detalleTecnico}</summary><code className="font-mono">{error.message}</code></details>}
          acciones={this.props.inicio ? <a href="/" className={claseBoton()}>{this.props.inicio}</a> : undefined}
        />
      </div>
    );
  }
}
