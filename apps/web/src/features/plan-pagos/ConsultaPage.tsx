import { type FormEvent, useState } from 'react';
import { useCreditos } from '../../shared/api/creditos';
import { formatearDinero, textoPlazo } from '../../shared/format/formato';
import { useT } from '../../shared/i18n/I18nProvider';
import { BadgeEstado } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import { Field, Input } from '../../shared/ui/Campos';
import { Card } from '../../shared/ui/Card';
import { Cargando } from '../../shared/ui/Cargando';
import { TablaPlan } from './TablaPlan';

export function ConsultaPage() {
  const { t, locale } = useT();
  const [texto, setTexto] = useState('');
  const [cedula, setCedula] = useState('');
  const [elegido, setElegido] = useState<number | null>(null);
  const consulta = useCreditos({ cedula, page: 1 }, cedula !== '');
  const creditos = consulta.data?.items ?? [];
  const seleccionado = creditos.length === 1 ? creditos[0]!.id : elegido;

  const buscar = (evento: FormEvent) => {
    evento.preventDefault();
    setElegido(null);
    setCedula(texto.trim());
  };

  return (
    <div className="flex flex-col gap-6">
      <Card titulo={t('plan.buscarPorCedula')}>
        <form onSubmit={buscar} className="flex items-end gap-3">
          <Field id="cedula" etiqueta={t('campo.cedula')}>
            <Input value={texto} onChange={(e) => setTexto(e.target.value)} />
          </Field>
          <Button type="submit" disabled={!texto.trim()}>{t('comun.buscar')}</Button>
        </form>
      </Card>

      {cedula && consulta.isPending && <Cargando />}
      {cedula && consulta.isSuccess && creditos.length === 0 && (
        <p className="text-sm text-slate-600">{t('plan.sinCreditos')}</p>
      )}
      {creditos.length > 1 && (
        <Card>
          <p className="mb-3 text-sm text-slate-700">{t('plan.elegir')}</p>
          <ul className="flex flex-col gap-2">
            {creditos.map((c) => (
              <li key={c.id}>
                <Button variante={c.id === elegido ? 'primario' : 'secundario'} onClick={() => setElegido(c.id)}>
                  {c.numero} · {formatearDinero(c.monto, locale)} · {textoPlazo(c.plazo, c.periodicidad, t)}
                </Button>{' '}
                <BadgeEstado estado={c.estado} />
              </li>
            ))}
          </ul>
        </Card>
      )}
      {seleccionado !== null && <TablaPlan creditoId={seleccionado} />}
    </div>
  );
}
