# Análisis del Modelo Conceptual: Estado Actual vs Requerimientos

He revisado a fondo la arquitectura actual (estructura de base de datos, `ImportedSale`, `ImportedMovement` y motor de reglas de clasificación) y la he comparado con tu modelo de 9 puntos.

Aquí tienes el diagnóstico de estabilización para confirmar qué tenemos bien, qué hace falta ajustar y el plan propuesto antes de entrar a Tesorería.

---

## 1. Lo que ya está **ALINEADO** con el modelo

* **Separación de la Realidad (Punto 1 y 7):**
  La Fase 2.4 pivotó la arquitectura exactamente en esta dirección. Actualmente tenemos:
  * `ImportedSale` procesa el Excel "VENTAS" y maneja **la realidad fiscal y operativa** (línea por línea, independientemente de si el importe es 0).
  * `ImportedMovement` procesa el Excel "MOVIMIENTOS" y se mantiene aislado para la **reconciliación de tesorería** que haremos en la Fase 3.
* **Separación del Efecto Fiscal (Punto 8):**
  No clasificamos simplemente como "venta" o "movimiento". El motor de clasificación (`ClassificationRule`) deduce banderas booleanas independientes para cada fila:
  * `countsAsRevenue` (Impacto en Ingresos)
  * `generatesVat` (Impacto en IVA)
* **Comportamiento de Bonos (Punto 3):**
  * `Venta de bono` (`prepaid_voucher_sale`) -> Genera Ingreso + Genera IVA.
  * `Consumo de sesión` (`voucher_session_consumption`) -> No genera Ingreso + No Genera IVA, permitiendo importar líneas de 0€ para trazabilidad operativa.

---

## 2. Lo que requiere **REFACTORIZACIÓN O CAMBIO** (Gaps)

### A) Reversión fiscal de Tarjetas Regalo (Punto 4)
En la fase anterior implementamos el IVA diferido para tarjetas regalo. Según tu nuevo requerimiento de configuración de Koibox, debemos cambiarlo a:
* **Venta de tarjeta regalo:** *Genera Ingreso (Sí), Genera IVA (Sí).*
* **Canje de tarjeta regalo:** *Genera Ingreso (No), Genera IVA (No).* (Actuará puramente como un método de pago en Tesorería).

### B) Operaciones de Reembolso / Devoluciones (Punto 2)
Actualmente el sistema no contempla tipos operativos de "Devolución" explícitamente en el mapeo.
* **Refactor:** Añadir `product_refund` (Devolución de producto) y `service_refund` (Devolución de servicio) a los "Tipos Operativos". Sus reglas fiscales aplicarán un tratamiento estándar, pero asumiendo que el Excel de ventas los exportará con `totalAmount` en negativo (por tanto restarán automáticamente del Revenue y del VAT calculado por sumatoria).

### C) Uso de saldo de cliente (Punto 5)
Falta el concepto operativo explícito para cuando un cliente paga con saldo a favor.
* **Refactor:** Añadir `customer_balance_usage` como tipo operativo asociado a una regla fiscal que determine `countsAsRevenue = false` y `generatesVat = false`.

### D) Programa Volveremos (Punto 6)
Actualmente tenemos "Cobro de deuda". Necesitamos asegurar que el pago que ejerce el Ayuntamiento en diferido no intervenga en las ventas (ya que "VENTAS" no lo mostrará como una nueva venta, sino que el Ayuntamiento aparecerá en el Excel "MOVIMIENTOS" como una entrada bancaria).
* **Refactor:** Esto es más un impacto para la Fase 3. El Excel "VENTAS" reconocerá los 100€ de la venta fiscal hoy (usando tu ejemplo). Y el sistema de tesorería cuadrará esos 80€ hoy y 20€ el mes que viene. A nivel de arquitectura de Ventas, estamos preparados.

---

## 3. Plan de Refactorización (Fase 2.5: Corrección del Modelo Básico)

Si apruebas este diagnóstico, ejecutaré los siguientes cambios de inmediato para sellar la lógica:

1. **Modificar `schema.prisma` y `actions/mapping.ts`:**
   * Actualizar el comportamiento booleano de `gift_card_sale` y `gift_card_redemption` para el IVA.
   * Añadir los tipos operativos faltantes al enum virtual: `service_refund`, `product_refund`, `customer_balance_usage`.
   * Añadir las reglas fiscales equivalentes en el backend.
2. **Actualizar el Modal de Interfaz UI (`MappingModal.tsx`, `RulesTable.tsx`):**
   * Incluir los nuevos tipos operativos "Devolución de Servicio", "Devolución de Producto" y "Uso de Saldo de Cliente" en los selectores.
3. **Validar las operaciones matemáticas del Dashboard:**
   * Asegurar que si una cantidad entra con símbolo negativo (devolución), el `aggregate _sum` de Prisma lo reste naturalmente del Revenue y del IVA.

¿Estás de acuerdo con este análisis y te parece bien que proceda con este refactor inmediato para dejar la base del modelo 100% como solicitas?
