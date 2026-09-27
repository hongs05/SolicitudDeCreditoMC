import { Rol } from '@credito/domain';
import { Login } from '../auth/application/login.use-case';
import { HasherFalso, SecretosFalsos, TokenIssuerFalso } from './auth-falsos';
import { RelojFijo, UnitOfWorkEnMemoria } from './en-memoria';

export function prepararAuth() {
  const uow = new UnitOfWorkEnMemoria();
  uow.repos.usuarios.agregar({ id: 1, username: 'oficial', passwordHash: 'hash:Demo2026!', rol: Rol.OFICIAL });
  const reloj = new RelojFijo();
  const secretos = new SecretosFalsos();
  const tokens = new TokenIssuerFalso();
  const opciones = { refreshTtlDias: 7 };
  const hasher = new HasherFalso();
  const login = new Login(uow, hasher, tokens, secretos, opciones, reloj);
  return { uow, reloj, secretos, tokens, opciones, hasher, login };
}
