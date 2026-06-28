/**
 * Feature <b>tdee</b> — cálculo de BMR (Mifflin-St Jeor), TDEE e metas de macros conforme o objetivo.
 *
 * <p>É um <b>serviço de domínio</b>, consumido por {@code user} ao salvar/atualizar o perfil.
 * Por não ter persistência nem API próprias, materializa apenas {@code domain} (regra de cálculo)
 * e {@code application} (caso de uso). Ver {@code docs/adr/0001-arquitetura-hexagonal.md}.
 */
package com.aps.vitalpair.tdee;
