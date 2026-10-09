const VENUE_IMAGE_BY_NAME = {
  "The South PickleBall Arena": "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1400&q=75",
  "PaddleX | The Pickleball Club": "https://images.unsplash.com/photo-1611251135345-18c56206b863?auto=format&fit=crop&w=1400&q=75",
  "VT Badminton Academy": "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1400&q=75",
  "TURBO TURF": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1400&q=75",
  "Rally Masters Tennis Club": "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1400&q=75",
  "Urban Turf Arena": "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1400&q=75",
  "Marine Drive Basketball Court": "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1400&q=75",
  "Andheri Sports Turf": "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1400&q=75",
  "Powai Pickleball Hub": "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1400&q=75",
  "Knockout Boxing Academy": "https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=1400&q=75",
  "Capital Boxing Hub": "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1400&q=75",
  "Champion Boxing & Fitness": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1400&q=75",
  "AquaFit Swimming Complex": "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=1400&q=75",
  "Wave Riders Olympic Pool": "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1400&q=75",
  "Smash Vault Volleyball Arena": "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=1400&q=75",
  "Spin City Table Tennis Club": "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=1400&q=75",
  "Turfside Hockey Ground": "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1400&q=75",
  "GreenPark Cricket Nets": "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1400&q=75"
};

const IMG = (id) => id ? `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=75` : "";

export function getVenueImage(venue) {
  if (!venue) return "";
  // Override legacy demo records by venue name so old Firestore documents also show the corrected image.
  const curated = VENUE_IMAGE_BY_NAME[venue.name];
  if (curated) return curated;
  return venue.img || IMG(venue.imgId) || "";
}
