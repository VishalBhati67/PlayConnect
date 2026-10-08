const LOCATION_ENDPOINT = "https://api.bigdatacloud.net/data/reverse-geocode-client";

const errorMessage = (error) => {
  if (!error) return "Unable to detect your location.";
  if (error.code === 1) return "Location permission was denied. Allow location access in your browser settings and try again.";
  if (error.code === 2) return "Your device could not determine a location. Check GPS/Wi-Fi and try again.";
  if (error.code === 3) return "Location detection timed out. Please try again.";
  return "Unable to detect your location. Please try again.";
};

export async function getLiveLocation() {
  if (typeof window === "undefined" || !window.isSecureContext) {
    throw new Error("Live location requires HTTPS. Open the deployed PlayConnect HTTPS site.");
  }
  if (!navigator.geolocation) {
    throw new Error("This browser does not support live location.");
  }

  try {
    if (navigator.permissions?.query) {
      const permission = await navigator.permissions.query({ name: "geolocation" });
      if (permission.state === "denied") {
        throw new Error("Location permission is blocked for this site. Allow Location in your browser site settings and try again.");
      }
    }
  } catch (err) {
    if (err?.message?.includes("permission is blocked")) throw err;
  }

  const position = await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
  }).catch((err) => {
    throw new Error(errorMessage(err));
  });

  const { latitude, longitude, accuracy } = position.coords;
  let place = {};

  try {
    const response = await fetch(
      `${LOCATION_ENDPOINT}?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
      { headers: { Accept: "application/json" } }
    );
    if (response.ok) place = await response.json();
  } catch {
    // Coordinates are still valid even if reverse geocoding is unavailable.
  }

  return {
    lat: latitude,
    lng: longitude,
    accuracy: Math.round(accuracy || 0),
    city: place.city || place.locality || "",
    locality: place.locality || place.city || "",
    region: place.principalSubdivision || "",
    country: place.countryName || "",
  };
}

export const formatLocationLabel = (location) => {
  if (!location) return "Current location";
  const area = location.locality && location.locality !== location.city ? `${location.locality}, ` : "";
  return [area + (location.city || ""), location.region].filter(Boolean).join(", ") || "Current location";
};
