import { BIBLE_VERSION } from "./data/bible";
import { formatCount } from "./data/journeyPlans";
import type { MilestoneInfo } from "./data/milestones";
import { getFullName } from "./data/user";

const escapeXml = (text: string) => text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

// Splits text into lines of about `width` characters for the downloadable SVG.
function wrapText(text: string, width: number) {
  return text.split(" ").reduce<string[]>((lines, word) => {
    const last = lines[lines.length - 1];
    if (last !== undefined && `${last} ${word}`.length <= width) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
    return lines;
  }, []);
}

// Downloads the Certificate of Completion as an SVG with the same design as the on-screen certificate.
export function downloadCertificate(day: number, completedOn: string | undefined, info: MilestoneInfo) {
  const verseLines = wrapText(info.verse.text, 60);
  const walkLines = wrapText(info.certificateLine, 72);
  const certificate = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="850" viewBox="0 0 1200 850">
      <style>@import url("https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&amp;display=swap");</style>
      <rect width="1200" height="850" fill="#ffffff"/>
      <rect x="40" y="40" width="1120" height="770" fill="none" stroke="#172a46" stroke-width="8"/>
      <rect x="56" y="56" width="1088" height="738" fill="none" stroke="#172a46" stroke-width="2"/>
      <rect x="64" y="64" width="1072" height="722" fill="none" stroke="#172a46" stroke-width="2"/>
      <text x="600" y="175" text-anchor="middle" fill="#172a46" font-family="UnifrakturMaguntia, 'Old English Text MT', Georgia, serif" font-size="84">Certificate of Completion</text>
      <text x="600" y="245" text-anchor="middle" fill="#172a46" font-family="Georgia, serif" font-size="28">Be it known to all that</text>
      <circle cx="600" cy="335" r="82" fill="none" stroke="#dfe3e7" stroke-width="12" stroke-dasharray="2 5"/>
      <circle cx="600" cy="335" r="64" fill="none" stroke="#e5e8eb" stroke-width="3"/>
      <text x="600" y="372" text-anchor="middle" fill="#e2e5e9" font-family="UnifrakturMaguntia, Georgia, serif" font-size="104">${formatCount(day)}</text>
      <text x="600" y="360" text-anchor="middle" fill="#172a46" font-family="Georgia, serif" font-size="44" font-style="italic">${escapeXml(getFullName())}</text>
      <path d="M340 384h520" stroke="#9aa3ad" stroke-width="2"/>
      ${walkLines.map((line, index) => `<text x="600" y="${440 + index * 34}" text-anchor="middle" fill="#172a46" font-family="Georgia, serif" font-size="26">${escapeXml(line)}</text>`).join("")}
      ${verseLines.map((line, index) => `<text x="110" y="${575 + index * 25}" fill="#425166" font-family="Georgia, serif" font-size="18" font-style="italic">${escapeXml(line)}</text>`).join("")}
      <text x="110" y="${590 + verseLines.length * 25}" fill="#425166" font-family="Georgia, serif" font-size="18" font-style="italic">~ ${escapeXml(info.verse.reference)} (${BIBLE_VERSION.name})</text>
      <text x="940" y="640" text-anchor="middle" fill="#172a46" font-family="Arial, sans-serif" font-size="16" letter-spacing="2">KATHY BOSWELL</text>
      <text x="940" y="700" text-anchor="middle" fill="#172a46" font-family="Georgia, serif" font-size="52">PassageWalk<tspan font-size="18" dy="-26">®</tspan></text>
      <text x="940" y="738" text-anchor="middle" fill="#637083" font-family="Arial, sans-serif" font-size="16">Completed ${escapeXml(completedOn ?? "")}</text>
      <text x="1136" y="834" text-anchor="end" fill="#8a94a0" font-family="Arial, sans-serif" font-size="13" font-style="italic">© 2009–2013 Kathy Boswell, All Rights Reserved.</text>
    </svg>
  `;
  const file = new Blob([certificate], { type: "image/svg+xml" });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = `passagewalk-${info.shortName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-certificate.svg`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
