export function discoverySections(rows) {
  const verified = rows.filter(b => b.verification_status === 'VERIFIED');
  const rated = verified.filter(b => Number.isInteger(Number(b.review_count)) && Number(b.review_count) > 0 && Number(b.rating) >= 1 && Number(b.rating) <= 5);
  const byName = (a,b) => a.name.localeCompare(b.name, 'pt-BR');
  return {
    featured: verified.filter(b => b.featured).slice(0, 6),
    topReviewed: [...rated].sort((a,b) => Number(b.review_count)-Number(a.review_count) || Number(b.rating)-Number(a.rating) || byName(a,b)).slice(0,3),
    bestRated: [...rated].sort((a,b) => Number(b.rating)-Number(a.rating) || Number(b.review_count)-Number(a.review_count) || byName(a,b)).slice(0,6),
  };
}
