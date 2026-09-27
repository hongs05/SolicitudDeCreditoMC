import { EstadoSolicitud } from '@credito/domain';
import { screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderizar } from '../../test/render';
import { useBancos } from '../api/catalogos';
import { BadgeEstado } from './Badge';
import { Button } from './Button';
import { Field, Input } from './Campos';
import { ConfirmDialog } from './ConfirmDialog';
import { Paginador } from './Paginador';
import { useToast } from './Toast';

describe('componentes', () => {
  it('Field conecta la etiqueta y el error con el control', () => {
    renderizar(<Field id="cedula" etiqueta="Cédula" error="El formato no es válido"><Input /></Field>);
    const control = screen.getByLabelText('Cédula');
    expect(control).toHaveAttribute('aria-invalid', 'true');
    expect(control).toHaveAccessibleDescription('El formato no es válido');
  });

  it('Button cargando queda deshabilitado', () => {
    renderizar(<Button cargando>Guardar</Button>);
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled();
  });

  it('BadgeEstado traduce el estado', () => {
    renderizar(<BadgeEstado estado={EstadoSolicitud.DESEMBOLSADA} />);
    expect(screen.getByText('Desembolsada')).toBeInTheDocument();
  });

  it('Paginador deshabilita los extremos', async () => {
    const onCambiar = vi.fn();
    const { user } = renderizar(<Paginador page={1} pageSize={20} total={45} onCambiar={onCambiar} />);
    expect(screen.getByText('Página 1 de 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(onCambiar).toHaveBeenCalledWith(2);
  });

  it('ConfirmDialog solo se muestra abierto y confirma', async () => {
    const onConfirmar = vi.fn();
    const { user, rerender } = renderizar(
      <ConfirmDialog abierto={false} titulo="T" mensaje="¿Seguro?" etiquetaConfirmar="Sí" onConfirmar={onConfirmar} onCancelar={vi.fn()} />,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    rerender(
      <ConfirmDialog abierto titulo="T" mensaje="¿Seguro?" etiquetaConfirmar="Sí" onConfirmar={onConfirmar} onCancelar={vi.fn()} />,
    );
    await user.click(screen.getByRole('button', { name: 'Sí' }));
    expect(onConfirmar).toHaveBeenCalledOnce();
  });

  it('ConfirmDialog enfoca Cancelar al abrir, cierra con Escape y atrapa el Tab', async () => {
    const onCancelar = vi.fn();
    function Envoltura() {
      const [abierto, setAbierto] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setAbierto(true)}>abrir</button>
          <ConfirmDialog
            abierto={abierto} titulo="T" mensaje="¿Seguro?" etiquetaConfirmar="Sí"
            onConfirmar={vi.fn()} onCancelar={() => { onCancelar(); setAbierto(false); }}
          />
        </>
      );
    }
    const { user } = renderizar(<Envoltura />);
    const abrir = screen.getByRole('button', { name: 'abrir' });
    abrir.focus();
    await user.click(abrir);

    const cancelar = await screen.findByRole('button', { name: 'Cancelar' });
    expect(cancelar).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: 'Sí' })).toHaveFocus();
    await user.tab();
    expect(cancelar).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Sí' })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(onCancelar).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(abrir).toHaveFocus();
  });

  it('useToast muestra avisos accesibles', async () => {
    function Emisor() {
      const toast = useToast();
      return <button type="button" onClick={() => toast.exito('Listo')}>emitir</button>;
    }
    const { user } = renderizar(<Emisor />);
    await user.click(screen.getByText('emitir'));
    expect(await screen.findByRole('status')).toHaveTextContent('Listo');
  });

  it('useBancos carga el catálogo', async () => {
    function Lista() {
      const { data } = useBancos();
      return <ul>{data?.map((b) => <li key={b.id}>{b.nombre}</li>)}</ul>;
    }
    renderizar(<Lista />, { usuario: { id: 1, username: 'cajero', rol: 'CAJERO' as never } });
    expect(await screen.findByText('BAC Credomatic')).toBeInTheDocument();
  });
});
