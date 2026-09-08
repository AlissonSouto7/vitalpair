/**
 * Opens the visitor's mail client with a message ready to send.
 *
 * Its own module so a test can replace it: a `mailto:` link is a navigation, and jsdom
 * does not navigate. Everything else about the contact form is testable in place.
 */
export function openMailClient(url: string): void {
  window.location.assign(url)
}
