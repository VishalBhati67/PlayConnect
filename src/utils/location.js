const LOCATION_ENDPOINT = "https://api.bigdatacloud.net/data/reverse-geocode-client";

const browserLocationError = (error) => {
  if (!error) return "Unable to detect your location.";
  if (error.code === 1) {
    return "Location access is blocked. In Chrome, set Location to Allow for playconnect-mocha.vercel.app, then press Try Again.";
  }
  if (error.code === 2) {
    return "Your computer could not determine a precise location. Turn on Windows Location Services and Wi-Fi, then press Try Again.";
  }
  if (error.code === 3) {
    return "Location detection timed out. Press Try Again; we will retry with a less strict GPS mode.";
  }
  return error.message || "Unable to detect your location. Please try again.";
};

const requestPosition = (options) =>
  new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });

export async function getLiveLocation() {
  if (typeof window === "undefined" || !window.isSecureContext) {
    throw new Error("Live location requires HTTPS. Open the deployed PlayConnect HTTPS site.");
  }

  if (!navigator.geolocation) {
    throw new Error("This browser does not support live location.");
  }

  // Do not block the request based on Permissions API state. Chrome can keep a
  // stale permission state until the page is retried/reloaded, while the
  // Geolocation API itself is the source of truth.
  let position;
  try {
    position = await requestPosition({
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,
    });
  } catch (firstError) {
    // Desktop Chrome may not have a GPS sensor. Retry using the browser's
    // normal Wi-Fi/network location provider before giving up.
    if (firstError?.code === 1) {
      throw new Error(browserLocationError(firstError));
    }

    try {
      position = await requestPosition({
        enableHighAccuracy: false,
        timeout: 20000,
        maximumAge: 30000,
      });
    } catch (secondError) {
      throw new Error(browserLocationError(secondError));
    }
  }

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
    updatedAt: Date.now(),
  };
}

export const formatLocationLabel = (location) => {
  if (!location) return "Current location";
  const area = location.locality && location.locality !== location.city ? `${location.locality}, ` : "";
  return [area + (location.city || ""), location.region].filter(Boolean).join(", ") || "Current location";
};
