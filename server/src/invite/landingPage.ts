export function inviteLandingHtml(code: string, appSchemeUrl: string): string {
  const safeCode = escapeHtml(code);
  const safeScheme = escapeHtml(appSchemeUrl);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Join Ludi ${safeCode}</title>
  <meta http-equiv="refresh" content="0;url=${safeScheme}">
</head>
<body>
  <p>Opening Ludi room ${safeCode}.</p>
  <p><a href="${safeScheme}">Open in Ludi</a></p>
  <p><a href="https://apps.apple.com/search?term=Ludi">App Store</a></p>
  <p><a href="https://play.google.com/store/search?q=Ludi&amp;c=apps">Play Store</a></p>
  <script>window.location.replace(${JSON.stringify(appSchemeUrl)});</script>
</body>
</html>
`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
