/**
 * Where a message actually goes.
 *
 * Its own module because the form and the sidebar both show it, and a second copy is how the
 * two end up pointing at different addresses. Separate from the components for the usual
 * reason: a file exporting both breaks hot reload.
 */
export const MAIL = 'contato@vitalpair.app'
