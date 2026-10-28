import { useState } from "react";
import { Package, Apple, Carrot, Milk, UtensilsCrossed, Fish, Sparkles } from "lucide-react";

const CATEGORY_ICONS = {
  Fruits: Apple,
  Vegetables: Carrot,
  Dairy: Milk,
  Bakery: UtensilsCrossed,
  "Meat/Fish": Fish,
  "Grocery Items": Package,
  "Prepared Meals": UtensilsCrossed,
};

export default function ProductImage({
  src,
  alt = "Product",
  className = "w-full h-full object-contain",
  containerClassName = "",
  category = "",
  iconSize = 28,
}) {
  const [hasError, setHasError] = useState(!src);

  const IconComponent = CATEGORY_ICONS[category] || Package;

  if (!src || hasError) {
    return (
      <div
        className={`w-full h-full min-h-[100px] flex flex-col items-center justify-center bg-gray-50 border border-gray-100 dark:bg-gray-900/40 dark:border-gray-800/60 rounded-xl text-gray-400 dark:text-gray-500 select-none p-3 transition-colors ${containerClassName}`}
      >
        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800/80 flex items-center justify-center mb-1.5 text-gray-400 dark:text-gray-500">
          <IconComponent size={iconSize} className="stroke-[1.5]" />
        </div>
        <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 text-center truncate max-w-[120px]">
          {category || "No image"}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
