const SW_PATH = "/sw.js";

export function daftarServiceWorker(): void {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  const daftar = () => {
    void navigator.serviceWorker.register(SW_PATH).catch(() => {
      /* SW opsional: gagal daftar tidak boleh merusak SSR/UI */
    });
  };

  if (document.readyState === "complete") {
    daftar();
    return;
  }
  window.addEventListener("load", daftar, { once: true });
}

export async function hapusCacheAplikasi(): Promise<void> {
  if (typeof window === "undefined" || !("caches" in window)) return;
  const keys = await caches.keys();
  await Promise.all(
    keys.filter((k) => k.startsWith("tani-baik-")).map((k) => caches.delete(k)),
  );
}
