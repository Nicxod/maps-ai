import type { Metadata } from "next";
import "./globals.css";
import "./map.css";
import "leaflet/dist/leaflet.css";
export const metadata:Metadata={title:"NearMe Japan — Temukan yang dekat",description:"Rekomendasi tempat makan dan kebutuhan harian di sekitar Anda, dengan info jarak yang jujur dan mudah dipahami."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="id"><body>{children}</body></html>}
