---
type: Backlog
title: Product backlog
description: Elementos del backlog (PBI), mejoras y decisiones tomadas, con su estado.
timestamp: 2026-11-11
---

# Product backlog

Tres apartados: los **PBI** (trabajo planificado del producto), las **mejoras** (cambios más pequeños que salen al usar la app o en clase) y las **decisiones tomadas** (resumen; el detalle está en [decisiones.md](decisiones.md)). Estados: **hecho**, **en curso**, **pendiente**.

## PBI

| ID | Descripción | Sprint | Estado | Evidencia |
|---|---|---|---|---|
| PBI-22 | Tests automáticos de las fechas en lenguaje natural (Eventos y Estudio). | 2 | hecho | `servidor/reglas.test.js` (*R1*–*R9*) |
| PBI-24 | Recordatorios con Web Push, para que lleguen aunque la app esté cerrada. | 2 | hecho | `servidor/push.js`, `PUT /api/avisos/:nombre`, `POST /api/push/enviar` (Cloud Scheduler cada 5 min); tests *Push 1–2*; decisión D-18 |
| PBI-27 | Reglas de los módulos al servidor: fechas, planificador de estudio, agua, sueño, outfits y plan por meses. | 2 | hecho | `servidor/reglas.js`, `POST /api/reglas/:nombre` |
| PBI-28 | El cliente solo presenta: todas las llamadas a la API pasan por `cliente/rest.js`. | 2 | hecho | ARQ-03 en [requisitos.md](requisitos.md) |
| PBI-29 | Recuperar la contraseña por correo. | 2 | hecho | `POST /api/recuperar` y `POST /api/restablecer`; tests *Recuperar 1–3*; decisión D-16 |
| PBI-30 | Módulo opcional **Mi ciclo**: apuntar cada día el sangrado (5 niveles), las relaciones sexuales y los síntomas (más triste, antojos, dolor de pecho, granos, dolor de regla, hinchazón); predice la próxima regla, la ovulación y la ventana fértil, aprende qué síntomas se repiten y avisa por notificación. | 2 | hecho | `servidor/reglas.js` (`analizarCiclo`), `GET /api/ciclo`, `cliente/modulos-ciclo.js`; tests *C1–C7*; decisión D-17 |

## Mejoras

| Mejora | Origen | Estado | Dónde |
|---|---|---|---|
| Botón de ojo para ver u ocultar la contraseña en el login y el registro | Prueba en móvil | hecho | `cliente/index.html` (PR #11) |
| «Tu semana»: resumen de los últimos 7 días (agua, diario, gimnasio) | Idea propia | hecho | `GET /api/resumen` |
| Primer uso guiado: elegir los módulos al entrar la primera vez | Idea propia | hecho | `cliente/modulos-panel.js` |
| Menú de la cuenta en el botón de salir: descargar mis datos (todo o por módulo, JSON/CSV), salir y eliminar la cuenta | Idea propia | hecho | `GET /api/exportar`, `DELETE /api/usuarios/:email` |
| Al eliminar una cuenta se borran también sus módulos y registros | Revisión del código | hecho | `datos.borrarDatosDe()` |
| «Elegir módulos» en el menú de la cuenta, para añadir o quitar módulos después del primer uso | Al añadir Mi ciclo | hecho | `cliente/modulos-panel.js` |
| Adaptación a móvil: botones a tamaño de dedo, tablas con scroll, ventanas casi a pantalla completa | Prueba en móvil | hecho | `cliente/estilos/dasna.css` |
| Base de datos separada para las pruebas: mismo clúster, base `dasna_pruebas` | Riesgo del Sprint 2 | hecho | `servidor/logica.test.js` |
| Limitar los intentos de login por IP (10 fallos en 15 min) y las peticiones de recuperar contraseña (5 en 15 min) | Riesgo de D-15 | hecho | `servidor/limite.js`; tests *L1–L3* |
| Autenticación del despliegue sin claves (Workload Identity Federation) | D-14 | pendiente | — |
| Actualizar las acciones de GitHub que usan Node 20 (obsoleto): ahora todas corren en Node 24 | Aviso de GitHub Actions | hecho | `.github/workflows/ci.yml` |
| Franja «Hoy» arriba del Panel: vasos de agua, diario escrito o no, entreno, lo próximo de Estudio o Eventos y el día del ciclo | Idea propia | hecho | `cliente/modulos-panel.js`; test *S6* |
| Ayuda al día (foto al ticket, avisos, tus datos) y cabeceras sin emoji en Usuarios y Ayuda | Revisión final | hecho | `cliente/app.js` |

## Decisiones tomadas

| ID | Decisión | Estado |
|---|---|---|
| D-01 – D-05 | Tecnologías: Express, MongoDB Atlas, bcrypt, JWT en cookie httpOnly, HTML/CSS/JS sin framework | vigentes |
| D-06 / D-07 | Correo: Resend primero, Brevo después | D-07 vigente |
| D-08 / D-09 | Google OAuth con *authorization code*; las cuentas de Google nacen confirmadas | vigentes |
| D-10 / D-11 | Cuenta pendiente con token de 24 h; reenvío si sigue pendiente | vigentes |
| D-12 | Administrador inicial creado al arrancar | vigente |
| D-13 → D-14 | Despliegue manual sustituido por despliegue continuo con GitHub Actions | D-14 vigente |
| D-15 | El login dice si falla el correo o la contraseña, en vez de un error global | vigente |
| D-16 | Recuperar contraseña con enlace de un solo uso (1 h) y token guardado como hash | vigente |
| D-17 | Mi ciclo: módulo opcional y predicción con reglas sencillas que mejoran con más ciclos | vigente |
| D-18 | Web Push: el cliente calcula los avisos y el servidor los manda con un trabajo programado | vigente |
