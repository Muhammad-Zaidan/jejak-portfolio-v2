// /app/global.d.ts

// Baris ini penting untuk memastikan file ini diperlakukan sebagai module TypeScript
export {};

// Deklarasi agar TypeScript mengenali impor file aset
declare module "*.glb";
declare module "*.png";

// Deklarasi untuk library 'meshline' yang mungkin digunakan
declare module "meshline" {
  export const MeshLineGeometry: any;
  export const MeshLineMaterial: any;
}

// Deklarasi untuk memperluas elemen JSX
declare global {
  namespace JSX {
    interface IntrinsicElements {
      meshLineGeometry: any;
      meshLineMaterial: any;
    }
  }
}
