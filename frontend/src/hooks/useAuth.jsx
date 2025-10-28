import { useSelector } from 'react-redux';
import { normalizeRole } from '../utils/roles';

export function useAuth() {
  const reduxUser = useSelector((s) => s?.user?.user);
  const reduxToken = useSelector((s) => s?.user?.accessToken);

  let ls = null;
  try {
    const raw = localStorage.getItem('auth');
    ls = raw ? JSON.parse(raw) : null;
  } catch {}

  const token = reduxToken || ls?.accessToken || null;
  const user = reduxUser || ls?.user || null;
  const role = normalizeRole(user?.role);

  return { isAuthed: !!token, role, user, token };
}