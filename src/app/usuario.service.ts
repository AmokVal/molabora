import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  registrarUsuario(usuario: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, usuario);
  }

  login(credenciales: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, credenciales);
  }

  obtenerPerfil(): Observable<any> {
    const token = localStorage.getItem('token');
    const cabeceras = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get(`${this.apiUrl}/auth/me`, { headers: cabeceras });
  }

  actualizarPerfil(perfil: any): Observable<any> {
    const token = localStorage.getItem('token');
    const cabeceras = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.put(`${this.apiUrl}/auth/me`, perfil, { headers: cabeceras });
  }

  obtenerUsuarios(): Observable<any> {
    const token = localStorage.getItem('token');
    const cabeceras = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get(`${this.apiUrl}/users`, { headers: cabeceras });
  }

  obtenerChat(otherUserId: number): Observable<any> {
    const token = localStorage.getItem('token');
    const cabeceras = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get(`${this.apiUrl}/chat/${otherUserId}`, { headers: cabeceras });
  }

  enviarMensaje(otherUserId: number, message: string): Observable<any> {
    const token = localStorage.getItem('token');
    const cabeceras = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post(`${this.apiUrl}/chat/${otherUserId}`, { message }, { headers: cabeceras });
  }

    buscarUsuarios(filtro: any): Observable<any[]> {
      const token = localStorage.getItem('token');
      const cabeceras = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
      let params = '?';
      const queryParams = [];
    
      if (filtro.nombre && filtro.nombre.trim()) {
        queryParams.push(`nombre=${encodeURIComponent(filtro.nombre)}`);
      }
      if (filtro.especializacion && filtro.especializacion.trim()) {
        queryParams.push(`especializacion=${encodeURIComponent(filtro.especializacion)}`);
      }
      if (filtro.presupuestoMin && filtro.presupuestoMin !== '') {
        queryParams.push(`presupuestoMin=${filtro.presupuestoMin}`);
      }
      if (filtro.presupuestoMax && filtro.presupuestoMax !== '') {
        queryParams.push(`presupuestoMax=${filtro.presupuestoMax}`);
      }
      if (filtro.ordenar) {
        queryParams.push(`ordenar=${filtro.ordenar}`);
      }
    
      params += queryParams.join('&');
      const url = `${this.apiUrl}/users/search${params}`;
      console.log('Búsqueda URL:', url);
      console.log('Filtro enviado:', filtro);
    
      return this.http.get<any[]>(url, { headers: cabeceras });
    }

    obtenerPlanes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/premium/plans`);
  }

  crearSesionPago(planId: number): Observable<any> {
    const token = localStorage.getItem('token');
    const cabeceras = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post(`${this.apiUrl}/premium/create-checkout-session`, { planId }, { headers: cabeceras });
  }

  verificarPago(sessionId: string, planId: number): Observable<any> {
    const token = localStorage.getItem('token');
    const cabeceras = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post(`${this.apiUrl}/premium/verify-payment`, { sessionId, planId }, { headers: cabeceras });
  }

  obtenerEstadoPremium(): Observable<any> {
    const token = localStorage.getItem('token');
    const cabeceras = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get(`${this.apiUrl}/premium/status`, { headers: cabeceras });
  }

  crearContrato(profesionalId: number, descripcion: string): Observable<any> {
    const token = localStorage.getItem('token');
    const cabeceras = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post(`${this.apiUrl}/contracts`, { professional_id: profesionalId, description: descripcion }, { headers: cabeceras });
  }

  obtenerMisContratos(estado?: string): Observable<any[]> {
    const token = localStorage.getItem('token');
    const cabeceras = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    let url = `${this.apiUrl}/contracts/my-contracts`;
    if (estado) url += `?status=${estado}`;
    return this.http.get<any[]>(url, { headers: cabeceras });
  }

  obtenerContrato(id: number): Observable<any> {
    const token = localStorage.getItem('token');
    const cabeceras = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get(`${this.apiUrl}/contracts/${id}`, { headers: cabeceras });
  }

  actualizarEstadoContrato(id: number, estado: string): Observable<any> {
    const token = localStorage.getItem('token');
    const cabeceras = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.patch(`${this.apiUrl}/contracts/${id}/status`, { status: estado }, { headers: cabeceras });
  }

  obtenerTodosLosUsuarios(): Observable<any[]> {
    const token = localStorage.getItem('token');
    const cabeceras = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<any[]>(`${this.apiUrl}/moderation/users`, { headers: cabeceras });
  }

    cambiarRolUsuario(usuarioId: number, rol: string): Observable<any> {
    const token = localStorage.getItem('token');
    const cabeceras = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.patch(`${this.apiUrl}/moderation/users/${usuarioId}/role`, { role: rol }, { headers: cabeceras });
  }

  cambiarPremiumUsuario(usuarioId: number, isPremium: boolean): Observable<any> {
    const token = localStorage.getItem('token');
    const cabeceras = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.patch(`${this.apiUrl}/moderation/users/${usuarioId}/premium`, { is_premium: isPremium }, { headers: cabeceras });
  }

  banearUsuario(usuarioId: number, razon: string): Observable<any> {
    const token = localStorage.getItem('token');
    const cabeceras = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post(`${this.apiUrl}/moderation/users/${usuarioId}/ban`, { reason: razon }, { headers: cabeceras });
  }

  desbanearUsuario(usuarioId: number): Observable<any> {
    const token = localStorage.getItem('token');
    const cabeceras = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post(`${this.apiUrl}/moderation/users/${usuarioId}/unban`, {}, { headers: cabeceras });
  }

  verificarEmailManualmente(usuarioId: number): Observable<any> {
    const token = localStorage.getItem('token');
    const cabeceras = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post(`${this.apiUrl}/moderation/users/${usuarioId}/verify-email`, {}, { headers: cabeceras });
  }

    obtenerEstadisticas(): Observable<any> {
      const token = localStorage.getItem('token');
      const cabeceras = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      return this.http.get(`${this.apiUrl}/moderation/stats`, { headers: cabeceras });
    }

    reenviarVerificacion(): Observable<any> {
      const token = localStorage.getItem('token');
      const cabeceras = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      return this.http.post(`${this.apiUrl}/auth/resend-verification`, {}, { headers: cabeceras });
    }

  logout(): void {
    localStorage.removeItem('token');
  }
}