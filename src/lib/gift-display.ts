export function giftDisplayTitle(ogTitle: string | null, title: string): string {
  return ogTitle ? `${ogTitle} for ${title}` : title;
}
