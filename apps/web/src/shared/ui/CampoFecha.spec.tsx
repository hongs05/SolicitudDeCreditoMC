import { screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderizar } from '../../test/render';
import { CampoFecha, type CampoFechaProps } from './CampoFecha';

function Controlado({ inicial = '', onCambio = () => undefined, ...props }: Partial<CampoFechaProps> & { inicial?: string; onCambio?(v: string): void }) {
  const [valor, setValor] = useState(inicial);
  return (
    <>
      <label htmlFor="f">Fecha</label>
      <CampoFecha id="f" value={valor} onChange={(v) => { setValor(v); onCambio(v); }} {...props} />
      <button type="button" onClick={() => setValor('2001-12-24')}>Poner fecha</button>
      <output aria-label="valor">{valor}</output>
    </>
  );
}

describe('CampoFecha', () => {
  it('agrega las barras al escribir y entrega la fecha ISO', async () => {
    const { user } = renderizar(<Controlado />);
    await user.type(screen.getByLabelText('Fecha'), '15031990');
    expect(screen.getByLabelText('Fecha')).toHaveValue('15/03/1990');
    expect(screen.getByLabelText('valor')).toHaveTextContent('1990-03-15');
  });

  it('entrega el texto tal cual si la fecha no existe, para que la validación la rechace', async () => {
    const { user } = renderizar(<Controlado />);
    await user.type(screen.getByLabelText('Fecha'), '31021990');
    expect(screen.getByLabelText('valor')).toHaveTextContent('31/02/1990');
  });

  it('muestra en dd/mm/aaaa un valor que cambia desde fuera', async () => {
    const { user } = renderizar(<Controlado inicial="1990-03-15" />);
    expect(screen.getByLabelText('Fecha')).toHaveValue('15/03/1990');
    await user.click(screen.getByRole('button', { name: 'Poner fecha' }));
    expect(screen.getByLabelText('Fecha')).toHaveValue('24/12/2001');
  });

  it('abre en el mes de referencia, elige un día y devuelve el foco al botón', async () => {
    const onBlur = vi.fn();
    const { user } = renderizar(<Controlado referencia="1995-06-10" onBlur={onBlur} />);
    await user.click(screen.getByRole('button', { name: 'Abrir calendario' }));
    const dialogo = screen.getByRole('dialog', { name: 'Elegir fecha' });
    expect(screen.getByRole('combobox', { name: 'Mes' })).toHaveDisplayValue(/junio/i);
    expect(screen.getByRole('combobox', { name: 'Año' })).toHaveValue('1995');
    expect(dialogo.querySelector('[data-fecha="1995-06-10"]')).toHaveFocus();

    await user.click(screen.getByRole('button', { name: /20 de junio de 1995/ }));
    expect(screen.getByLabelText('valor')).toHaveTextContent('1995-06-20');
    expect(screen.getByLabelText('Fecha')).toHaveValue('20/06/1995');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Abrir calendario' })).toHaveFocus();
    expect(onBlur).toHaveBeenCalled();
  });

  it('cambia de mes y de año con los selectores', async () => {
    const { user } = renderizar(<Controlado referencia="1995-06-10" />);
    await user.click(screen.getByRole('button', { name: 'Abrir calendario' }));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Año' }), '1972');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Mes' }), '2');
    await user.click(screen.getByRole('button', { name: /29 de febrero de 1972/ }));
    expect(screen.getByLabelText('valor')).toHaveTextContent('1972-02-29');
  });

  it('se mueve con las flechas y cierra con Escape', async () => {
    const { user } = renderizar(<Controlado inicial="2000-01-31" />);
    await user.click(screen.getByRole('button', { name: 'Abrir calendario' }));
    expect(document.querySelector('[data-fecha="2000-01-31"]')).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(document.querySelector('[data-fecha="2000-02-01"]')).toHaveFocus();
    expect(screen.getByRole('combobox', { name: 'Mes' })).toHaveDisplayValue(/febrero/i);
    await user.keyboard('{ArrowDown}{Enter}');
    expect(screen.getByLabelText('valor')).toHaveTextContent('2000-02-08');

    await user.click(screen.getByRole('button', { name: 'Abrir calendario' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByLabelText('valor')).toHaveTextContent('2000-02-08');
  });

  it('no deja elegir días después del máximo', async () => {
    const { user } = renderizar(<Controlado referencia="2026-09-10" max="2026-09-26" />);
    await user.click(screen.getByRole('button', { name: 'Abrir calendario' }));
    const bloqueado = screen.getByRole('button', { name: /27 de septiembre de 2026/ });
    expect(bloqueado).toHaveAttribute('aria-disabled', 'true');
    await user.click(bloqueado);
    expect(screen.getByLabelText('valor')).toHaveTextContent('');
    expect(screen.getByRole('button', { name: 'Mes siguiente' })).toBeDisabled();
  });
});
