/**
 * Pixel Pets–style pet picker — grid of companions to choose from.
 */

import type React from "react";
import { PET_CATALOG, type PetChoice } from "../lib/pets";
import { PixelSprite } from "./PixelSprite";

interface PetPickerProps {
  value: PetChoice;
  onChange: (pet: PetChoice) => void;
}

export function PetPicker({ value, onChange }: PetPickerProps) {
  return (
    <div className="pet-picker" data-testid="pet-picker">
      <p className="pet-picker__label">Choose your companion</p>
      <div className="pet-picker__grid" role="listbox" aria-label="Pet companions">
        {PET_CATALOG.map((pet) => {
          const selected = value === pet.id;
          return (
            <button
              key={pet.id}
              type="button"
              role="option"
              aria-selected={selected}
              className={`pet-picker__tile${selected ? " pet-picker__tile--selected" : ""}`}
              data-testid={`pet-tile-${pet.id}`}
              onClick={() => onChange(pet.id)}
              style={{ "--tile-accent": pet.accent } as React.CSSProperties}
            >
              <PixelSprite pet={pet.id} animation="idle" size="sm" />
              <span className="pet-picker__tile-name">{pet.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
