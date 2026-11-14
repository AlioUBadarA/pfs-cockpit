// Adresse de l'API (service Render). Centralisée ici pour être partagée par le client
// axios et par la sonde de disponibilité, sans import circulaire.
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://gcr-3qft.onrender.com'
