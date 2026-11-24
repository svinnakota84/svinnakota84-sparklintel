import React, { useState } from "react";
import type { PlaceableFurnitureSpec } from "../types";

const shapes = {
  Sofa: "boucle-sofa",
  Chair: "swivel-chair",
  "Dining table": "travertine-dining",
  "Coffee table": "travertine-coffee",
  Cabinet: "fluted-credenza",
} as const;

export function VendorFurnitureForm({
  vendor,
  onPlace,
}: {
  vendor: { title: string; url: string };
  onPlace: (item: PlaceableFurnitureSpec) => void;
}) {
  const [error, setError] = useState("");

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const values = new FormData(event.currentTarget);
    const name = String(values.get("name")).trim();
    const listing = URL.canParse(String(values.get("url"))) ? new URL(String(values.get("url"))) : null;
    const vendorHost = new URL(vendor.url).hostname.replace(/^www\./, "");
    const listingPath = listing?.pathname.toLowerCase() ?? "";
    if (!listing || listing.protocol !== "https:" || listing.username || listing.password || listing.port ||
      listing.hostname.replace(/^www\./, "") !== vendorHost ||
      (vendorHost === "instagram.com" && !/^\/(?:p|reel)\/[a-z0-9_-]+\/?$/.test(listingPath))) {
      setError(vendorHost === "instagram.com"
        ? "Enter an HTTPS link to an Instagram post or reel from the vendor’s showroom."
        : `Enter an HTTPS listing link from ${vendorHost}.`);
      return;
    }
    if (!name) {
      setError("Enter the product name.");
      return;
    }

    const width = Number(values.get("width"));
    const depth = Number(values.get("depth"));
    const height = Number(values.get("height"));
    const type = String(values.get("type")) as keyof typeof shapes;
    onPlace({
      id: `vendor-${crypto.randomUUID()}`,
      name,
      collection: vendorHost === "georgebuildings.com" ? "George Buildings" : "Sophia Key Designer",
      categoryTag: type === "Cabinet" ? "Cabinets & Consoles" : type === "Dining table" ? "Dining & Stools"
        : type === "Coffee table" ? "Tables & Decor" : "Sofas & Lounge",
      vendorUrl: listing.href,
      vendorLabel: vendor.title,
      shape: shapes[type],
      dimensions: `${width} × ${depth} × ${height} cm`,
      modelSizeM: { width: width / 100, depth: depth / 100, height: height / 100 },
      materialNote: "Approximate 3D preview using the dimensions you entered.",
      primaryHex: String(values.get("color")),
      accentHex: "#50463B",
      defaultX: -1.4,
      defaultZ: 3.2,
      proOnly: true,
    });
  };

  const field = "block w-full mt-1 rounded-lg border border-black/15 bg-white p-2";
  return (
    <form onSubmit={submit} className="rounded-xl border border-black/10 bg-[#FAF9F6] p-4 space-y-3 text-sm">
      <h3 className="font-semibold">Add a product from {vendor.title}</h3>
      <p className="text-[#57534E]">Copy the listing link and measurements. The room shows an approximate 3D model sized to your measurements.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label>Product name<input className={field} name="name" required maxLength={100} /></label>
        <label>Product or post URL<input className={field} name="url" type="url" required maxLength={2048} placeholder="https://" /></label>
        <label>Furniture type<select className={field} name="type">{Object.keys(shapes).map((shape) =>
          <option key={shape}>{shape}</option>
        )}</select></label>
        <label>Preview color<input className={`${field} h-[38px]`} name="color" type="color" defaultValue="#BFA98C" /></label>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {["width", "depth", "height"].map((axis) => (
          <label key={axis}><span className="capitalize">{axis}</span> (cm)
            <input className={field} name={axis} type="number" inputMode="decimal" min="1" max="1200" step="0.1" required />
          </label>
        ))}
      </div>
      {error && <p role="alert" className="text-red-800">{error}</p>}
      <button type="submit" className="rounded-lg bg-[#141517] px-4 py-2.5 font-semibold text-white">
        Place on 3D floor
      </button>
    </form>
  );
}
