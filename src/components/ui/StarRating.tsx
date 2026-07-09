import { useState, useCallback } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  interactive?: boolean;
  size?: "sm" | "md" | "lg";
  onRate?: (rating: number) => void;
}

export default function StarRating({
  rating,
  maxRating = 5,
  interactive = false,
  size = "md",
  onRate,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0);
  const [selectedValue, setSelectedValue] = useState(0);

  const sizeClasses = {
    sm: "w-3.5 h-3.5",
    md: "w-5 h-5",
    lg: "w-7 h-7",
  };

  const handleClick = useCallback(
    (value: number) => {
      if (!interactive) return;
      setSelectedValue(value);
      onRate?.(value);
    },
    [interactive, onRate]
  );

  const displayValue = interactive
    ? hoverValue || selectedValue || rating
    : rating;

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxRating }, (_, i) => {
        const value = i + 1;
        const filled = value <= Math.floor(displayValue);
        const halfFilled =
          !filled && value === Math.ceil(displayValue) && displayValue % 1 >= 0.5;

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => handleClick(value)}
            onMouseEnter={() => interactive && setHoverValue(value)}
            onMouseLeave={() => interactive && setHoverValue(0)}
            className={`relative ${interactive ? "cursor-pointer" : "cursor-default"} transition-transform ${
              interactive ? "hover:scale-110" : ""
            }`}
            aria-label={`Rate ${value} stars`}
          >
            <Star
              className={`${sizeClasses[size]} ${
                filled || halfFilled
                  ? "text-fire-gold fill-fire-gold"
                  : "text-text-muted"
              } transition-colors`}
            />
            {halfFilled && (
              <div className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
                <Star
                  className={`${sizeClasses[size]} text-fire-gold fill-fire-gold`}
                />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
