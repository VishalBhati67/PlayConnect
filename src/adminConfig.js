export const ADMIN_EMAILS = ["jmatetest375@gmail.com"]; // your Google account
export const isUserAdmin = (u) => !!u && (u.role === "admin" || ADMIN_EMAILS.includes(u.email));